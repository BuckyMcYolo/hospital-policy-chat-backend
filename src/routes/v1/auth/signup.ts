import { Handler } from "express"

export const post: Handler = (req, res) => {
	res.status(200).json({
		message: "Auth route POST",
	})
}
