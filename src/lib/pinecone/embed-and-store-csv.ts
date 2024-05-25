import {
	SimpleDirectoryReader,
	VectorStoreIndex,
	Settings,
	OpenAIEmbedding,
	storageContextFromDefaults,
	SimpleNodeParser,
	SentenceSplitter
} from "llamaindex"
import { initSettings } from "../../llama-index/settings.js"
import { env } from "../../utils/config.js"
import { initPineconeClient } from "./initPineconeClient.js"
import { DocStoreStrategy } from "llamaindex/ingestion/strategies/index"
import { formatInventoryData } from "../../utils/textFormattingFunctions.js"

export async function embedAndStoreCSV() {
	// initSettings()
	const reader = new SimpleDirectoryReader()

	const documents = await reader.loadData("src/docs")

	const document = documents[0]

	// for (const text of document.text) {
	// 	console.log(text)
	// }

	// console.log(document.getText())

	const text = formatInventoryData(document.text)
	const newLineText = text.join("\n")

	console.log(text)
	console.log(newLineText)
	// return

	document.text = newLineText

	Settings.embedModel = new OpenAIEmbedding({
		model: env.EMBEDDING_MODEL ?? process.env.EMBEDDING_MODEL,
		apiKey: env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
		dimensions: env.EMBEDDING_DIM ?? 1536
	})

	//use custom node parser for a csv splitting into 50 line chunks
	Settings.nodeParser = new SimpleNodeParser({
		textSplitter: new SentenceSplitter({
			chunkSize: 500,
			chunkOverlap: 100,
			paragraphSeparator: "\n"
		})
	})

	const index = await VectorStoreIndex.fromDocuments([document], {})

	console.log("Index:", index)

	const queryEngine = index.asQueryEngine()

	const query = "Where can i find the kit drainage pleurevac 8.5f"

	const { response, sourceNodes } = await queryEngine.query({
		query
	})

	console.log("Results:", response)
	console.log("Source Nodes:", sourceNodes)

	const namespace = "supplies-location-v2"

	// init pinecone client
	const pineconeClient = await initPineconeClient(
		env.PINECONE_INDEX_NAME || "hospital-policies",
		namespace
	)

	const vectoreStoreContext = await storageContextFromDefaults({
		vectorStore: pineconeClient
	})

	await VectorStoreIndex.fromDocuments(documents, {
		storageContext: vectoreStoreContext
	})

	console.log(
		`Successfully created vector store context in index ${env.PINECONE_INDEX_NAME} and namespace ${namespace}`
	)
}

embedAndStoreCSV()
