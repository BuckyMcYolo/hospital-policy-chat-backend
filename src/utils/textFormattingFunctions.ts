export function formatInventoryData(rawText: string) {
	// Split the raw text into lines
	const lines = rawText.split("\n")

	// Skip the header and iterate over each line
	const formattedSentences = lines.slice(1).map((line) => {
		if (!line.trim()) return "" // skip empty lines

		// Split the line by comma to extract individual parts
		const parts = line.split(",")

		// Trim any whitespace from each part
		const cleanedParts = parts.map((part) => part.trim())

		// Check that all parts are present
		if (cleanedParts.length !== 4) {
			return "Error in data format" // or handle as needed
		}

		// Extract each part
		const [description, location, rack, row] = cleanedParts

		// Construct the sentence
		return `${description} located in ${
			location.charAt(0).toUpperCase() + location.slice(1)
		}, rack ${rack.toUpperCase()}, row ${row}.`
	})

	return formattedSentences
}
