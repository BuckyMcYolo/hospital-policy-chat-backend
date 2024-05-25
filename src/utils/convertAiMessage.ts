import { MessageContent } from "llamaindex"

export const convertMessageContent = (
	textMessage: string,
	imageUrl: string | undefined
): MessageContent => {
	if (!imageUrl) return textMessage
	return [
		{
			type: "text",
			text: textMessage,
		},
		{
			type: "image_url",
			image_url: {
				url: imageUrl,
			},
		},
	]
}
