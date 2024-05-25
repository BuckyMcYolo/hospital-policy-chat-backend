import { Request, Response, NextFunction } from "express"

const logger = (req: Request, res: Response, next: NextFunction) => {
	// console.log(
	// 	"Request logged: ",
	// 	req.method,
	// 	req.path,
	// 	"at",
	// 	new Date().toISOString()
	// )
	next()
	// console.log("Response status: ", res.statusCode)
	// console.log("Response headers: ", res.getHeaders())
}

export default logger
