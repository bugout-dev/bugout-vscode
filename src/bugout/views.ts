import { Webview, workspace, Uri } from "vscode"
import { Converter } from "showdown"

export function entryToMarkdown(entryResult): string {
	/*
	Convert entry to markdown preview.
	*/
	const vscodeEntryContent = `# ${entryResult.title}

${entryResult.content}
`
	return vscodeEntryContent
}

export function markdownToEntry(markdown: string): any | null {
	/*
	Split markdown to title and content of entry.
	*/
	const markdownAsList = markdown.split("\n")
	for (let i = 0; i < markdownAsList.length; i++) {
		if (markdownAsList[i].slice(0, 2) === "# ") {
			const entryTitle = markdownAsList[i].slice(2)
			let entryContentList = markdownAsList.slice(i + 1)

			if (entryContentList[0] === "") {
				entryContentList = entryContentList.slice(1)
			}
			if (entryContentList[-1] === "") {
				entryContentList = entryContentList.slice(0, -1)
			}

			return { title: entryTitle, content: entryContentList.join("\n") }
		}
	}
	return null
}

export let searchHTML = (webview: Webview, extensionUri: Uri, journalId: string, searchResults: any) => {
	/*
	Generate HTML for search results.
	*/
	const themeName: string | undefined = workspace.getConfiguration("workbench").get("colorTheme")
	let colorizeAsTheme = "white"
	let colorizeAsThemeOpposite = "black"
	if (themeName?.toLowerCase().includes("dark")) {
		colorizeAsTheme = "black"
		colorizeAsThemeOpposite = "white"
	}

	// Generate entries block
	const converter = new Converter()
	let entriesBlocks: string = ``
	let tagsBlock: string = ``
	searchResults.results.forEach((entry: any) => {
		let entryUrlList = entry.entry_url.split("/")
		let entryId = entryUrlList[entryUrlList.length - 1]
		entry.tags.forEach((tag: string) => {
			tagsBlock += `
<p class="entry-tag">${tag}</p>
`
		})

		let entryTitleP = `
<div>
<div class="titles">
	<h1 class="entry-title">${entry.title}</h1>
	<input type="button" class="edit-button" value="Edit" data-journal="${journalId}" data-entry="${entryId}">
</div>
<span>${tagsBlock}</span>
<span class="entry-markdown">${converter.makeHtml(entry.content)}</span>
<br>
<hr class="solid">
<br>
</div>
`
		entriesBlocks += entryTitleP
	})

	// Configure JavaScript in Webview
	const nonce = getNonce()
	const styleUri = webview.asWebviewUri(Uri.joinPath(extensionUri, "media", "main.css"))
	const scriptUri = webview.asWebviewUri(Uri.joinPath(extensionUri, "media", "main.js"))

	let renderResult = `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<!--
            Use a content security policy to only allow loading images from https or from our extension directory,
            and only allow scripts that have a specific nonce.
		-->
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';"
		/>
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link nonce="${nonce}" href="${styleUri}" rel="stylesheet">
		<script nonce="${nonce}" src="${scriptUri}"></script>
		<title>Bugout Panel</title>
	</head>
	<body>
		<div class="header">
			<input placeholder="Entries search" type="search" name="q" id="journal-search" data-journal="${journalId}">
        </div>
		<br>
		<div id="entries">${entriesBlocks}</div>
		
		<script nonce="${nonce}">
			// Rewrite styles with dynamic values
			let inputs = document.getElementsByTagName("input");
			Array.from(inputs, input => {
				input.style.color = "${colorizeAsThemeOpposite}";
			})
		</script>
	</body>
</html>
`
	return renderResult
}

function getNonce() {
	/*
	Generate nonce according with CSP best practices.
	*/
	let text = ""
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}
