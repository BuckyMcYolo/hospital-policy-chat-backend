import {
	// Anthropic,
	// GEMINI_EMBEDDING_MODEL,
	// GEMINI_MODEL,
	// Gemini,
	// GeminiEmbedding,
	OpenAI,
	OpenAIEmbedding,
	Groq,
	Settings
} from "llamaindex"
import { env } from "../utils/config.js"
import "dotenv/config"
// import { HuggingFaceEmbedding } from "llamaindex/embeddings/HuggingFaceEmbedding"
// import { OllamaEmbedding } from "llamaindex/embeddings/OllamaEmbedding"
// import { ALL_AVAILABLE_ANTHROPIC_MODELS } from "llamaindex/llm/anthropic"
// import { Ollama } from "llamaindex/llm/ollama"

const CHUNK_SIZE = 50
const CHUNK_OVERLAP = 10

export async function initSettings() {
	console.log(`Using '${env.MODEL_PROVIDER}' model provider`)

	if (!env.MODEL || !env.EMBEDDING_MODEL) {
		throw new Error(
			"'MODEL' and 'EMBEDDING_MODEL' env variables must be set."
		)
	}

	if (env.MODEL_PROVIDER === "ollama") {
		// initOllama()
	} else if (env.MODEL_PROVIDER === "anthropic") {
		// initAnthropic()
	} else if (env.MODEL_PROVIDER === "gemini") {
		// initGemini()
	} else {
		initOpenAI()
	}
	Settings.chunkSize = CHUNK_SIZE
	Settings.chunkOverlap = CHUNK_OVERLAP
}

function initOpenAI() {
	Settings.llm = new OpenAI({
		model: env.MODEL ?? "gpt-4o",
		maxTokens: env.LLM_MAX_TOKENS || 4096,
		apiKey: env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY
	})
	Settings.embedModel = new OpenAIEmbedding({
		// model: env.EMBEDDING_MODEL ?? process.env.EMBEDDING_MODEL,
		apiKey: env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY
		// dimensions: env.EMBEDDING_DIM ?? 1536,
	})
}

// function initOllama() {
// 	Settings.llm = new Ollama({
// 		model: env.MODEL ?? "",
// 	})
// 	Settings.embedModel = new OllamaEmbedding({
// 		model: env.EMBEDDING_MODEL ?? "",
// 	})
// }

// function initAnthropic() {
// 	const embedModelMap: Record<string, string> = {
// 		"all-MiniLM-L6-v2": "Xenova/all-MiniLM-L6-v2",
// 		"all-mpnet-base-v2": "Xenova/all-mpnet-base-v2",
// 	}
// 	Settings.llm = new Anthropic({
// 		model: env.MODEL as keyof typeof ALL_AVAILABLE_ANTHROPIC_MODELS,
// 	})
// 	Settings.embedModel = new HuggingFaceEmbedding({
// 		modelType: embedModelMap[env.EMBEDDING_MODEL!],
// 	})
// }

// function initGemini() {
// 	Settings.llm = new Gemini({
// 		model: env.MODEL as GEMINI_MODEL,
// 	})
// 	Settings.embedModel = new GeminiEmbedding({
// 		model: env.EMBEDDING_MODEL as GEMINI_EMBEDDING_MODEL,
// 	})
// }
