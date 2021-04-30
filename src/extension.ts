import * as vscode from "vscode"

import { searchInput, editEntry, exceptionsUsability } from "./bugout/actions"
import { bugoutGetJournalEntries } from "./bugout/calls"
import { SearchResultsProvider, ListProvider } from "./bugout/providers"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	/*
	VS Code API: https://code.visualstudio.com/api/references/vscode-api
	*/
	// console.log(vscode.window.activeTextEditor)
	// console.log(context.workspaceState)

	// Create your objects - Needs to be a well-formed JSON object.
	let bugoutWebView: vscode.WebviewPanel | undefined = undefined
	let bugoutsearchResultsProvider = new SearchResultsProvider()

	// Views
	const bugoutListProvider = new ListProvider(context)
	vscode.window.registerTreeDataProvider("bugoutView", bugoutListProvider)
	vscode.commands.registerCommand("bugoutView.refresh", () => bugoutListProvider.refresh())
	vscode.commands.registerCommand("extension.select", journal =>
		bugoutListProvider.select(journal, bugoutWebView, bugoutsearchResultsProvider)
	)
	// vscode.commands.registerCommand("bugoutView.select", () => console.log("123"))
	// const bugoutTreeView = vscode.window.createTreeView("bugoutView", {
	// 	treeDataProvider: bugoutListProvider
	// })
	// context.subscriptions.push(bugoutTreeView)

	// Commands
	vscode.commands.registerCommand("Bugout.search", () => {
		searchInput(context, bugoutWebView, bugoutsearchResultsProvider)
	})
	vscode.commands.registerCommand("Bugout.addEntry", () => {
		editEntry(context, context.extensionUri, bugoutWebView, bugoutsearchResultsProvider)
	})
	vscode.commands.registerCommand(
		"Bugout.getJournalEntries",
		async (journalId) => await bugoutGetJournalEntries(journalId)
	)

	// Hovers
	let documentSelector = { language: "python" }
	vscode.languages.registerHoverProvider(documentSelector, {
		async provideHover(document: vscode.TextDocument, position: vscode.Position) {
			return await exceptionsUsability(document, position)
		}
	})
}

export async function deactivate(): Promise<void> {}
