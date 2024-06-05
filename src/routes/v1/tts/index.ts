import { Handler } from "express"
import { createClient } from "@deepgram/sdk"

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const post: Handler = async (req, res) => {
	const { body } = req
	const { text } = body
	const model = "aura-asteria-en"
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
