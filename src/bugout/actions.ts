import * as vscode from "vscode"

import { bugoutGetSearchResults } from "./calls"
import { bugoutSpireUrl, bugoutJournal } from "./settings"

export async function exceptionsUsability(
	document: vscode.TextDocument,
	position: vscode.Position,
	token: vscode.CancellationToken,
	exceptions: string[]
): Promise<vscode.Hover | null> {
	/*
	Check if hovered word is from Exceptions class, 
	search across Bugout knowledgebase and return the number of appeals.
	*/
	if (bugoutJournal === undefined) {
		return new vscode.Hover("Please set at least one Bugout journal ID in settings")
	}

	const wordRange = document.getWordRangeAtPosition(position)
	const text = document.getText(wordRange)

	if (exceptions.includes(text)) {
		let searchResults = await bugoutGetSearchResults(bugoutJournal, `#error:${text}`)
		console.log(`#error:${text}`)
		console.log(searchResults)
		const hoverContents = `
Python exception: **${text}** occurred: ${searchResults.total_results}\n
Last exception recieved ${searchResults.results[0].created_at}:\n
${searchResults.results[0].title} available by link: ${bugoutSpireUrl}/journals/${bugoutJournal}/search?q=#error:${text}&content=true
`
		return new vscode.Hover(hoverContents)
	} else {
		console.log("Not an exception")
		return null
	}
}
