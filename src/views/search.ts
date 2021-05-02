import { Webview, workspace, Uri } from "vscode"
import { Converter } from "showdown"

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
		entry.tags.forEach((tag: string) => {
			tagsBlock += `
<p class="entry-tag">${tag}</p>
`
		})

		let entryTitleP = `
<div>
<h1 class="entry-title">${entry.title}</h1>
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
			<input placeholder="Entries search" type="search" name="q" id="journal-search">
        </div>
		<div id="entries">${entriesBlocks}</div>
		<div id="canvasSection"><canvas id="vscodeTestCanvas" /></div>
		<script nonce="${nonce}">
			// Rewrite styles with dynamic values
			document.getElementById("journal-search").style.color = "${colorizeAsThemeOpposite}";

			// Handle VSCode logic
			const vscode = acquireVsCodeApi();

			function searchJournal(journalSearchInputValue) {
				vscode.postMessage({
					command: "testCommand",
					data: {q: journalSearchInputValue, journalId: "${journalId}"}
				});
			}

			window.onload = () => {
				let journalSearchInput = document.getElementById("journal-search");
				journalSearchInput.addEventListener("keypress", (event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						searchJournal(journalSearchInput.value);
					}
				});
			}
		</script>
	</body>
</html>
`
	return renderResult
}

function getNonce() {
	let text = ""
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}
