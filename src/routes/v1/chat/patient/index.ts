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
	Document
} from "llamaindex"
import { convertMessageContent } from "../../../../utils/convertAiMessage.js"
import { createCallbackManager } from "../../../../utils/stream-helper.js"
import { LlamaIndexStream } from "../../../../utils/llama-index-stream.js"
import { Admission } from "./type.js"

export const post: Handler = async (req, res) => {
	try {
		const {
			messages,
			data,
			patientwithAdmission
		}: { messages: Message[]; data: any; patientwithAdmission: Admission } =
			req.body

		const tools: BaseToolWithCall[] = []

		const userMessage = messages.pop()
		// console.log(messages)
		if (!messages || !userMessage || userMessage.role !== "user") {
			return res.status(400).json({
				error: "messages are required in the request body and the last message must be from the user"
			})
		}

		if (!patientwithAdmission) {
			return res.status(400).json({
				error: "No patient data was passed in the request. Please provide patient data"
			})
		}

		// Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
		const userMessageContent = convertMessageContent(
			userMessage.content as string,
			data?.imageUrl
		)

		const stringifiedPatient = JSON.stringify(patientwithAdmission)

		const patientDocument = new Document({
			text: stringifiedPatient
		})

		// console.log(patientDocument.toMutableJSON())

		const patientDataIndex = await VectorStoreIndex.fromDocuments([
			patientDocument
		])

		if (patientDataIndex) {
			tools.push(
				new QueryEngineTool({
					queryEngine: patientDataIndex.asQueryEngine({
						similarityTopK: 2
					}),
					metadata: {
						name: "get_patient_data",
						description:
							"Tool to query patient data about the current patient"
					}
				})
			)
		}

		const chatEngine = new OpenAIAgent({
			tools: tools,
			systemPrompt:
				"You am a helpful assistant named Ava. You are helping a user answer information for a given patient's chart. You may only answer any questions based on the provided context given to you.",
			chatHistory: messages as ChatMessage[]
		})

		// Init Vercel AI StreamData
		const vercelStreamData = new StreamData()

		const callbackManager = createCallbackManager(vercelStreamData)

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
		const stream = LlamaIndexStream(response, vercelStreamData)

		const processedStream = stream.pipeThrough(vercelStreamData.stream)

		return streamToResponse(processedStream, res)
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
		throw new Error(String(error))
	}
}
