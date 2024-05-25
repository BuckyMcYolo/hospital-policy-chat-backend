import z from "zod"
import "dotenv/config"

const envSchema = z.object({
	OPENAI_API_KEY: z.string().trim().min(1),
	PINECONE_API_KEY: z.string().trim().min(1),
	PINECONE_ENVIRONMENT: z.string().trim().min(1),
	PINECONE_INDEX_NAME: z.string().trim().min(1),
	PINECONE_NAME_SPACE: z.string().trim().min(1),
	INDEX_INIT_TIMEOUT: z.coerce.number().min(1),
	GROQ_API_KEY: z.string().trim().min(1),
	MODEL_PROVIDER: z.string().trim().min(1),
	MODEL: z.enum([
		"gpt-3.5-turbo",
		"gpt-4-turbo",
		"gpt-4-1.5-turbo",
		"gpt-4-3-turbo",
		"gpt-4-6-turbo",
		"gpt-4-12-turbo",
		"gpt-4o",
	]),
	EMBEDDING_MODEL: z.string().trim().min(1),
	EMBEDDING_DIM: z.coerce.number().min(1),
	LLM_TEMPERATURE: z.coerce.number().min(0),
	LLM_MAX_TOKENS: z.coerce.number().min(1),
	TOP_K: z.coerce.number().min(0),
})

export const env = envSchema.parse(process.env)
