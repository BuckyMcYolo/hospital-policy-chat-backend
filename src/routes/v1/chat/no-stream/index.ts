import { Handler } from "express"
import {
	BaseToolWithCall,
	QueryEngineTool,
	OpenAIAgent,
	ChatMessage,
	MessageContent,
	VectorStoreIndex
} from "llamaindex"
import { convertMessageContent } from "../../../../utils/convertAiMessage.js"
import { initSettings } from "../../../../llama-index/settings.js"
import { initPineconeClient } from "../../../../lib/pinecone/initPineconeClient.js"

export const post: Handler = async (req, res) => {
	try {
		initSettings()
		const { messages, data }: { messages: ChatMessage[]; data: any } =
			req.body
		const userMessage = messages.pop()
		console.log(messages)
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

		const policyVectorStore = await VectorStoreIndex.fromVectorStore(
			policyIndex
		)

		const suppliesVectorStore = await VectorStoreIndex.fromVectorStore(
			suppliesIndex
		)

		if (policyIndex) {
			tools.push(
				new QueryEngineTool({
					queryEngine: policyVectorStore.asQueryEngine({
						similarityTopK: 2 //2 is the default amount of sources to query for
					}),
					//TODO: add custom retreiver in the query engine
					metadata: {
						name: "hospital_policies_",
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
						name: "data_query_engine",
						description: `A query engine for Q&A on hospital supplies locations. Only use this query engine to find information on hospital supplies locations. Not for what supplies a user might need for a procedure.`
					}
				})
			)
		}

		const chatEngine = new OpenAIAgent({
			tools: tools,
			systemPrompt:
				"You am a helpful assistant named Ava. You are helping a user find information on hospital policies and supplies locations.  Don't answer any questions that are out of scope.",
			chatHistory: messages
		})

		// // Calling LlamaIndex's ChatEngine to get a response
		const { response, sources } = await chatEngine.chat({
			chatHistory: messages,
			message: userMessageContent
			// stream: true // This is not needed for this endpoint
		})

		console.log(userMessage.content)

		// const queryEngine = policyIndex.asQueryEngine()

		// const response = await queryEngine.query({
		// 	query: userMessage.content as string,
		// })

		console.log(response)
		console.log(sources)

		type SourceDoc = {
			source: string
			line: number | null
			pageNumber: number | null
			lines: string | null
			text: string
		}

		const sourcesDoc: SourceDoc[] = []

		if (Array.isArray(sources) && sources.length > 0) {
			const nodesDict = // @ts-ignore
				sources[0].tool.queryEngine.retriever.index.indexStruct
					.nodesDict

			for (const nodeId in nodesDict) {
				if (nodesDict.hasOwnProperty(nodeId)) {
					const metadata = nodesDict[nodeId].metadata
					const text = nodesDict[nodeId].text

					console.log(metadata)

					console.log(
						`Source document: ${metadata.source}\n
						${metadata.line ? "line: " + metadata.line + "\n" : ""}
						${metadata["loc.pageNumber"] && "Page #: " + metadata["loc.pageNumber"]}
						${
							metadata["loc.lines.from"] &&
							metadata["loc.lines.to"]
								? "Lines: " +
								  metadata["loc.lines.from"] +
								  " - " +
								  metadata["loc.lines.to"]
								: ""
						}
						text: ${text}\n`
					)

					// sourcesDoc needs to be object

					sourcesDoc.push({
						source: metadata.source || metadata.file_name,
						line: metadata.line || null,
						pageNumber: metadata["loc.pageNumber"] || null,
						lines:
							metadata["loc.lines.from"] &&
							metadata["loc.lines.to"]
								? metadata["loc.lines.from"] +
								  " - " +
								  metadata["loc.lines.to"]
								: null,
						text: text.split("\n")
					})
				}
			}
		}

		// const newSources = CircularJSON.stringify(sources)
		// const t = JSON.parse(newSources)

		// Iterate through nodesDict and print metadata for each node
		// const nodesDict =
		// 	t[0].tool.queryEngine.retriever.index.indexStruct.nodesDict

		// console.log(t[0].tool.queryEngine.retriever.index.indexStruct.nodesDict)

		// const result: ChatMessage = {
		// 	role: "assistant",
		// 	content: response.response as unknown as MessageContent,
		// }

		return res.status(200).send({
			response: response as unknown as MessageContent,
			sources: sourcesDoc
		})
	} catch (error) {
		console.error("[LlamaIndex]", error)
		return res.status(500).json({
			detail: (error as Error).message
		})
	}
}
