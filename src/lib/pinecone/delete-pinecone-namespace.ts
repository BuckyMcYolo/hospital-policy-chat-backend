import { env } from "../../utils/config.js"
import { initPineconeClient } from "./initPineconeClient.js"

export async function deletePineconeNamespace(namespace: string) {
	// init pinecone client
	const pineconeClient = await initPineconeClient(
		env.PINECONE_INDEX_NAME || "hospital-policies",
		"supplies-location-v2"
	)

	const deleteAll = (await pineconeClient.index()).deleteAll()

	console.log("Deleted all documents from namespace", namespace)

	return deleteAll
}

deletePineconeNamespace("supplies-location-v2")
