import { Message, StreamData, streamToResponse } from "ai"
import { Handler, Request, Response } from "express"
import { LlamaIndexStream } from "../../../../utils/llama-index-stream.js"
import { createCallbackManager } from "../../../../utils/stream-helper.js"
import {
	BaseToolWithCall,
	QueryEngineTool,
	OpenAIAgent,
	ChatMessage,
	MessageContent,
	VectorStoreIndex,
	Settings
} from "llamaindex"
import { convertMessageContent } from "../../../../utils/convertAiMessage.js"
import { initSettings } from "../../../../llama-index/settings.js"
import { initPineconeClient } from "../../../../lib/pinecone/initPineconeClient.js"

export const post: Handler = async (req, res) => {
	try {
		initSettings()
		const { messages, data }: { messages: Message[]; data: any } = req.body
		const userMessage = messages.pop()
		// console.log(messages)
		if (!messages || !userMessage || userMessage.role !== "user") {
			return res.status(400).json({
				error: "messages are required in the request body and the last message must be from the user"
			})
		}

		// Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
		const userMessageContent = convertMessageContent(
			userMessage.content as string,
			data?.imageUrl
		)

		//Should I use router query engine here instead of tools?
		const tools: BaseToolWithCall[] = []

		//init pinecone client
		const policyIndex = await initPineconeClient(
			"hospital-policies",
			"hospital-policies"
		)
		const suppliesIndex = await initPineconeClient(
			"hospital-policies",
			"supplies-location"
		)

		const policyVectorStore =
			await VectorStoreIndex.fromVectorStore(policyIndex)

		const suppliesVectorStore =
			await VectorStoreIndex.fromVectorStore(suppliesIndex)

		if (policyIndex) {
			tools.push(
				new QueryEngineTool({
					queryEngine: policyVectorStore.asQueryEngine({
						similarityTopK: 2 //2 is the default amount of sources to query for
					}),
					//TODO: add custom retreiver in the query engine
					metadata: {
						name: "hospital_policies",
						description: `A query engine for Q&A on hospital policies. Use this query engine to find information on hospital policies and procedures. You may use this query engine to find what supplies a user needs for a procedure.`
					}
				})
			)
		}

		if (suppliesIndex) {
			tools.push(
				new QueryEngineTool({
					queryEngine: suppliesVectorStore.asQueryEngine(),
					metadata: {
						name: "hospital_supplies_location",
						description: `A query engine for Q&A on hospital supplies locations. Only use this query engine to find information on hospital supplies locations. Not for what supplies a user might need for a procedure.`
					}
				})
			)
		}

		const chatEngine = new OpenAIAgent({
			tools: tools,
			systemPrompt:
				"You am a helpful assistant named Ava. You are helping a user find information on hospital policies and supplies locations.  Don't answer any questions that are out of scope.",
			chatHistory: messages as ChatMessage[]
		})

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
			parserOptions: {
				image_url: data?.imageUrl
			}
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
