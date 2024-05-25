// import { Handler } from "express"
// import { createOpenAI } from "@ai-sdk/openai"
// import { streamText, StreamingTextResponse } from "ai"

// export const post: Handler = async (req, res) => {
// 	try {
// 		const openai = createOpenAI({
// 			baseURL: "https://api.groq.com/openai/v1",
// 			apiKey: process.env.GROQ_API_KEY,
// 		})

// 		const { messages } = req.body

// 		console.log("Received messages:", messages)

// 		const result = await streamText({
// 			model: openai("llama3-8b-8192"),
// 			messages: messages,
// 		})

// 		const stream = result.toAIStream({
// 			onFinal(_) {
// 				console.log("Stream finalized")
// 			},
// 			onCompletion() {
// 				console.log("Stream completed")
// 			},
// 		})

// 		return new StreamingTextResponse(stream)
// 	} catch (error) {
// 		console.error("Error in POST handler:", error)
// 		res.status(500).json({
// 			error: "Internal Server Error",
// 		})
// 	}
// }
