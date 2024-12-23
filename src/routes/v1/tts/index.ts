import { Handler } from "express"
import { createClient } from "@deepgram/sdk"
import { ElevenLabsClient, stream } from "elevenlabs"

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

const elevenlabs = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY!
})

export const post: Handler = async (req, res) => {
	const { body, params, query } = req
	const { text } = body
	const model = "aura-asteria-en"

	const { provider } = query

	if (!text) {
		return res.status(400).json({ message: "Text is required" })
	}

	if (!provider) {
		console.log("Using Deepgram as the default provider")
	}

	console.log("Provider:", provider)

	if (provider === "elevenlabs") {
		const audioStream = await elevenlabs.generate({
			stream: true,
			voice: "cgSgspJ2msm6clMCkdW9",
			text: text,
			model_id: "eleven_flash_v2_5"
		})

		for await (const chunk of audioStream) {
			res.write(chunk)
		}

		res.end()
	} else {
		try {
			const response = await deepgram.speak.request({ text }, { model })
			const stream = await response.getStream()
			if (!stream) {
				throw new Error("Error generating audio: Stream is empty")
			}
			for await (const chunk of stream) {
				res.write(chunk)
			}
			res.end()
		} catch (error) {
			console.error(error)
			res.status(500).json({ message: "Internal Server Error" })
		}
	}
}
