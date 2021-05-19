import * as vscode from "vscode"

import { exceptionsUsabilityHover, receiveHumbugExceptions } from "./providers/exceptionHovers"
import { EntryDocumentContentProvider, uploadImage } from "./providers/entryProvider"
import { BugoutSearchResultsProvider, bugoutGetWebviewOptions } from "./providers/searchProvider"
import { BugoutTreeProvider } from "./providers/treeProvider"
import BugoutSettings from "./utils/settings"

export function registerAuthSetup(): void {
	const settings = BugoutSettings.instance

	vscode.commands.registerCommand("Bugout.setToken", async () => {
		const tokenInput = await vscode.window.showInputBox()
		await settings.storeAuthData(tokenInput, undefined)
	})
	vscode.commands.registerCommand("Bugout.setHumbugJournalId", async () => {
		const humbugJournalIdInput = await vscode.window.showInputBox()
		await settings.storeAuthData(undefined, humbugJournalIdInput)
	})
}

export async function registerBugoutTree(context: vscode.ExtensionContext): Promise<void> {
	/*
    Side bar Bugout Tree View.

    TODO(kompotkot): Implement schema checks as for TextDocumentContentProvider
    */
	const settings = BugoutSettings.instance
	const currentAuthSettings = await settings.getAuthData()
	const accessToken = currentAuthSettings.access_token

	if (accessToken) {
		const bugoutTreeProvider = new BugoutTreeProvider(context, accessToken)
		vscode.window.registerTreeDataProvider("bugoutView", bugoutTreeProvider)
		vscode.commands.registerCommand("bugoutView.refresh", () => bugoutTreeProvider.refresh())
		vscode.commands.registerCommand("extension.select", (journal) => bugoutTreeProvider.bugoutSelect(journal))
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
	} else {
		console.log("Token is not specified")
	}
}

export async function registerEntryEditor(): Promise<void> {
	/*
    Entry editor logic.
    */
	const settings = BugoutSettings.instance
	const currentAuthSettings = await settings.getAuthData()
	const accessToken = currentAuthSettings.access_token

	if (accessToken) {
		const entryProvider = new EntryDocumentContentProvider()
		vscode.workspace.registerTextDocumentContentProvider(settings.scheme, entryProvider)
		vscode.commands.registerCommand("Bugout.createEntry", async (journalId: string) => {
			await entryProvider.bugoutCreateEntry(settings.tempRootPath, accessToken, journalId)
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
					settings.tempRootPath,
					accessToken,
					journalId,
					entryId,
					entryTitle,
					entryContent,
					entryTags
				)
			}
		)
		vscode.commands.registerCommand("Bugout.uploadImage", async () => {
			if (settings.tempRootPath && accessToken) {
				await uploadImage(settings.tempRootPath, accessToken)
			}
		})
	} else {
		console.log("Token is not specified")
	}
}

export async function registerHumbugHover() {
	/*
    Exceptions and crash reports Hover search.
    */
	const settings = BugoutSettings.instance
	const currentAuthSettings = await settings.getAuthData()
	const accessToken = currentAuthSettings.access_token
	const humbugJournalId = currentAuthSettings.humbug_journal_id

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
		} catch (err) {
			console.log("Provided token does not have access to this Crash reports journal. " + err)
		}
	} else {
		console.log("Token or Crash Reports journal ID are not specified")
	}
}
