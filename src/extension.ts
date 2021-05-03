import * as vscode from "vscode"

import { searchInput, editEntry, exceptionsUsability } from "./bugout/actions"
import { bugoutGetSearchResults, bugoutGetJournalEntries } from "./bugout/calls"
import {
	BugoutSearchResultsProvider,
	bugoutGetWebviewOptions,
	BugoutListProvider,
	EntryDocumentContentProvider
} from "./bugout/providers"
import { SearchResultsProviderOld } from "./bugout/old"
import { bugoutJournal } from "./bugout/settings"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	/*
	VS Code API: https://code.visualstudio.com/api/references/vscode-api
	*/

	// Side bar Bugout Tree View
	// TODO(kompotkot): Implement schema checks as for TextDocumentContentProvider
	const bugoutListProvider = new BugoutListProvider(context)
	vscode.window.registerTreeDataProvider("bugoutView", bugoutListProvider)
	vscode.commands.registerCommand("bugoutView.refresh", () => bugoutListProvider.refresh())
	vscode.commands.registerCommand("extension.select", (journal) => bugoutListProvider.bugoutSelect(journal))

	// Register to revive Bugout search panel in future
	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(BugoutSearchResultsProvider.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				webviewPanel.webview.options = bugoutGetWebviewOptions(context.extensionUri)
				BugoutSearchResultsProvider.revive(webviewPanel, context.extensionUri)
			}
		})
	}

	// Entry editor logic
	const myScheme = "bugout"
	const entryProvider = new EntryDocumentContentProvider()
	vscode.workspace.registerTextDocumentContentProvider(myScheme, entryProvider)
	vscode.commands.registerCommand("Bugout.editEntry", async (entryResult) => {
		await entryProvider.bugoutEditEntry(entryResult)
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

	// // // Deprecated
	// Create your objects - Needs to be a well-formed JSON object.
	let bugoutWebView: vscode.WebviewPanel | undefined = undefined
	let bugoutsearchResultsProviderOld = new SearchResultsProviderOld()
	// Palette commands
	vscode.commands.registerCommand("Bugout.search", () => {
		searchInput(context, bugoutWebView, bugoutsearchResultsProviderOld)
	})
	vscode.commands.registerCommand("Bugout.addEntry", () => {
		editEntry(context, context.extensionUri, bugoutWebView, bugoutsearchResultsProviderOld)
	})
}

export async function deactivate(): Promise<void> {}
