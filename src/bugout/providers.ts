import * as vscode from "vscode"
import * as path from "path"

import { bugoutGetJournals, bugoutGetSearchResults, bugoutGetJournalEntry } from "./calls"
import { searchHTML, entryToMarkdown, markdownToEntry } from "./views"

export class BugoutListProvider implements vscode.TreeDataProvider<BugoutTreeItem> {
	/*
	Side bar Bugout Tree View.
	*/
	private _onDidChangeTreeData: vscode.EventEmitter<BugoutTreeItem | undefined> = new vscode.EventEmitter<
		BugoutTreeItem | undefined
	>()
	readonly onDidChangeTreeData: vscode.Event<BugoutTreeItem | undefined> = this._onDidChangeTreeData.event
	private userJournals: any | undefined

	constructor(private context: vscode.ExtensionContext) {}

	refresh(): void {
		/*
		Refresh button in navigation panel.
		Refresh list of journals.
		*/
		this._onDidChangeTreeData.fire(undefined)
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		/*
		Implement this to return the UI representation (TreeItem) 
		of the element that gets displayed in the view.
		*/
		return element
	}

	async getChildren(element?: vscode.TreeItem): Promise<any> {
		/*
		Implement this to return the children for the given element 
		or root (if no element is passed).
		*/
		this.userJournals = await this.bugoutFetchJournals()
		let treeItems: BugoutTreeItem[] = []

		this.userJournals.journals.forEach((journal) => {
			let treeItem = new BugoutTreeItem(journal.name)
			treeItem.command = {
				command: "extension.select",
				title: "Select journal",
				arguments: [journal]
			}
			treeItems.push(treeItem)
		})

		return Promise.resolve(treeItems)
	}

	async bugoutSelect(journal: any): Promise<void> {
		/*
		Tree Item selection.
		Run empty search to get journal entries.
		*/
		const searchResults = await bugoutGetSearchResults(journal.id, "", true)
		BugoutSearchResultsProvider.createOrShow(this.context.extensionUri)
		if (BugoutSearchResultsProvider.currentPanel) {
			await BugoutSearchResultsProvider.currentPanel.doRefactor(searchResults, journal.id)
		}
	}

	private async bugoutFetchJournals() {
		/*
		TODO(kompotkot): Rebuild it to init() with auto fetching journals 
		due class initialisation
		*/
		// const tokenColors = getTokenColorsForTheme(themeName);
		let userJournals = await bugoutGetJournals()
		return userJournals
	}
}

export class BugoutTreeItem extends vscode.TreeItem {
	/*
	Extended TreeItem to be able set icons for Tree Items.
	*/
	constructor(
		public readonly label: string,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
		public readonly iconPath = {
			light: path.join(__filename, "..", "..", "resources", "light", "folder.svg"),
			dark: path.join(__filename, "..", "..", "resources", "dark", "folder.svg")
		}
	) {
		super(label, collapsibleState)
	}
}

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
				switch (message.command) {
					case "searchButton":
						const searchResults = await bugoutGetSearchResults(message.data.journalId, message.data.q, true)
						BugoutSearchResultsProvider.createOrShow(this._extensionUri)
						if (BugoutSearchResultsProvider.currentPanel) {
							await BugoutSearchResultsProvider.currentPanel.doRefactor(
								searchResults,
								message.data.journalId
							)
						}
					case "editEntry":
						const entryResult = await bugoutGetJournalEntry(message.data.journalId, message.data.entryId)
						vscode.commands.executeCommand("Bugout.editEntry", entryResult)
				}
			},
			null,
			this._disposables
		)
	}

	public static createOrShow(extensionUri: vscode.Uri) {
		/*
		Generate new panel or show existing one.
		*/
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

		if (BugoutSearchResultsProvider.currentPanel) {
			console.log("Showing existing Bugout panel")
			BugoutSearchResultsProvider.currentPanel._panel.reveal(column)
			return
		}

		console.log("Create new Bugout panel")
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

export class EntryDocumentContentProvider implements vscode.TextDocumentContentProvider {
	/*
	Represents new document for entry.
	*/
	onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
	onDidChange = this.onDidChangeEmitter.event

	public async bugoutEditEntry(entryResult) {
		/*
		Handle logic with editing entry as mardown Text Document.
		*/
		vscode.workspace.openTextDocument({ language: "markdown", content: "" }).then((doc) => {
			vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false }).then((textDoc) => {
				textDoc.edit(async (editText) => {
					const entryId = entryResult.id
					const journalUrlList = entryResult.journal_url.split("/")
					const journalId = journalUrlList[journalUrlList.length - 1]

					const entryString = entryToMarkdown(entryResult)
					editText.insert(new vscode.Position(0, 0), entryString)
					// editedTimestamp = Math.floor(Date.now() / 1000)
					// vscode.workspace.onDidChangeTextDocument(async (editedDoc) => {
					// 	if (editedDoc.document === doc) {
					// 		editedTimestamp = Math.floor(Date.now() / 1000)
					// 		await delay(5000)
					// 		if (Math.floor(Date.now() / 1000) - editedTimestamp === 5) {
					// 			console.log("Save it")
					// 		}
					// 	}
					// })
					vscode.workspace.onDidCloseTextDocument((document) => {
						if (document === doc) {
							const entryUpdated = markdownToEntry(document.getText())
							console.log(`Updated entry entryId: ${entryId}, journalId: ${journalId}`)
						}
					})
				})
			})
		})
	}

	public provideTextDocumentContent(uri: vscode.Uri): string {
		return ""
	}
}

export function bugoutGetWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		enableCommandUris: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")]
	}
}
