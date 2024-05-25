import { VectorStoreIndex, IndexList } from "llamaindex"
import { PineconeVectorStore } from "llamaindex/storage/vectorStore/PineconeVectorStore"
import { env } from "../../utils/config.js"

export async function initPineconeClient(
	pineconeIndexName: string,
	pineconeNameSpaceName: string | undefined
) {
	const store = new PineconeVectorStore({
		indexName: pineconeIndexName || env.PINECONE_INDEX_NAME,
		namespace: pineconeNameSpaceName
	})

	return store
}
