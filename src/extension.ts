import * as vscode from "vscode"

import { searchInput, editEntry, exceptionsUsability } from "./bugout/actions"
import { bugoutGetSearchResults, bugoutGetJournalEntries } from "./bugout/calls"
import { SearchResultsProvider, SearchResultsProvider2, getWebviewOptions, ListProvider } from "./bugout/providers"
import { bugoutJournal } from "./bugout/settings"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	/*
	VS Code API: https://code.visualstudio.com/api/references/vscode-api
	*/
	// console.log(vscode.window.activeTextEditor)
	// console.log(context.workspaceState)

	// Create your objects - Needs to be a well-formed JSON object.
	let bugoutWebView: vscode.WebviewPanel | undefined = undefined
	let bugoutsearchResultsProvider = new SearchResultsProvider()

	// Side bar Bugout Tree View
	const bugoutListProvider = new ListProvider(context)
	vscode.window.registerTreeDataProvider("bugoutView", bugoutListProvider)
	vscode.commands.registerCommand("bugoutView.refresh", () => bugoutListProvider.refresh())
	vscode.commands.registerCommand("extension.select", (journal) =>
		bugoutListProvider.select(journal, bugoutWebView, bugoutsearchResultsProvider)
	)

	// Register to revive panel in future
	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(SearchResultsProvider2.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`)
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri)
				SearchResultsProvider2.revive(webviewPanel, context.extensionUri)
			}
		})
	}
	// vscode.commands.registerCommand("bugoutView.select", () => console.log("123"))
	// const bugoutTreeView = vscode.window.createTreeView("bugoutView", {
	// 	treeDataProvider: bugoutListProvider
	// })
	// context.subscriptions.push(bugoutTreeView)

	// Palette commands
	vscode.commands.registerCommand("Bugout.search", () => {
		searchInput(context, bugoutWebView, bugoutsearchResultsProvider)
	})
	vscode.commands.registerCommand("Bugout.addEntry", () => {
		editEntry(context, context.extensionUri, bugoutWebView, bugoutsearchResultsProvider)
	})

	// Exceptions search Hover
	if (bugoutJournal) {
		let errorsSearchResults = await bugoutGetSearchResults(bugoutJournal, "#type:error")
		let exceptions: string[] = []
		errorsSearchResults.results.forEach((journal) => {
			journal.tags.forEach((tag) => {
				if (tag.startsWith("error:")) {
					exceptions.push(tag.slice(6))
				}
			})
		})

		const languages = ["python", "typescript"]
		languages.forEach((language) => {
			vscode.languages.registerHoverProvider(
				{ language: language },
				{
					async provideHover(
						document: vscode.TextDocument,
						position: vscode.Position,
						token: vscode.CancellationToken
					) {
						return await exceptionsUsability(document, position, token, exceptions)
					}
				}
			)
		})
	}
	// vscode.languages.registerReferenceProvider(documentSelector, {
	// 	provideReferences(
	// 		document: vscode.TextDocument,
	// 		position: vscode.Position,
	// 		options: { includeDeclaration: boolean },
	// 		token: vscode.CancellationToken
	// 	): any {
	// 		console.log(123)
	// 	}
	// })

	// // Register go to definiton provider
	// vscode.languages.registerDefinitionProvider(documentSelector, {
	// 	provideDefinition(
	// 		document: vscode.TextDocument,
	// 		position: vscode.Position,
	// 		token: vscode.CancellationToken
	// 	): any {
	// 		console.log("qwe")
	// 	}
	// })

	// Triggers when you are type this symbol
	// vscode.languages.registerSignatureHelpProvider({language: "python"}, {
	// 	provideSignatureHelp(
	// 		document: vscode.TextDocument,
	// 		position: vscode.Position,
	// 		token: vscode.CancellationToken
	// 	): vscode.SignatureHelp {
	// 		console.log("test")
	// 		const SignatureHelp = new vscode.SignatureHelp()
	// 		return SignatureHelp
	// 	}
	// }, ")")
}

export async function deactivate(): Promise<void> {}
