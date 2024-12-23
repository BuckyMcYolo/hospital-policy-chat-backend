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
const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY!)
let keepAlive: NodeJS.Timeout | null = null

const setupDeepgram = (ws: WebSocket): LiveClient => {
	const deepgram = deepgramClient.listen.live({
		language: "en-US",
		punctuate: true,
		smart_format: true,
		model: "nova-2",
		endpointing: 1500
		// interim_results: true,
		// utterance_end_ms: 1000
		// vad_events: true
	})

	if (keepAlive) {
		clearInterval(keepAlive)
	}

	keepAlive = setInterval(() => {
		console.log("deepgram: keepalive")
		if (deepgram.getReadyState() === 1) {
			// Check if connection is open
			deepgram.keepAlive()
		}
	}, 3000)

	deepgram.addListener(LiveTranscriptionEvents.Open, async () => {
		console.log("deepgram: connected")

		deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
			console.log("deepgram: transcript received")
			console.log("ws: transcript sent to client")
			ws.send(JSON.stringify(data))
		})

		deepgram.addListener(LiveTranscriptionEvents.Close, async () => {
			console.log("deepgram: disconnected")
			if (keepAlive) {
				clearInterval(keepAlive)
			}
		})

		deepgram.addListener(
			LiveTranscriptionEvents.Error,
			async (error: Error) => {
				console.log("deepgram: error received")
				console.error(error)
			}
		)

		deepgram.addListener(
			LiveTranscriptionEvents.Warning,
			async (warning: string) => {
				console.log("deepgram: warning received")
				console.warn(warning)
			}
		)

		deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
			console.log("deepgram: metadata received")
			console.log("ws: metadata sent to client")
			ws.send(JSON.stringify({ metadata: data }))
		})
	})

	return deepgram
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
	let deepgram: LiveClient | null = setupDeepgram(ws)

	if (!deepgram) {
		console.error("ws: deepgram connection failed")
		return
	}

	ws.on("message", (message) => {
		console.log("ws: client data received", message)

		if (deepgram && deepgram.getReadyState() === 1 /* OPEN */) {
			console.log("ws: data sent to deepgram")
			//@ts-ignore
			deepgram.send(message)
		} else if (
			deepgram &&
			deepgram.getReadyState() >= 2 /* 2 = CLOSING, 3 = CLOSED */
		) {
			console.log("ws: data couldn't be sent to deepgram")
			console.log("ws: retrying connection to deepgram")
			/* Attempt to reopen the Deepgram connection */
			deepgram.removeAllListeners()
			deepgram = setupDeepgram(ws)
		} else {
			console.log("ws: data couldn't be sent to deepgram")
		}
	})

	ws.on("close", () => {
		console.log("ws: client disconnected")
		if (deepgram) {
			deepgram.finish()
			deepgram.removeAllListeners()
			deepgram = null
		}
	})
})

wss.on("error", (error) => {
	console.error("ws: error", error)
})

wss.on("close", () => {
	console.log("ws: server closed")
})
