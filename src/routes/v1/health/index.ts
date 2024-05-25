import { Handler } from "express"

export const get: Handler = (req, res) => {
	res.status(200).json({
		message: "Health route GET",
	})
}
