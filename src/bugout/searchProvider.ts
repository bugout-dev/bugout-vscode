/*
Represents webview of Bugout journal search.
*/
import * as vscode from "vscode"

import { bugoutGetSearchResults, bugoutGetJournalEntry } from "./calls"
import { searchHTML } from "./views"

export class BugoutSearchResultsProvider {
	/*
	Journal search results panel.
	*/
	public static currentPanel: BugoutSearchResultsProvider | undefined
	public static readonly viewType = "Bugout panel"

	private readonly _panel: vscode.WebviewPanel
	private readonly _extensionUri: vscode.Uri
	private _disposables: vscode.Disposable[] = []

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private _accessToken: string) {
		this._panel = panel
		this._extensionUri = extensionUri

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

		// this._panel.onDidChangeViewState(
		// 	(e) => {
		// 		if (this._panel.visible) {
		// 			console.log("Looking on panel")
		// 		}
		// 	},
		// 	null,
		// 	this._disposables
		// )

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case "searchButton":
						await BugoutSearchResultsProvider.searchQuery(
							this._extensionUri,
							this._accessToken,
							message.data.journalId,
							message.data.q
						)
						return
					case "editEntry":
						const entryResult = await bugoutGetJournalEntry(
							this._accessToken,
							message.data.journalId,
							message.data.entryId
						)
						vscode.commands.executeCommand(
							"Bugout.editEntry",
							message.data.journalId,
							message.data.entryId,
							entryResult.title,
							entryResult.content,
							entryResult.tags
						)
						return
					case "createEntry":
						vscode.commands.executeCommand("Bugout.createEntry", message.data.journalId)
						return
				}
			},
			null,
			this._disposables
		)
	}

	public static async searchQuery(extensionUri: vscode.Uri, accessToken: string, journalId: string, q: string) {
		const searchResults = await bugoutGetSearchResults(accessToken, journalId, q, true)
		BugoutSearchResultsProvider.createOrShow(extensionUri, accessToken)
		if (BugoutSearchResultsProvider.currentPanel) {
			await BugoutSearchResultsProvider.currentPanel.doRefactor(searchResults, journalId)
		}
	}

	public static createOrShow(extensionUri: vscode.Uri, accessToken: string) {
		/*
		Generate new panel or show existing one.
		*/

		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

		if (BugoutSearchResultsProvider.currentPanel) {
			// Showing existing Bugout panel
			BugoutSearchResultsProvider.currentPanel._panel.reveal(column)
			return
		}

		// Create new Bugout panel
		const panel = vscode.window.createWebviewPanel(
			BugoutSearchResultsProvider.viewType,
			"Bugout panel",
			column || vscode.ViewColumn.One,
			bugoutGetWebviewOptions(extensionUri)
		)

		BugoutSearchResultsProvider.currentPanel = new BugoutSearchResultsProvider(panel, extensionUri, accessToken)
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, accessToken: string) {
		/*
		Revive our panel.
		*/
		BugoutSearchResultsProvider.currentPanel = new BugoutSearchResultsProvider(panel, extensionUri, accessToken)
	}

	public async doRefactor(searchResults: any, journalId: string) {
		/*
		Send any JSON serializable data to the webview.
		*/
		const webview = this._panel.webview
		this._panel.webview.html = await this._getHtmlForWebview(webview, journalId, searchResults)
	}

	public dispose() {
		/*
		Clean up resources if panel where closed by user or programmatically.
		*/
		BugoutSearchResultsProvider.currentPanel = undefined
		this._panel.dispose()
		while (this._disposables.length) {
			const x = this._disposables.pop()
			if (x) {
				x.dispose()
			}
		}
	}

	private async _getHtmlForWebview(webview: vscode.Webview, journalId: any, searchResults: any) {
		/*
		Render HTML for Webview.
		*/
		const renderResult = searchHTML(webview, this._extensionUri, journalId, searchResults)
		return renderResult
	}
}

export function bugoutGetWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		enableCommandUris: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")]
	}
}
