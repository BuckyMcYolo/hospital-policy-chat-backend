import { Handler } from "express"
import { createClient } from "@deepgram/sdk"
import fs from "fs"
import OpenAI from "openai"

const openai = new OpenAI()

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const post: Handler = async (req, res) => {
	// req.body will be a Buffer containing all the WAV data
	const wavBuffer = req.body as Buffer

	console.log("Received WAV data:", wavBuffer.length, "bytes")
	console.log(
		"First 44 bytes:",
		Buffer.from(wavBuffer)
			.slice(0, 44)
			.toString("hex")
			.match(/.{2}/g)
			?.join(" ")
	)

	// Let's verify the full WAV structure
	if (wavBuffer.length < 44) {
		console.error("WAV file too short")
		res.status(400).send("Invalid WAV file")
		return
	}

	const audioBase64 = wavBuffer.toString("base64")

	// Create a buffer from the base64 string
	const audioBuffer = Buffer.from(audioBase64, "base64")

	try {
		const { result, error } =
			await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
				model: "nova-2-general",
				smart_format: true,
				punctuate: true,
				language: "en-US"
			})
		if (error) {
			console.error("Error transcribing audio:", error)
			res.status(500).send("Error transcribing audio")
			return
		}

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are responding to a user commuinicating via voice through an ESP32 device. The user command may be slightly distorted due to speech to text errros. Please keep that in mind. Please repond with short and concise answers."
				},
				{
					role: "user",
					content:
						result.results.channels[0].alternatives[0].transcript
				}
			],
			temperature: 0.7,
			max_tokens: 200
		})

		res.status(200).send(response.choices[0].message.content)
	} catch (e) {
		console.error("Error transcribing audio:", e)
		res.status(500).send("Error transcribing audio")
		return
	}
}
