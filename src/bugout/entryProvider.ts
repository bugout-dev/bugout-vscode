/*
Represents markdown document of Bugout entry.
*/
import * as vscode from "vscode"

import { bugoutUpdateJournalEntry, bugoutCreateJournalEntry } from "./calls"
import { entryToMarkdown, markdownToEntry } from "./views"

export class EntryDocumentContentProvider implements vscode.TextDocumentContentProvider {
	/*
	Represents new document for entry.
	*/
	private bugoutTimeoutActive: NodeJS.Timeout | undefined

	onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
	onDidChange = this.onDidChangeEmitter.event

	public async bugoutCreateEntry(journalId: string) {
		vscode.workspace.openTextDocument({ language: "markdown", content: "" }).then((doc) => {
			vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false }).then((textDoc) => {
				textDoc.edit(async (editText) => {
					const tempEntryContent = {
						title: "New entry title",
						content: "New entry content",
						tags: ["temp", "entry"]
					}
					const entryString = entryToMarkdown(
						tempEntryContent.title,
						tempEntryContent.content,
						tempEntryContent.tags
					)
					editText.insert(new vscode.Position(0, 0), entryString)
					const createdEntry = await bugoutCreateJournalEntry(journalId, tempEntryContent)

					vscode.workspace.onDidChangeTextDocument(async (editedDoc) => {
						if (editedDoc.document === doc) {
							const entryUpdatedData = markdownToEntry(editedDoc.document.getText())
							if (entryUpdatedData) {
								await this.updateEntryTimeout(journalId, createdEntry.id, entryUpdatedData)
							}
						}
					})
				})
			})
		})
	}

	public async bugoutEditEntry(
		journalId: string,
		entryId: string,
		entryTitle: string,
		entryContent: string,
		entryTags: string[]
	) {
		/*
		Handle logic with editing entry as markdown Text Document.
		*/
		vscode.workspace.openTextDocument({ language: "markdown", content: "" }).then((doc) => {
			vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false }).then((textDoc) => {
				textDoc.edit(async (editText) => {
					const entryString = entryToMarkdown(entryTitle, entryContent, entryTags)
					editText.insert(new vscode.Position(0, 0), entryString)

					vscode.workspace.onDidChangeTextDocument(async (editedDoc) => {
						if (editedDoc.document === doc) {
							// TODO(kompotkot): Add checks if was not parsed, throw an error
							// to inform user modify entry with rules
							const entryUpdatedData = markdownToEntry(editedDoc.document.getText())
							if (entryUpdatedData) {
								await this.updateEntryTimeout(journalId, entryId, entryUpdatedData)
							}
						}
					})

					// vscode.workspace.onDidCloseTextDocument((document) => {
					// 	if (document === doc) {
					// 		console.log("Entry was closed")
					// 	}
					// })
				})
			})
		})
	}

	private async updateEntryTimeout(journalId: string, entryId: string, entryUpdatedData) {
		/*
		Check if since last changes passed 5 second, then send entry update to server.
		*/
		if (this.bugoutTimeoutActive !== undefined) {
			clearTimeout(this.bugoutTimeoutActive)
		}
		let timeout = setTimeout(async () => {
			if (this.bugoutTimeoutActive !== undefined) {
				const updatedEntry = await bugoutUpdateJournalEntry(journalId, entryId, entryUpdatedData)
				if (updatedEntry.title === entryUpdatedData.title) {
					vscode.window.showInformationMessage(
						`Entry "${entryUpdatedData.title.slice(
							0,
							10
						)}.." was successfully updated, you can safely close the window.`
					)
				}
			}
		}, 5000)
		this.bugoutTimeoutActive = timeout
	}

	public provideTextDocumentContent(uri: vscode.Uri): string {
		return ""
	}
}
