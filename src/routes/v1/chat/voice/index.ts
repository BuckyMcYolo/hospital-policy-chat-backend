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
	Document,
	RetrieverQueryEngine,
	SummaryIndex,
	ResponseSynthesizer,
	MetadataMode,
	TreeSummarize,
	Refine,
	SimpleResponseBuilder,
	ContextChatEngine
} from "llamaindex"
import { convertMessageContent } from "../../../../utils/convertAiMessage.js"
import { LlamaIndexStream } from "../../../../utils/llama-index-stream.js"
import { env } from "../../../../utils/config.js"
import { createClient } from "@deepgram/sdk"
import { Patient } from "./types.js"
import { createCallbackManager } from "../../../../utils/stream-helper.js"

export const post: Handler = async (req, res) => {
	try {
		const {
			messages,
			patientList
		}: { messages: ChatMessage[]; patientList: Patient[] } = req.body
		const userMessage = messages.pop()
		console.log(messages)
		if (!messages || !userMessage || userMessage.role !== "user") {
			return res.status(400).json({
				error: "messages are required in the request body and the last message must be from the user"
			})
		}

		console.log("patientList", patientList)

		if (!patientList || patientList.length === 0) {
			return res.status(400).json({
				error: "No patient data was passed in the request. Please provide patient data"
			})
		}

		// Settings.llm = new Groq({
		// 	model: "llama3-70b-8192",
		// 	maxTokens: 2000,
		// 	apiKey: env.GROQ_API_KEY!,
		// 	supportToolCall: true
		// })

		const documents: Document[] = []

		patientList.forEach((patient) => {
			const stringifiedPatient = JSON.stringify(patient)
			const patientDocument = new Document({
				text: stringifiedPatient
			})
			documents.push(patientDocument)
		})

		const index = await SummaryIndex.fromDocuments(documents)

		const retriever = index.asRetriever()

		const chatEngine = new ContextChatEngine({
			chatHistory: messages,
			retriever: retriever
		})

		const userMessageContent = convertMessageContent(
			userMessage.content as string,
			undefined
		)

		// Init Vercel AI StreamData
		const vercelStreamData = new StreamData()

		// Setup callbacks
		const callbackManager = createCallbackManager(vercelStreamData)

		// Calling LlamaIndex's ChatEngine to get a streamed response
		const response = await Settings.withCallbackManager(
			callbackManager,
			() => {
				return chatEngine.chat({
					message: userMessageContent,
					chatHistory: messages as ChatMessage[],
					stream: true
				})
			}
		)

		// Return a stream, which can be consumed by the Vercel/AI client
		const stream = LlamaIndexStream(response, vercelStreamData, {
			// parserOptions: {}
		})

		const processedStream = stream.pipeThrough(vercelStreamData.stream)

		return streamToResponse(processedStream, res)
	} catch (error) {
		console.error("[LlamaIndex]", error)
		return res.status(500).json({
			detail: (error as Error).message
		})
	}
}
