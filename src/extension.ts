import * as vscode from 'vscode';
import * as axios from 'axios';
//import {Entry} from './datatype';
// import { DepNodeProvider, Dependency } from './nodeDependencies';
// import { JsonOutlineProvider } from './jsonOutline';
// import { FtpExplorer } from './ftpExplorer';
// import { FileExplorer } from './fileExplorer';
// import { TestView } from './testView';



// Intresting can i extract datatypes using protobuff???
interface Entry {
    id: string;
    title: string;
    content: string;
    tags: Array<string>;
  }

interface EntryContent {
    title: string;
    content: string;
    tags: Array<string>;
  }

export function activate(context: vscode.ExtensionContext) {

      //Create your objects - Needs to be a well-formed JSON object.
	let token = '';

	// Samples of `window.registerSpireDataProvider`
	const Provider = new spireApiProvider(vscode.workspace.rootPath);
	// vscode.window.registerTreeDataProvider('Bugout.getJournals', nodeDependenciesProvider);
	// vscode.window.registerTreeDataProvider('nodeDependencies', spireApiProvider);
	vscode.commands.registerCommand('Bugout.search', (q: string)  => {Provider.search(q)});
	vscode.commands.registerCommand('Bugout.addEntry', (entry: Entry) => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('Bugout.editEntry', (entry: Entry) => vscode.window.showInformationMessage(`Successfully called edit entry ${entry.id}.`));
	vscode.commands.registerCommand('Bugout.deleteEntry', (entry: Entry) => vscode.window.showInformationMessage(`Successfully called delete entry on ${entry.id}.`));
	
    
	//let orange = vscode.window.createOutputChannel("Orange");
	//orange.appendLine("sdasdashd");
	//console.log()
	context.subscriptions.push(
		vscode.commands.registerCommand('catCodicons.show', () => {
			CatCodiconsPanel.show(context.extensionUri);
		})
	);
}

function syntaxHighlight(json: string) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}



// Big hardcode

function getCurrentJournal(){
	

	return 'd6c9fbf3-e4c0-4d1a-8129-e9e6768d1054'
}

function getAccessToken(){

	return '02c27666-9b99-487b-a69d-accadfad65fa'
}

function getDataApiProvider(){
	
	return 'https://d89f7db76e25.ngrok.io '
}


// Class with Spire api methods
class spireApiProvider {

	

	private _onDidChangeTreeData = new vscode.EventEmitter();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
	// incorrect read only not give change that variable
	readonly journal = getCurrentJournal();
	readonly token = getAccessToken();
	readonly base_url = getDataApiProvider();
	readonly header_auth = {
		"x-bugout-client-id": "slack-some-track",
		"Authorization": `Bearer ${this.token}`,
	}

	constructor(private workspaceRoot: any) {
	}

	async search(q: string):  Promise<string> {
		let params = { headers : this.header_auth}
		const result  = await axios.default.get(`${this.base_url}/journals/${this.journal}/search?q=11`,params)
		let data = result.data;
		return JSON.stringify(data);
	}

	async createEntry(content: EntryContent):  Promise<string> {
		
		let params = { headers : this.header_auth}
		const result  = await axios.default.post(`${this.base_url}/journals/${this.journal}/entry`,params)
		let data = result.data;
		return JSON.stringify(data);
	}

	async editEntry(content: EntryContent):  Promise<string> {
		let params = { headers : this.header_auth}
		const result  = await axios.default.put(`${this.base_url}/journals/${this.journal}/search?q=11`,params)
		let data = result.data;
		return JSON.stringify(data);
	}

	async deleteEntry(content: EntryContent):  Promise<string> {
		let params = { headers : this.header_auth}
		const result  = await axios.default.delete(`${this.base_url}/journals/${this.journal}/search?q=11`,params)
		let data = result.data;
		return JSON.stringify(data);
	}


	async getJournals(content: EntryContent):  Promise<string> {
		let params = { headers : this.header_auth}
		const result  = await axios.default.delete(`${this.base_url}/journals`,params)
		let data = result.data;
		return JSON.stringify(data);
	}
}
class CatCodiconsPanel {

	public static readonly viewType = 'catCodicons';

	public static async show(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		const panel = vscode.window.createWebviewPanel(
			CatCodiconsPanel.viewType,
			"Cat Codicons",
			column || vscode.ViewColumn.Beside
		);

		panel.webview.html =  await this._getHtmlForWebview(panel.webview, extensionUri);
	}

	private static async _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri) {

		let params = { headers : {
			"x-bugout-client-id": "slack-some-track",
			"Authorization": "Bearer 02c27666-9b99-487b-a69d-accadfad65fa",
		}}
		let orange = vscode.window.createOutputChannel("Orange");
		const result  = await axios.default.get('https://72cc70fd049b.ngrok.io/journals/d6c9fbf3-e4c0-4d1a-8129-e9e6768d1054/search?q=11',params) ///.then(function (response) {return response.data})
		let data = result.data;

		// Get resource paths
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'));
		const codiconsFontUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.ttf'));




		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${codiconsFontUri}; style-src ${webview.cspSource} ${codiconsUri};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Cat Coding</title>
				<link href="${styleUri}" rel="stylesheet" />
				<link href="${codiconsUri}" rel="stylesheet" />
			</head>
			<body>
				<h1>codicons</h1>
				<div id="icons">
					<div class="icon"><i class="codicon codicon-account">${JSON.stringify(data, null, 2)}</i> account</div>
				</div>
			</body>
			</html>`;
	}
}