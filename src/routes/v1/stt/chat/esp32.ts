import { Handler } from "express"
import { createClient } from "@deepgram/sdk"
import fs from "fs"
import OpenAI from "openai"

const openai = new OpenAI()

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const post: Handler = async (req, res) => {
	// req.body will be a Buffer containing all the WAV data
	const wavBuffer = req.body

	console.log("Received WAV data:", wavBuffer.length, "bytes")

	// Example: write to a file on disk
	fs.writeFileSync("uploaded.wav", wavBuffer)
	try {
		const { result, error } =
			await deepgram.listen.prerecorded.transcribeFile(
				// path to the audio file
				fs.createReadStream("uploaded.wav"),
				// STEP 3: Configure Deepgram options for audio analysis
				{
					model: "nova-2-general",
					smart_format: true,
					punctuate: true,
					language: "en-US"
				}
			)
		if (error) {
			console.error("Error transcribing audio:", error)
			res.status(500).send("Error transcribing audio")
			return
		}
		//delete the file
		fs.unlinkSync("uploaded.wav")
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
