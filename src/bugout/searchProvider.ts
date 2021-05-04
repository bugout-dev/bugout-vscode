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

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
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
				console.log(message.command)
				switch (message.command) {
					case "searchButton":
						await BugoutSearchResultsProvider.searchQuery(
							this._extensionUri,
							message.data.journalId,
							message.data.q
						)
						return
					case "editEntry":
						const entryResult = await bugoutGetJournalEntry(message.data.journalId, message.data.entryId)
						const entryTitle = entryResult.title
						const entryContent = entryResult.content
						vscode.commands.executeCommand(
							"Bugout.editEntry",
							message.data.journalId,
							message.data.entryId,
							entryTitle,
							entryContent
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

	public static async searchQuery(extensionUri: vscode.Uri, journalId: string, q: string) {
		const searchResults = await bugoutGetSearchResults(journalId, q, true)
		BugoutSearchResultsProvider.createOrShow(extensionUri)
		if (BugoutSearchResultsProvider.currentPanel) {
			await BugoutSearchResultsProvider.currentPanel.doRefactor(searchResults, journalId)
		}
	}

	public static createOrShow(extensionUri: vscode.Uri) {
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

		BugoutSearchResultsProvider.currentPanel = new BugoutSearchResultsProvider(panel, extensionUri)
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		/*
		Revive our panel.
		*/
		BugoutSearchResultsProvider.currentPanel = new BugoutSearchResultsProvider(panel, extensionUri)
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