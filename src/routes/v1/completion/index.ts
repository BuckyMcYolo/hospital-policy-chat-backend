// import { createOpenAI } from "@ai-sdk/openai"
// // import { generateText } from "ai"
// import { Handler } from "express"

// const openai = createOpenAI({
// 	baseURL: "https://api.groq.com/openai/v1",
// 	apiKey: process.env.GROQ_API_KEY
// })

// export const post: Handler = async (req, res) => {
// 	const { prompt } = req.body

// 	const model = openai("llama3-8b-8192")

// 	const response = await generateText({
// 		model,
// 		prompt,
// 		temperature: 0.5
// 	})

// 	res.status(200).json(response.text)
// }
