import * as vscode from "vscode"
import axios from "axios"

import { bugoutGetSearchResults } from "./calls"
import { SearchResultsProvider } from "./providers"
import { bugoutSpireUrl, bugoutAccessToken, bugoutJournal } from "./settings"

export async function searchInput(
	context: vscode.ExtensionContext,
	panel: vscode.WebviewPanel | undefined,
	bugoutSearchResultsProvider: SearchResultsProvider
) {
	const query = await vscode.window.showInputBox()
	let params = { headers: { Authorization: `Bearer ${bugoutAccessToken}` } }

	const result = await axios.get(`${bugoutSpireUrl}/journals/`, params)
	const journals = result.data.journals
	let journals_options: any = []
	for (var jornal of journals) {
		journals_options.push({ label: jornal.name, picked: false, id: jornal.id })
	}
	console.log(journals)

	const selected_journal: any = await vscode.window.showQuickPick(journals_options)
	if (selected_journal === undefined) {
		return
	}
	console.log(typeof selected_journal)
	bugoutSearchResultsProvider.getSearch(context, panel, selected_journal.id, query)
}

export async function editEntry(
	context: vscode.ExtensionContext,
	extensionUri: vscode.Uri,
	panel: vscode.WebviewPanel | undefined,
	bugoutSearchResultsProvider: SearchResultsProvider
) {
	bugoutSearchResultsProvider.generateEditEntry(context, extensionUri, panel)
}

enum PythonExceptions {
	"BaseException",
	"SystemExit",
	"KeyboardInterrupt",
	"GeneratorExit",
	"Exception"
}
export async function exceptionsUsability(
	document: vscode.TextDocument,
	position: vscode.Position
): Promise<vscode.Hover | null> {
	/*
	Check if hovered word is from Exceptions class, 
	search across Bugout knowledgebase and return the number of appeals.
	*/
	if (bugoutJournal === undefined) {
		return new vscode.Hover("Please set at least one Bugout journal ID in settings")
	}

	const wordRange = document.getWordRangeAtPosition(position)
	const word: string = document.getText(wordRange)

	if (Object.values(PythonExceptions).includes(word)) {
		let searchResult = await bugoutGetSearchResults(bugoutJournal, word)
		const hoverContents = `
This is python Exception: **${word}**. Search results:\n
https://bugout.dev \n
${searchResult.results[0].content}
`
		return new vscode.Hover(hoverContents)
	} else {
		console.log("Not an exception")
		return null
	}
}
