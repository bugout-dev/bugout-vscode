import * as vscode from 'vscode';
import * as axios from 'axios';
import { showInputBox } from './search';
import { admonitions } from 'remark-admonitions';
import * as html from 'remark-html';
import * as remark from 'remark';
import * as path from 'path';

const editor = vscode.window.activeTextEditor;
//import {Entry} from './datatype';

import { BugOut} from './spireApi';

// Intresting can i extract datatypes using protobuff???


function markdownCompiler(): any {
    const admonitionsOptions = {};
    return remark()
        .use(html)
        .use(admonitions, admonitionsOptions);
}

export async function activate(context: vscode.ExtensionContext) {

      //Create your objects - Needs to be a well-formed JSON object.
	let token = '';

	// Samples of `window.registerSpireDataProvider`
	const Provider = new BugOut(vscode.workspace.rootPath);
	// vscode.window.registerTreeDataProvider('Bugout.getJournals', nodeDependenciesProvider);
	console.log('init start');
	//let journals = await Provider.getJournalsTreeView()
	//vscode.window.registerTreeDataProvider('journalsView', new TreeDataProvider(journals));
	vscode.commands.registerCommand('Bugout.search', ()  => { searchInput(context, context.extensionUri);});
	vscode.commands.registerCommand('Bugout.addEntry', (entry: Entry) => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('Bugout.editEntry', (entry: Entry) => vscode.window.showInformationMessage(`Successfully called edit entry ${entry.id}.`));
	vscode.commands.registerCommand('Bugout.deleteEntry', (entry: Entry) => vscode.window.showInformationMessage(`Successfully called delete entry on ${entry.id}.`));
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
            } else {``
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

async function searchInput(context: vscode.ExtensionContext,extensionUri: vscode.Uri,) { 
	const input = await vscode.window.showInputBox();

	searchResultsProvider.getSearch(context,extensionUri,input)

}



class searchResultsProvider {

	public static readonly viewType = 'Bugout-search';

	public static async getSearch(context: vscode.ExtensionContext,extensionUri: vscode.Uri, query?: string, tags?: Array<string>) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
		
		const panel = vscode.window.createWebviewPanel(
			searchResultsProvider.viewType,
			"Search in journal",
			column || vscode.ViewColumn.Beside,
			{
				// Enable scripts in the webview
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'assets'))]
			}
			
		);
		
		panel.webview.html =  await this._getHtmlForWebview(panel.webview, extensionUri, query);

		panel.webview.onDidReceiveMessage(
			async message => {
				console.log(message.command)
			  switch (message.command) {
				case 'search':
				
				  panel.webview.html =  await this._getHtmlForWebview(panel.webview, extensionUri, message.text);

				  console.log('search resive')
				  return;
			  }
			},
			undefined,
			context.subscriptions
		  );
		
	}

	private static async _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri, query?: string) {

		let params = { headers : {
			"x-bugout-client-id": "slack-some-track",
			"Authorization": "Bearer 02c27666-9b99-487b-a69d-accadfad65fa",
		}}
		let orange = vscode.window.createOutputChannel("Orange");
		console.log(query);
		const result  = await axios.default.get(`https://8cd9d3298c65.ngrok.io/journals/d6c9fbf3-e4c0-4d1a-8129-e9e6768d1054/search?q=${query}`,params) ///.then(function (response) {return response.data})
		let data = result.data.results;
		console.log(data);
		

		// Get resource paths
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'));
		const codiconsFontUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.ttf'));

		let templateContent = '<div><div>title</div><div>tags</div><div style="background-color:  rgba(170, 170, 170, 0.1); border-radius: 2%;">content</div></div>';


		let search_html_block = '';
		for (var entry of data) {
			console.log(entry)
			
			let entry_represend = templateContent;
			
			entry_represend = entry_represend.replace('title',await markdownCompiler().process('### ' + entry.title + '\n'));
			entry_represend = entry_represend.replace('tags',await markdownCompiler().process('`' + entry.tags.join('` `') + '`'));
			entry_represend = entry_represend.replace('content',await markdownCompiler().process(entry.content));


			search_html_block = search_html_block + '<hr class="solid">' + entry_represend
			// Use `key` and `value`
		}


		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<!--<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${codiconsFontUri}; style-src ${webview.cspSource} ${codiconsUri};">-->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Cat Coding</title>
				<!--<link href="${styleUri}" rel="stylesheet" />-->
				<!--<link href="${codiconsUri}" rel="stylesheet" />-->
				<style>
					hr.solid {
						border-top: 2px solid #000;
						border-color: rgba(90, 90, 90, 0.1);
					}

					label {
						display: block;
						font: 1rem 'Fira Sans', sans-serif;
					}
					
					input,
					label {
						margin: .4rem 0;
					}
				</style>
			</head>
			<body>
			
			<div id="icons">
				<input type="search" id="search" name="q"
				aria-label="Search through site content">

				<script>
					const vscode = acquireVsCodeApi();
					function useAdvise() {
						let text_ = document.querySelector("#search").value;
						vscode.postMessage({command: 'search',text: text_})
					}
			  	</script>
				
				<button onclick="useAdvise()">Search</button>

	 
					<div class="icon"><i class="codicon codicon-account">${search_html_block}</i> account</div>
				</div>
			</body>
			</html>`;
	}
}