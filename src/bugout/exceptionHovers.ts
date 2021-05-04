import * as vscode from "vscode"

import { bugoutGetSearchResults } from "./calls"
import { GlyphChars } from "./constants"
import { bugoutHumbugJournalId } from "./settings"

export async function receiveHumbugExceptions(): Promise<string[]> {
	/*
	Fetch all exceptions with tag "#type:error" and return list
	of tags from from tag "error:<error_name>"
	*/
	let exceptions: string[] = []

	if (bugoutHumbugJournalId) {
		const errorsSearchResults = await bugoutGetSearchResults(bugoutHumbugJournalId, "#type:error")
		errorsSearchResults.results.forEach((journal) => {
			journal.tags.forEach((tag: string) => {
				if (tag.startsWith("error:")) {
					exceptions.push(tag.slice(6))
				}
			})
		})
	}
	return exceptions
}

export async function exceptionsUsabilityHover(
	document: vscode.TextDocument,
	position: vscode.Position,
	token: vscode.CancellationToken,
	humbugExceptions: string[]
): Promise<vscode.Hover | null> {
	/*
	Check if hovered word is from Exceptions class, 
	search across Bugout knowledgebase and return the number of appeals.
	*/
	if (bugoutHumbugJournalId === undefined) {
		return null
	}

	const wordRange = document.getWordRangeAtPosition(position)
	const codeText = document.getText(wordRange)

	if (humbugExceptions.includes(codeText)) {
		const searchResults = await bugoutGetSearchResults(bugoutHumbugJournalId, `tag:error:${codeText}`, false)
		const message = await generateMarkdown(codeText, searchResults)
		return new vscode.Hover(message)
	} else {
		return null
	}
}

async function generateMarkdown(codeText: string, searchResults): Promise<vscode.MarkdownString> {
	/*
	Generates markdown for Hover with links and buttons.
	*/
	let message = ""
	if (searchResults.total_results >= 0) {
		const firstEntry = searchResults.results[0]
		const commandParams = encodeURIComponent(
			JSON.stringify({ journalId: bugoutHumbugJournalId, q: `tag:error:${codeText}` })
		)

		message += `
Python exception: \`${codeText}\` occurred: \`${searchResults.total_results}\` times\n
Last exception received at ${firstEntry.created_at} [\`Details ${GlyphChars.ArrowRightDouble}\`](command:extension.bugoutDirectSearch?${commandParams})\n
---
Open crash reports on [Bugout.dev](https://bugout.dev/app/personal/${bugoutHumbugJournalId}/entries?q=tag:error:${codeText})
`
	}
	const markdown = new vscode.MarkdownString(message, true)
	markdown.isTrusted = true
	return markdown
}
