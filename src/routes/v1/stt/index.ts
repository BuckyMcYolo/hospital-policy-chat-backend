import { Handler } from "express"
import { createClient } from "@deepgram/sdk"

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const post: Handler = async (req, res) => {}
