import { window } from "vscode"

const entryTitleTagsSeparator = "<!-- Bugout title/tags separator -->"
const entryTagsContentSeparator = "<!-- Bugout tags/content separator -->"

export function entryToMarkdown(entryTitle: string, entryContent: string, entryTags: string[]): string {
	/*
	Convert entry to markdown preview.
	*/
	const vscodeEntryContent = `# ${entryTitle}
${entryTitleTagsSeparator}
> ${entryTags.join(", ")}
${entryTagsContentSeparator}
${entryContent}
`
	return vscodeEntryContent
}

export function markdownToEntry(markdown: string): any | null {
	/*
	Split markdown to title and content of entry.
	*/
	const markdownAsList = markdown.split("\n")
	let entryTitleTagsSeparatorPosition: number | undefined
	let entryTagsContentSeparatorPosition: number | undefined

	for (let i = 0; i < markdownAsList.length; i++) {
		if (markdownAsList[i].includes(entryTitleTagsSeparator)) {
			entryTitleTagsSeparatorPosition = i
		}
		if (markdownAsList[i].includes(entryTagsContentSeparator)) {
			entryTagsContentSeparatorPosition = i
		}
	}
	if (entryTitleTagsSeparatorPosition === undefined || entryTagsContentSeparatorPosition === undefined) {
		window.showWarningMessage("Unable to parse entry, please add title, tags and content separators back")
		return null
	}
	let entryTitle = markdownAsList.slice(0, entryTitleTagsSeparatorPosition).join("\n")
	let entryTagsString = markdownAsList
		.slice(entryTitleTagsSeparatorPosition + 1, entryTagsContentSeparatorPosition)
		.join("\n")
		.split(" ")
		.join("")
	let entryContent = markdownAsList.slice(entryTagsContentSeparatorPosition + 1).join("\n")

	if (entryTitle.startsWith("# ")) {
		entryTitle = entryTitle.slice(2)
	}
	if (entryTagsString.startsWith(">")) {
		entryTagsString = entryTagsString.slice(1)
	}
	let entryTags = entryTagsString.split(",")

	return { title: entryTitle, content: entryContent, tags: entryTags }
}
