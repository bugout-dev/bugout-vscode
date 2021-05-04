import * as vscode from "vscode"

import { exceptionsUsabilityHover, receiveHumbugExceptions } from "./bugout/exceptionHovers"
import { EntryDocumentContentProvider } from "./bugout/entryProvider"
import { BugoutSearchResultsProvider, bugoutGetWebviewOptions } from "./bugout/searchProvider"
import { BugoutTreeProvider } from "./bugout/treeProvider"
import { bugoutHumbugJournalId } from "./bugout/settings"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const myScheme = "bugout"

	// Side bar Bugout Tree View
	// TODO(kompotkot): Implement schema checks as for TextDocumentContentProvider
	const bugoutListProvider = new BugoutTreeProvider(context)
	vscode.window.registerTreeDataProvider("bugoutView", bugoutListProvider)
	vscode.commands.registerCommand("bugoutView.refresh", () => bugoutListProvider.refresh())
	vscode.commands.registerCommand("extension.select", (journal) => bugoutListProvider.bugoutSelect(journal))
	vscode.commands.registerCommand("extension.bugoutDirectSearch", async (params) => {
		let journalId = params.journalId
		let q = params.q
		await BugoutSearchResultsProvider.searchQuery(context.extensionUri, journalId, q)
	})

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
	// TODO(kompotkot): Rewrite this to CustomTextEditor
	const entryProvider = new EntryDocumentContentProvider()
	vscode.workspace.registerTextDocumentContentProvider(myScheme, entryProvider)
	vscode.commands.registerCommand("Bugout.editEntry", async (entryResult) => {
		vscode.window.showWarningMessage(
			`The entry should start with a title: "# ${entryResult.title.slice(0, 6)}.." followed by the content`
		)
		await entryProvider.bugoutEditEntry(entryResult)
	})

	// Exceptions search Hover
	if (bugoutHumbugJournalId) {
		const exceptions = await receiveHumbugExceptions()
		const supportedLanguages = ["python", "typescript", "javascript"]
		supportedLanguages.forEach((language) => {
			vscode.languages.registerHoverProvider(
				{ language: language },
				{
					async provideHover(
						document: vscode.TextDocument,
						position: vscode.Position,
						token: vscode.CancellationToken
					) {
						return await exceptionsUsabilityHover(document, position, token, exceptions)
					}
				}
			)
		})
	}
}

export async function deactivate(): Promise<void> {}
