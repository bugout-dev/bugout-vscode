/*
Handle logic for VSCode Bugout Webview in generated HTML.
*/
const vscode = acquireVsCodeApi()

function searchJournal(journalSearchInput) {
	/*
    Process search input, send command to get filtered list of entries,
    update current Webview with fresh list of entries.
    */
	vscode.postMessage({
		command: "searchButton",
		data: { q: journalSearchInput.value, journalId: journalSearchInput.dataset.journal }
	})
}

function editEntry(editButton) {
	/*
    Process edit entry button, open new windows with markdown editor
    and content of entry.
    */
	vscode.postMessage({
		command: "editEntry",
		data: {
			journalId: editButton.dataset.journal,
			entryId: editButton.dataset.entry
		}
	})
}

function deleteEntry(deleteButton) {
	/*
    Process delete entry button, open new windows with markdown editor
    and content of entry.
    */
	vscode.postMessage({
		command: "deleteEntry",
		data: {
			journalId: deleteButton.dataset.journal,
			entryId: deleteButton.dataset.entry
		}
	})
}

function createEntry(createButton) {
	/*
    Process create new entry button, open new windows with markdown editor.
    */
	vscode.postMessage({
		command: "createEntry",
		data: { journalId: createButton.dataset.journal }
	})
}

window.onload = () => {
	const journalSearchInput = document.getElementById("bugout-journal-search")
	journalSearchInput.addEventListener("keypress", (event) => {
		if (event.key === "Enter") {
			event.preventDefault()
			searchJournal(journalSearchInput)
		}
	})

	const createEntryButton = document.getElementById("bugout-create-button")
	createEntryButton.addEventListener("click", () => {
		createEntry(createEntryButton)
	})

	const editEntryButtons = document.getElementsByClassName("bugout-edit-button")
	Array.from(editEntryButtons, (editButton) => {
		editButton.addEventListener("click", () => {
			editEntry(editButton)
		})
	})
	const deleteEntryButtons = document.getElementsByClassName("bugout-delete-button")
	Array.from(deleteEntryButtons, (deleteButton) => {
		deleteButton.addEventListener("click", () => {
			deleteEntry(deleteButton)
		})
	})
}
