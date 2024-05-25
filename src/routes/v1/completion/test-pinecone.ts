import fs from "node:fs/promises"

import {
	Document,
	MetadataMode,
	NodeWithScore,
	VectorStoreIndex
} from "llamaindex"
import { Handler } from "express"

export const post: Handler = async (req, res) => {
	// Load essay from abramov.txt in Node
	const path = "node_modules/llamaindex/examples/abramov.txt"

	const essay = await fs.readFile(path, "utf-8")

	// Create Document object with essay
	const document = new Document({ text: essay, id_: path })

	console.log("document", document)

	// Split text and create embeddings. Store them in a VectorStoreIndex
	const index = await VectorStoreIndex.fromDocuments([document], {
		logProgress: true
	})

	console.log("index", index)

	// Query the index
	const queryEngine = index.asQueryEngine()

	console.log(queryEngine)

	const { response, sourceNodes } = await queryEngine.query({
		query: "What is the author most known for?"
	})

	console.log("sourceNodes", sourceNodes)

	// Output response with sources
	console.log(response)

	if (sourceNodes) {
		sourceNodes.forEach((source: NodeWithScore, index: number) => {
			console.log(
				`\n${index}: Score: ${source.score} - ${
					source.node.relationships.NEXT
				}- ${source.node.getContent(MetadataMode.EMBED)}...\n`
			)
		})
	}

	res.status(200).json(response)
}
