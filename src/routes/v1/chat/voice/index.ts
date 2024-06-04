import { Handler } from "express"
import { Message, StreamData, streamToResponse } from "ai"
import {
	BaseToolWithCall,
	QueryEngineTool,
	OpenAIAgent,
	ChatMessage,
	MessageContent,
	VectorStoreIndex,
	Settings,
	Groq,
	Document
} from "llamaindex"
import { convertMessageContent } from "../../../../utils/convertAiMessage.js"
import { LlamaIndexStream } from "../../../../utils/llama-index-stream.js"
import { env } from "../../../../utils/config.js"

export const post: Handler = async (req, res) => {
	try {
		const { messages, data }: { messages: ChatMessage[]; data: any } =
			req.body
		const userMessage = messages.pop()
		console.log(messages)
		if (!messages || !userMessage || userMessage.role !== "user") {
			return res.status(400).json({
				error: "messages are required in the request body and the last message must be from the user"
			})
		}

		const tools: BaseToolWithCall[] = []

		// Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
		const userMessageContent = convertMessageContent(
			userMessage.content as string,
			data?.imageUrl
		)

		Settings.llm = new Groq({
			model: "llama3-70b-8192",
			maxTokens: 4096,
			apiKey: env.GROQ_API_KEY!,
			supportToolCall: true
		})

		const chatEngine = new OpenAIAgent({
			tools: tools,
			systemPrompt:
				"You am a helpful assistant named Ava. You may answer anything",
			chatHistory: messages
		})

		// // Calling LlamaIndex's ChatEngine to get a response
		const { response, sources } = await chatEngine.chat({
			chatHistory: messages,
			message: userMessageContent
		})

		console.log(response)

		const result: ChatMessage = {
			role: "assistant",
			content: response as unknown as MessageContent
		}

		return res.status(200).json({
			result
		})
	} catch (error) {
		console.error("[LlamaIndex]", error)
		return res.status(500).json({
			detail: (error as Error).message
		})
	}
}
