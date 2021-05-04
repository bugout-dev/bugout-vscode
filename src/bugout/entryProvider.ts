/*
Represents markdown document of Bugout entry.
*/
import * as vscode from "vscode"

import { bugoutUpdateJournalEntry } from "./calls"
import { entryToMarkdown, markdownToEntry } from "./views"

export class EntryDocumentContentProvider implements vscode.TextDocumentContentProvider {
	/*
	Represents new document for entry.
	*/
	private bugoutTimeoutActive: NodeJS.Timeout | undefined

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

					// Handle entry editing
					vscode.workspace.onDidChangeTextDocument(async (editedDoc) => {
						if (editedDoc.document === doc) {
							// TODO(kompotkot): Add checks if was not parsed, throw an error
							// to inform user modify entry with rules
							const entryUpdatedData = markdownToEntry(editedDoc.document.getText())
							if (entryUpdatedData) {
								if (this.bugoutTimeoutActive !== undefined) {
									clearTimeout(this.bugoutTimeoutActive)
								}
								let timeout = setTimeout(async () => {
									if (this.bugoutTimeoutActive !== undefined) {
										const updatedEntry = await bugoutUpdateJournalEntry(
											journalId,
											entryId,
											entryUpdatedData
										)
										if (updatedEntry.title === entryUpdatedData.title) {
											vscode.window.showInformationMessage(
												"Entry was successfully updated, you can safely close the window"
											)
										}
									}
								}, 5000)
								this.bugoutTimeoutActive = timeout
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

	public provideTextDocumentContent(uri: vscode.Uri): string {
		return ""
	}
}
