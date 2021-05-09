import * as vscode from "vscode"

import { exceptionsUsabilityHover, receiveHumbugExceptions } from "./bugout/exceptionHovers"
import { EntryDocumentContentProvider } from "./bugout/entryProvider"
import { BugoutSearchResultsProvider, bugoutGetWebviewOptions } from "./bugout/searchProvider"
import { BugoutTreeProvider } from "./bugout/treeProvider"
import BugoutSettings from "./bugout/settings"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const myScheme = "bugout"

	BugoutSettings.init(context)
	const settings = BugoutSettings.instance
	vscode.commands.registerCommand("Bugout.setToken", async () => {
		const tokenInput = await vscode.window.showInputBox()
		await settings.storeAuthData(tokenInput, undefined)
	})
	vscode.commands.registerCommand("Bugout.setHumbugJournalId", async () => {
		const humbugJournalIdInput = await vscode.window.showInputBox()
		await settings.storeAuthData(undefined, humbugJournalIdInput)
	})
	const currentAuthSettings = await settings.getAuthData()
	const accessToken = currentAuthSettings.access_token
	const humbugJournalId = currentAuthSettings.humbug_journal_id

	// Side bar Bugout Tree View
	// TODO(kompotkot): Implement schema checks as for TextDocumentContentProvider
	if (accessToken) {
		const bugoutListProvider = new BugoutTreeProvider(context, accessToken)
		vscode.window.registerTreeDataProvider("bugoutView", bugoutListProvider)
		vscode.commands.registerCommand("bugoutView.refresh", () => bugoutListProvider.refresh())
		vscode.commands.registerCommand("extension.select", (journal) => bugoutListProvider.bugoutSelect(journal))
		vscode.commands.registerCommand("extension.bugoutDirectSearch", async (params) => {
			let journalId = params.journalId
			let q = params.q
			await BugoutSearchResultsProvider.searchQuery(context.extensionUri, accessToken, journalId, q)
		})

		// Register to revive Bugout search panel in future
		if (vscode.window.registerWebviewPanelSerializer) {
			vscode.window.registerWebviewPanelSerializer(BugoutSearchResultsProvider.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
					webviewPanel.webview.options = bugoutGetWebviewOptions(context.extensionUri)
					BugoutSearchResultsProvider.revive(webviewPanel, context.extensionUri, accessToken)
				}
			})
		}

		// Entry editor logic
		// TODO(kompotkot): Rewrite this to CustomTextEditor
		const entryProvider = new EntryDocumentContentProvider()
		vscode.workspace.registerTextDocumentContentProvider(myScheme, entryProvider)
		vscode.commands.registerCommand("Bugout.createEntry", async (journalId: string) => {
			await entryProvider.bugoutCreateEntry(accessToken, journalId)
		})
		vscode.commands.registerCommand(
			"Bugout.editEntry",
			async (
				journalId: string,
				entryId: string,
				entryTitle: string,
				entryContent: string,
				entryTags: string[]
			) => {
				await entryProvider.bugoutEditEntry(
					accessToken,
					journalId,
					entryId,
					entryTitle,
					entryContent,
					entryTags
				)
			}
		)
	}

	// Exceptions search Hover
	if (accessToken && humbugJournalId) {
		// TODO(kompotkot): Ask user to reload editor and
		// manage loading huge humbug journal
		try {
			const exceptions = await receiveHumbugExceptions(accessToken, humbugJournalId)

			const supportedLanguages = ["python", "typescript", "javascript", "go"]
			supportedLanguages.forEach((language) => {
				vscode.languages.registerHoverProvider(
					{ language: language },
					{
						async provideHover(
							document: vscode.TextDocument,
							position: vscode.Position,
							token: vscode.CancellationToken
						) {
							return await exceptionsUsabilityHover(
								document,
								position,
								token,
								accessToken,
								exceptions,
								humbugJournalId
							)
						}
					}
				)
			})
		} catch {
			console.log("Provided token does not have access to this Humbug journal")
		}
	}
}

export async function deactivate(): Promise<void> {}
