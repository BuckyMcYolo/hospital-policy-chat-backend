import { Handler } from "express"
import { createClient } from "@deepgram/sdk"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const post: Handler = async (req, res) => {
	const { body } = req
	const { text } = body
	const model = "aura-luna-en"
	try {
		const filePath = await getAudio(text, model)
		// res.setHeader("Content-Type", "audio/wav")
		// res.send(filePath)
		res.json({ audioUrl: filePath })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: "Internal Server Error" })
	}
}

const getAudio = async (text: string, model: string) => {
	const response = await deepgram.speak.request({ text }, { model })
	const stream = await response.getStream()

	// have to do this bc of ES6
	// const __filename = fileURLToPath("//audio")
	// base path name
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)

	if (stream) {
		const buffer = await getAudioBuffer(stream)

		try {
			// Ensure 'audio' directory exists
			const audioDirectory = path.join(
				__dirname,
				"..",
				"..",
				"..",
				"..",
				"audio"
			)
			if (!fs.existsSync(audioDirectory)) {
				console.log("Creating audio directory")
				fs.mkdirSync(audioDirectory, { recursive: true })
			}
			console.log(path.join(audioDirectory, "audio.wav"))
			// Write audio file to 'audio' directory
			await new Promise<void>((resolve, reject) => {
				fs.writeFile(
					path.join(audioDirectory, "audio.wav"),
					buffer,
					(err) => {
						if (err) {
							console.error("Error writing audio to file:", err)
							reject(err)
						} else {
							console.log(
								`Audio file path: ${path.join(audioDirectory, "audio.wav")}`
							)
							resolve()
						}
					}
				)
			})
		} catch (err) {
			throw err
		}

		// return buffer
		return "/audio/audio.wav"
	} else {
		console.error("Error generating audio:", stream)
		throw new Error("Error generating audio: Stream is empty")
	}
}

// Helper function to convert stream to audio buffer
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
