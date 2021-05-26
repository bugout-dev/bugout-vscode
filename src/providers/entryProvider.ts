/*
Represents markdown document of Bugout entry.
*/
import * as vscode from "vscode"
import { BugoutTypes } from "@bugout/bugout-js"
import axios from "axios"
import * as fs from "fs"
import * as FormData from "form-data"

import { bugoutClient } from "../utils/settings"
import { entryToMarkdown, markdownToEntry } from "../views/entryView"

export class EntryDocumentContentProvider implements vscode.TextDocumentContentProvider {
	/*
	Represents new document for entry.
	*/
	private bugoutTimeoutActive: NodeJS.Timeout | undefined

	onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
	onDidChange = this.onDidChangeEmitter.event

	public async bugoutCreateEntry(tempRootPath: string, accessToken: string, journalId: string) {
		const tempEntryContent = {
			title: "New entry title",
			content: "New entry content",
			tags: ["temp", "entry"]
		}
		const createdEntry = await bugoutClient.createEntry(
			accessToken,
			journalId,
			tempEntryContent.title,
			tempEntryContent.content,
			tempEntryContent.tags,
			undefined,
			undefined,
			"vscode"
		)

		const tempUri = vscode.Uri.parse(`file:${tempRootPath}/${journalId}/entries/${createdEntry.id}.md`)
		await vscode.workspace.fs.writeFile(tempUri, Buffer.from(""))

		vscode.workspace.openTextDocument(tempUri).then((doc) => {
			vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false }).then((textDoc) => {
				textDoc.edit(async (editText) => {
					const entryString = entryToMarkdown(
						tempEntryContent.title,
						tempEntryContent.content,
						tempEntryContent.tags
					)
					editText.insert(new vscode.Position(0, 0), entryString)
					vscode.workspace.onDidChangeTextDocument(async (editedDoc) => {
						if (editedDoc.document === doc) {
							const entryUpdatedData = markdownToEntry(editedDoc.document.getText())
							if (entryUpdatedData) {
								await this.updateEntryTimeout(
									doc,
									accessToken,
									journalId,
									createdEntry.id,
									entryUpdatedData
								)
							}
						}
					})
				})
			})
		})
	}

	public async bugoutEditEntry(
		tempRootPath: string,
		accessToken: string,
		journalId: string,
		entryId: string,
		entryTitle: string,
		entryContent: string,
		entryTags: string[]
	) {
		/*
		Handle logic with editing entry as markdown Text Document.
		*/
		const tempUri = vscode.Uri.parse(`file:${tempRootPath}/${journalId}/entries/${entryId}.md`)
		const fileExists = await this.processCurrentEntry(tempUri)
		vscode.workspace.openTextDocument(tempUri).then((doc) => {
			vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false }).then((textDoc) => {
				textDoc.edit(async (editText) => {
					if (!fileExists) {
						const entryString = entryToMarkdown(entryTitle, entryContent, entryTags)
						editText.insert(new vscode.Position(0, 0), entryString)
					}
					vscode.workspace.onDidChangeTextDocument(async (editedDoc) => {
						if (editedDoc.document === doc) {
							// TODO(kompotkot): Add checks if was not parsed, throw an error
							// to inform user modify entry with rules
							const entryUpdatedData = markdownToEntry(editedDoc.document.getText())
							if (entryUpdatedData) {
								await this.updateEntryTimeout(doc, accessToken, journalId, entryId, entryUpdatedData)
							}
						}
					})

					vscode.workspace.onDidCloseTextDocument((document) => {
						console.log("Entry was closed")
						// console.log(document)
						// if (document === doc) {
						// await removeTempEntry(tempUri.path)
						// }
					})
				})
			})
		})
	}

	private async processCurrentEntry(tempUri: vscode.Uri): Promise<boolean> {
		let fileExists: boolean
		try {
			await vscode.workspace.fs.stat(tempUri)
			fileExists = true
		} catch {
			await vscode.workspace.fs.writeFile(tempUri, Buffer.from(""))
			fileExists = false
		}
		return fileExists
	}

	private async updateEntryTimeout(doc, accessToken: string, journalId: string, entryId: string, entryUpdatedData) {
		/*
		Check if since last changes passed 5 second, then send entry update to server.
		*/
		if (this.bugoutTimeoutActive !== undefined) {
			clearTimeout(this.bugoutTimeoutActive)
		}
		let timeout = setTimeout(async () => {
			if (this.bugoutTimeoutActive !== undefined) {
				const updatedEntry = await bugoutClient.updateEntry(
					accessToken,
					journalId,
					entryId,
					entryUpdatedData.title,
					entryUpdatedData.content,
					entryUpdatedData.tags,
					BugoutTypes.EntryUpdateTagActions.REPLACE
				)
				if (updatedEntry.title === entryUpdatedData.title) {
					doc.save()
					vscode.window.showInformationMessage(
						`[Entry](https://bugout.dev/app/personal/${journalId}/entries/${entryId}) was successfully updated, you can safely close the window.`
					)
				}
			}
		}, 3000)
		this.bugoutTimeoutActive = timeout
	}

	public provideTextDocumentContent(uri: vscode.Uri): string {
		return ""
	}
}

export async function uploadImage(rootPath: string, accessToken: string) {
	const activeEntry = vscode.window.activeTextEditor
	if (activeEntry) {
		const path = activeEntry.document.uri.path
		if (path) {
			if (path.startsWith(rootPath)) {
				const pathList = path.split("/")
				const journalId = pathList[pathList.length - 3]
				const entryIdList = pathList[pathList.length - 1].split(".")
				const entryId = entryIdList[0]

				const imagePath = await vscode.window.showInputBox()
				if (imagePath) {
					const formData = new FormData()
					formData.append("image", fs.createReadStream(imagePath))
					let params = {
						headers: {
							Authorization: `Bearer ${accessToken}`,
							...formData.getHeaders()
						}
					}
					const result = await axios.post(
						`https://spire.bugout.dev/journals/${journalId}/entries/${entryId}/image`,
						formData,
						params
					)
					const imageLink = `![image](${result.data.s3_presigned_url})`
					// TODO(kompotkot): Calculate normal position
					activeEntry.edit((editText) => {
						editText.insert(new vscode.Position(20, 0), imageLink)
					})
				}
			}
		}
	} else {
		vscode.window.showWarningMessage("Uploading image available only from active entry window.")
	}
}
