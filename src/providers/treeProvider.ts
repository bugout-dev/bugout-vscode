/*
Represents tree view of Bugout VSCode side panel.
*/
import * as vscode from "vscode"
import * as path from "path"

import { BugoutSearchResultsProvider } from "./searchProvider"
import { bugoutClient } from "../utils/settings"

export class BugoutTreeProvider implements vscode.TreeDataProvider<BugoutTreeItem> {
	/*
	Side bar Bugout Tree View.
	*/
	private _onDidChangeTreeData: vscode.EventEmitter<BugoutTreeItem | undefined> = new vscode.EventEmitter<
		BugoutTreeItem | undefined
	>()
	readonly onDidChangeTreeData: vscode.Event<BugoutTreeItem | undefined> = this._onDidChangeTreeData.event
	private userJournals: any | undefined

	constructor(private context: vscode.ExtensionContext, private _accessToken: string) {}

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
		const searchResults = await bugoutClient.search(this._accessToken, journal.id, "", [], 100, 0, true)
		BugoutSearchResultsProvider.createOrShow(this.context.extensionUri, this._accessToken)
		if (BugoutSearchResultsProvider.currentPanel) {
			await BugoutSearchResultsProvider.currentPanel.doRefactor(searchResults, journal.id)
		}
	}

	private async bugoutFetchJournals() {
		/*
		TODO(kompotkot): Rebuild it to init() with auto fetching journals 
		due class initialization
		*/
		// const tokenColors = getTokenColorsForTheme(themeName);
		const userJournals = await bugoutClient.listJournals(this._accessToken)
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
