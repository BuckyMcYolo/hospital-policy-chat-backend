import { Handler } from "express"
import { createClient } from "@deepgram/sdk"
import { ElevenLabsClient, stream } from "elevenlabs"
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
	region: "us-east-2",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
	}
})

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

const elevenlabs = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY!
})

// helper function to convert stream to audio buffer
const getAudioBuffer = async (response: ReadableStream<Uint8Array>) => {
	const reader = response.getReader()
	const chunks = []

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		chunks.push(value)
	}

	const dataArray = chunks.reduce(
		(acc, chunk) => Uint8Array.from([...acc, ...chunk]),
		new Uint8Array(0)
	)

	return Buffer.from(dataArray.buffer)
}

// Helper function to upload to S3 and get presigned URL
async function uploadToS3AndGetUrl(buffer: Buffer, filename: string) {
	const bucketName = process.env.AWS_BUCKET_NAME!
	const key = `audio/${Date.now()}-${filename}.wav`

	// Upload to S3
	const uploadCommand = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: buffer,
		ContentType: "audio/wav"
	})

	await s3Client.send(uploadCommand)

	// setTimeout(() => {
	// 	console.log(`File ${filename} uploaded to S3`)
	// }, 250)

	// Generate presigned URL
	const getCommand = new GetObjectCommand({
		Bucket: bucketName,
		Key: key
	})

	const presignedUrl = await getSignedUrl(s3Client, getCommand, {
		expiresIn: 3600 * 1 // URL expires in 1 hour
	})

	return presignedUrl
}

export const post: Handler = async (req, res) => {
	const { body, query, headers } = req
	const { text } = body
	const token = headers.authorization
	const model = "aura-asteria-en"
	const { provider } = query

	console.log("Auth token:", token)

	if (!text) {
		return res.status(400).json({ message: "Text is required" })
	}

	if (!provider) {
		console.log("Using Deepgram as the default provider")
	}

	try {
		let audioBuffer: Buffer

		if (provider === "elevenlabs") {
			const audioStream = await elevenlabs.generate({
				stream: true,
				voice: "cgSgspJ2msm6clMCkdW9",
				text: text,
				model_id: "eleven_flash_v2_5"
			})

			// Convert ElevenLabs stream to buffer
			const chunks: Uint8Array[] = []
			for await (const chunk of audioStream) {
				chunks.push(chunk)
			}
			audioBuffer = Buffer.concat(chunks)
		} else {
			// Deepgram
			const response = await deepgram.speak.request({ text }, { model })
			const stream = await response.getStream()

			if (!stream) {
				throw new Error("Error generating audio: Stream is empty")
			}

			audioBuffer = await getAudioBuffer(stream)
		}

		// Upload to S3 and get presigned URL
		const filename = `speech-${provider || "deepgram"}`
		const presignedUrl = await uploadToS3AndGetUrl(audioBuffer, filename)

		// Return the presigned URL to the client
		res.json({
			url: presignedUrl,
			message: "Audio generated and uploaded successfully"
		})
	} catch (error) {
		console.error("Error processing audio:", error)
		res.status(500).json({
			message: "Internal Server Error",
			error: error instanceof Error ? error.message : "Unknown error"
		})
	}
}
