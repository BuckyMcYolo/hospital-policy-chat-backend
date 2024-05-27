import express, { Request, Response, Express } from "express"
import helmet from "helmet"
import logger from "./middleware/logger.js"
import path from "node:path"
import cors from "cors"
import { router } from "express-file-routing"
import { fileURLToPath } from "url"
import "dotenv/config"

const app: Express = express()

const PORT = process.env.PORT || 5000
const env = process.env["NODE_ENV"]
const isDevelopment = !env || env === "development"
const prodCorsOrigin = process.env["PROD_CORS_ORIGIN"]

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(helmet()) // for security

app.use(express.text())

//init CORS
if (isDevelopment) {
	console.warn("Running in development mode - allowing CORS for all origins")
	app.use(cors())
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
	res.send("Hello World. Ping")
})

// middleware
app.use(logger)

app.listen(PORT, () =>
	console.log(`⚡️ [server]: Server is running on port ${PORT}`)
)
