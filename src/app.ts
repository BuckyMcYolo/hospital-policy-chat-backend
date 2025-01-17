import express, { Request, Response, Express } from "express"
import helmet from "helmet"
import logger from "./middleware/logger.js"
import path from "node:path"
import cors from "cors"
import { router } from "express-file-routing"
import { fileURLToPath } from "url"
import "dotenv/config"
import WebSocket, { WebSocketServer } from "ws"
import http from "node:http"
import {
	createClient,
	ListenLiveClient,
	LiveClient,
	LiveTranscriptionEvents
} from "@deepgram/sdk"

const app: Express = express()

const PORT = process.env.PORT || 5000
const env = process.env["NODE_ENV"]
const isDevelopment = !env || env === "development"
const prodCorsOrigin = process.env["PROD_CORS_ORIGIN"]

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(express.text())
app.use(express.raw({ type: "audio/wav", limit: "50mb" }))

//init CORS
if (isDevelopment) {
	console.warn("Running in development mode - allowing CORS for all origins")
	app.use(
		cors({
			origin: "*" // Allow all origins
		})
	)
} else if (prodCorsOrigin) {
	console.log(
		`Running in production mode - allowing CORS for domain: ${prodCorsOrigin}`
	)
	const corsOptions = {
		origin: prodCorsOrigin // Restrict to production domain
	}
	app.use(cors(corsOptions))
} else {
	console.warn("Production CORS origin not set, defaulting to no CORS.")
}

app.use("/audio", express.static("audio"))

// have to do this bc of ES6
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// set up file based routing
async function fileBasedRouting(app: Express) {
	app.use(
		"/",
		await router({
			directory: path.join(__dirname, "routes")
		})
	)
}

fileBasedRouting(app)

//default route
app.get("/", (req: Request, res: Response) => {
	res.send("Hello World.")
})

// middleware
app.use(logger)

const server = app.listen(PORT, () =>
	console.log(`⚡️ [server]: Server is running on port ${PORT}`)
)

const wss = new WebSocketServer({ noServer: true })

//deepgram wss
const KEEP_ALIVE_INTERVAL = 3 * 1000 // 3 seconds

const setupDeepgram = (ws: WebSocket, lang: string) => {
	const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY as string)

	console.log("Setting up Deepgram connection...")

	let keepAlive: NodeJS.Timeout | null = null

	const deepgram = deepgramClient.listen.live({
		smart_format: true,
		model: lang === "en-US" ? "nova-2-medical" : "nova-2",
		interim_results: true,
		diarize: true,
		language: lang,
		endpointing: 100
	})

	if (keepAlive) clearInterval(keepAlive)

	keepAlive = setInterval(() => {
		console.log("deepgram: keepalive")
		deepgram.keepAlive()
	}, KEEP_ALIVE_INTERVAL)

	deepgram.addListener(LiveTranscriptionEvents.Open, () => {
		console.log("Deepgram: Connected successfully")
	})

	deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
		console.log("Deepgram: Transcript received", data)
		ws.send(JSON.stringify(data))
	})

	deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
		console.log("Deepgram: Metadata received", data)
		ws.send(JSON.stringify({ metadata: data }))
	})

	deepgram.addListener(LiveTranscriptionEvents.Close, () => {
		console.log("Deepgram: Connection closed")
		if (keepAlive) {
			clearInterval(keepAlive)
		}
	})

	deepgram.addListener(LiveTranscriptionEvents.Error, (error) => {
		console.error("Deepgram: Error received", error)
		if (keepAlive) {
			clearInterval(keepAlive)
		}
		ws.send(JSON.stringify({ error: "Deepgram error occurred" }))
	})

	const finish = () => {
		if (keepAlive) {
			clearInterval(keepAlive)
			keepAlive = null
		}
		deepgram.requestClose()
		deepgram.removeAllListeners()
	}

	return {
		deepgram,
		finish
	}
}

server.on("upgrade", (req, socket, head) => {
	socket.on("error", (err) => {
		console.error(err)
	})

	wss.handleUpgrade(req, socket, head, (ws) => {
		socket.removeListener("error", console.error)
		wss.emit("connection", ws, req)
	})
})

wss.on("connection", (ws) => {
	console.log("ws: client connected")
	let { deepgram, finish } = setupDeepgram(ws, "en-US")

	let deepgramWrapper: ListenLiveClient | null = deepgram

	if (!deepgram) {
		console.error("ws: deepgram connection failed")
		return
	}

	ws.on("message", (message: WebSocket.Data) => {
		console.log("ws: client data received", message)
		if (deepgramWrapper) {
			console.log(
				`Deepgram Ready State: ${deepgramWrapper.getReadyState()}`
			)
		} else {
			console.log("Deepgram Wrapper is null")
		}
		if (
			deepgramWrapper &&
			deepgramWrapper.getReadyState() === 1 /* OPEN */
		) {
			console.log("ws: data sent to deepgram")
			//@ts-ignore
			deepgramWrapper.send(message)
		} else if (
			deepgramWrapper &&
			deepgramWrapper.getReadyState() >= 2 /* 2 = CLOSING, 3 = CLOSED */
		) {
			console.log("ws: data couldn't be sent to deepgram")
			console.log("ws: retrying connection to deepgram")
			/* Attempt to reopen the Deepgram connection */
			finish()
			// Re-initialize Deepgram connection
			const result = setupDeepgram(ws, "en-US")
			deepgramWrapper = result.deepgram
			finish = result.finish
		} else {
			console.log(
				`STT: Cannot send to Deepgram. Current state: ${
					deepgramWrapper ? deepgramWrapper.getReadyState() : "null"
				}`
			)
		}
	})

	ws.on("close", () => {
		console.log("ws: client disconnected")
		finish()
		ws.removeAllListeners() // remove all listeners
		deepgramWrapper = null
	})

	ws.on("error", (error) => {
		console.error("STT: WebSocket error", error)
		finish()
		deepgramWrapper = null
	})
})

wss.on("error", (error) => {
	console.error("ws: error", error)
})

wss.on("close", () => {
	console.log("ws: server closed")
})
