import fs from "fs"
import path from "path"

export function removeCommasFromCSV(filePath: string) {
	// Read the file content
	fs.readFile(filePath, "utf8", (err, data) => {
		if (err) {
			console.error("Error reading the file:", err)
			return
		}

		// Remove all commas from the data
		const modifiedData = data.replace(/,/g, "")

		// Write the modified data back to the file
		fs.writeFile(filePath, modifiedData, "utf8", (err) => {
			if (err) {
				console.error("Error writing the file:", err)
			} else {
				console.log("File has been saved without commas.")
			}
		})
	})
}
