console.log("Script from file");
// Handle VSCode logic
const vscode = acquireVsCodeApi();

function searchJournal(journalSearchInput) {
    /*
    Process search input, send command to get filtered list of entries,
    update curent Webview with fresh list of entries.
    */
    vscode.postMessage({
        command: "searchButton",
        data: {q: journalSearchInput.value, journalId: journalSearchInput.dataset.journal}
    });
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
    });
}

window.onload = () => {
    let journalSearchInput = document.getElementById("journal-search");
    journalSearchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchJournal(journalSearchInput);
        }
    });
    let editEntryButtons = document.getElementsByClassName("edit-button");
    Array.from(editEntryButtons, editButton => {
        editButton.addEventListener("click", () => {
            editEntry(editButton);
        })
    });
}