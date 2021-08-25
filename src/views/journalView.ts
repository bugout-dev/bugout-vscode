import { Converter } from "showdown"
import { Webview, workspace, Uri } from "vscode"

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
	searchResults.results.forEach((entry: any) => {
		let entryUrlList = entry.entry_url.split("/")
		let entryId = entryUrlList[entryUrlList.length - 1]
		let tagsBlock: string = ``
		entry.tags.forEach((tag: string) => {
			tagsBlock += `
<p class="bugout-entry-tag">${tag}</p>
`
		})

		let entryTitleP = `
<div>
<div class="bugout-titles">
	<h1 class="bugout-entry-title">${entry.title}</h1>
	<input type="button" class="bugout-edit-button" value="Edit" data-journal="${journalId}" data-entry="${entryId}">
	<input type="button" class="bugout-delete-button" value="Del" data-journal="${journalId}" data-entry="${entryId}">
</div>
<span>${tagsBlock}</span>
<span class="bugout-entry-markdown">${converter.makeHtml(entry.content)}</span>
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
		<div id="bugout-header">
			<input placeholder="Entries search" type="search" name="q" id="bugout-journal-search" data-journal="${journalId}">
			<input type="button" id="bugout-create-button" value="Create new entry" data-journal="${journalId}">
        </div>
		<br>
		<div id="entries">${entriesBlocks}</div>
		
		<script nonce="${nonce}">
			// Rewrite styles with dynamic values
			const bugoutJournalSearchBar = document.getElementById("bugout-journal-search");
			bugoutJournalSearchBar.style.borderColor = "${colorizeAsThemeOpposite}";
			bugoutJournalSearchBar.style.color = "${colorizeAsThemeOpposite}";

			const bugoutCreateEntryButton = document.getElementById("bugout-create-button");
			bugoutCreateEntryButton.style.borderColor = "${colorizeAsThemeOpposite}";
			bugoutCreateEntryButton.style.color = "${colorizeAsThemeOpposite}";
			
			const bugoutJournalTags = document.getElementsByClassName("bugout-entry-tag");
			if (bugoutJournalTags.length > 0) {
				Array.from(bugoutJournalTags, tag => {
					tag.style.color = "${colorizeAsThemeOpposite}";
				})
			}
			const bugoutEntryEditButtons = document.getElementsByClassName("bugout-edit-button");
			if (bugoutEntryEditButtons.length > 0) {
				Array.from(bugoutEntryEditButtons, button => {
					button.style.color = "${colorizeAsThemeOpposite}";
				})
			}
			const bugoutEntryDeleteButtons = document.getElementsByClassName("bugout-delete-button");
			if (bugoutEntryDeleteButtons.length > 0) {
				Array.from(bugoutEntryDeleteButtons, button => {
					button.style.color = "${colorizeAsThemeOpposite}";
				})
			}
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
