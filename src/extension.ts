import * as vscode from 'vscode';
//import { a } from 'axios';
import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import fetch, {Response,Request} from 'node-fetch';
import { showInputBox } from './search';
import { admonitions } from 'remark-admonitions';
import * as path from 'path';
import * as fs from 'fs';
import * as showdown from 'showdown';
import * as handlebars from 'handlebars';
//import * as showdownHighlight from 'showdown-highlight';
//import showdownHighlight from 'showdown-highlight';
const editor = vscode.window.activeTextEditor;
//import {Entry} from './datatype';

import { BugOut} from './spireApi';
import { title } from 'process';

// Intresting can i extract datatypes using protobuff???


export async function activate(context: vscode.ExtensionContext) {

    //Create your objects - Needs to be a well-formed JSON object.
	let bugoutWebView: vscode.WebviewPanel | undefined = undefined;
	let resp = await axios.get("https://spire.bugout.dev/ping");
	console.log(resp);

	// Samples of `window.registerSpireDataProvider`
	const Provider = new BugOut(vscode.workspace.rootPath);
	
	const fetresp = await( await fetch("https://spire.bugout.dev/ping")).text();
	console.log(fetresp);
	// vscode.window.registerTreeDataProvider('Bugout.getJournals', nodeDependenciesProvider);
	console.log('init start');
	//let journals = await Provider.getJournalsTreeView()
	//vscode.window.registerTreeDataProvider('journalsView', new TreeDataProvider(journals));
	//let provider = new searchResultsProvider(context.extensionUri);
	vscode.commands.registerCommand('Bugout.search', ()  => { searchInput(context, context.extensionUri,bugoutWebView);});
	vscode.commands.registerCommand('Bugout.addEntry', (entry: Entry) => {editEntry(context, context.extensionUri, bugoutWebView);});
}


function getBugoutConfig() {
	const configuration = vscode.workspace.getConfiguration();
	const api = configuration.get<string>('Bugout.Api.endpoint');
	const token = configuration.get<string>('Bugout.AccessToken');

	return [api, token];
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

async function searchInput(context: vscode.ExtensionContext,extensionUri: vscode.Uri,panel: vscode.WebviewPanel | undefined) { 
	const query = await vscode.window.showInputBox();

	const config = getBugoutConfig();
	const api = config[0];
	const token = config[1];

	let params = { headers : {"Authorization": `Bearer ${token}`}};
	console.log(api);
	//await( await fetch("https://spire.bugout.dev/ping")).text();
	const result  = await axios.get(`${api}/journals`,params);
	const journals = result.data.journals;
	// const journals = await( await fetch(`${api}/journals`,params)).text();
	// console.log(journals);
	let journals_options: any = [];
	for (var jornal of journals) {
		journals_options.push({label: jornal.name , picked: false, id: jornal.id});
	}
	console.log(journals);

	const selected_journal: any= await vscode.window.showQuickPick(journals_options);
	if (selected_journal == undefined) {
		return;
	}
	console.log(typeof selected_journal)
	searchResultsProvider.getSearch(context,extensionUri, panel, selected_journal.id, query)

}

async function editEntry(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined) { 

	searchResultsProvider.generateEditEntry(context,extensionUri, panel)

}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

class searchResultsProvider {

	public static readonly viewType = 'Bugout-search';
	static _extensionUri: vscode.Uri;



	public static async getSearch(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined, journal: string, query?: string, tags?: Array<string>) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;


		
		if (panel == undefined) {

			//
			panel = vscode.window.createWebviewPanel(
				searchResultsProvider.viewType,
				"[Bugout] journals",
				vscode.ViewColumn.Beside
				
			);

			panel.webview.options = {
				enableScripts: true,
				enableCommandUris: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] 
			};
		}
		
		panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, context.extensionPath, extensionUri, journal, query);

		panel.webview.onDidReceiveMessage(
			async message => {
			  switch (message.command) {

				case 'search':
					console.log(message)
					if (panel != undefined) {
						panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, context.extensionPath, extensionUri, message.journal, message.query);
					}
				  
				
				case 'swithcFormat':
					if (panel != undefined) {
						panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, context.extensionPath, extensionUri, message.journal, message.query, message.format);
					}
			  }
			  return;
			},
			undefined,
			context.subscriptions
		  );
		
	}


	public static async generateEditEntry(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined) {



		const config = getBugoutConfig();
		const api = config[0];
		const token = config[1];

		var editor = vscode.window.activeTextEditor;

		if (!editor) {
			return; // No open text editor
		}

		var selection = editor.selection;
		var text = editor.document.getText(selection);
		const ext = editor.document.fileName.split('.').pop();
		if (ext == 'py') {
			text = '```python\n' + text + '\n```'
		}

		if (panel == undefined){

			const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

			panel = vscode.window.createWebviewPanel(
				searchResultsProvider.viewType,
				"[Bugout] journals",
				vscode.ViewColumn.Beside
			);

			panel.webview.options = {
				// Allow scripts in the webview
				enableScripts: true,
				enableCommandUris: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] //[context.extensionUri]
			};

			console.log(panel.webview,context.extensionPath,text)
			panel.webview.html =  await this._getEditEntryHtmlForWebview(panel.webview, context.extensionPath, text);

		} else {
			console.log(panel.webview,context.extensionPath,text)
			panel.webview.html =  await this._getEditEntryHtmlForWebview(panel.webview, context.extensionPath, text);
		}

		panel.webview.onDidReceiveMessage(
			async message => {
				console.log(message.command)
			  switch (message.command) {

				case 'search':
					if (panel != undefined) {
						panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, context.extensionPath, context.extensionUri, message.journal, message.query);
					}
					break;

				case 'createNewEntry':

					let entry = message.entry;


					const options = {
						headers : {
							"x-bugout-client-id": "slack-some-track",
							"Authorization": `Bearer ${token}`,
						}
					  };
					
					console.log(message);
			
					let payload  = {
						"title": entry.title,
						"content": entry.content,
						"tags": entry.tags.split(','),
						"context_id": 'context_id',
						"context_url": 'permalink',
						"context_type": "vscode",
					}
					console.log(payload);
					await axios.post(`${api}/journals/${message.journal_id}/entries`, payload, options); ///.then(function (response) {return response.data})
					axios.create()

					if (panel != undefined) {
						panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview,  context.extensionPath, context.extensionUri, message.journal_id, '');
					}
					break;
			  }
			},
			undefined,
			context.subscriptions
		  );
		


	}	
	
	private static async _getSearchHtmlForWebview(webview: vscode.Webview, extensionPath: string, extensionUri: vscode.Uri, journal: string, query?: string, formating_off?: boolean) {

		
		const config = getBugoutConfig();
		const api = config[0];
		const token = config[1];


		let md = new showdown.Converter({tables: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tasklists: true,
			ghCodeBlocks: true
			//extensions:[showdownHighlight],
		    });

		let params = { headers : {
			"x-bugout-client-id": "slack-some-track",
			"Authorization": `Bearer ${token}`,
		}}
		console.log(`${api}/journals/${journal}/search?q=${query}`);
		const result  = await axios.get(`${api}/journals/${journal}/search?q=${query}`,params) ///.then(function (response) {return response.data})
		let data = result.data.results;
		const request_journals  = await axios.get(`${api}/journals/`,params);
		const journals = request_journals.data.journals;
		// Get resource paths
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'media', 'styles.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'));
		const codiconsFontUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.ttf'));
		
		let templateContent = '<div><div>title</div><div>tags</div><div >content</div></div>';


		let search_html_block = '';
		for (var entry of data) {
			//console.log(entry)
			
			let entry_represend = templateContent;
			if (formating_off){
				entry_represend = entry_represend.replace('title', entry.title);
				entry_represend = entry_represend.replace('tags', entry.tags.join(' ') );
				entry_represend = entry_represend.replace('content', entry.content);
				//console.log(entry.content);

			}else{
				///console.log(entry.content);
				entry_represend = entry_represend.replace('title', md.makeHtml('## ' + entry.title + '\n'));
				entry_represend = entry_represend.replace('tags', md.makeHtml('**Tags:** ' + '`' +  entry.tags.join('` | `') + '`'));
				entry_represend = entry_represend.replace('content', md.makeHtml(entry.content));

			}

			search_html_block = search_html_block + '<br><hr class="solid">' + entry_represend
			// Use `key` and `value`
		}

		let prerender_data = {
			search_html_block: search_html_block,
			query: query,
			journal: journal,
			journals : journals
		}

		const bars_template = fs.readFileSync(path.join(extensionPath,'views/search.html'), 'utf-8');
		//console.log(bars_template);
		const template = handlebars.compile(bars_template);
		//console.log(template(prerender_data));
		return template(prerender_data);
	}

	private static async _getEditEntryHtmlForWebview(webview: vscode.Webview, extentionPath: string, content: string) {

		const config = getBugoutConfig();
		const api = config[0];
		const token = config[1];
		
		let params = { headers : {
			"x-bugout-client-id": "slack-some-track",
			"Authorization": `Bearer ${token}`,
		}};

		const request_journals  = await axios.get(`${api}/journals/`,params);
		const journals = request_journals.data.journals;
		

		const result  = await axios.get(`${api}/journals/${journals[0].id}/tags`,params); ///.then(function (response) {return response.data})
		let tags = result.data;

		
		console.log(tags);
		var tags_option: any[] = [];

		for (var tag of tags) {
			tags_option.push({"text": tag[0], "value":tag[0]})
		}
		console.log(JSON.stringify(tags_option));
		const jquery_js_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extentionPath, 'media', 'jquery2.1.min.js')));
		const fastsearch_js_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extentionPath, 'media', 'fastsearch.min.js')));	
		const fastselect_css_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extentionPath, 'media', 'fastselect.scss')));

		let data = {
			fastsearch_js_uri:fastsearch_js_uri,
			jquery_js_uri:jquery_js_uri,
			fastselect_css_uri:fastselect_css_uri,
			content: content,
			tags_option: JSON.stringify(tags_option),
			journals: journals
		}

		const bars_template = fs.readFileSync(path.join(extentionPath,'views/createEntry.html'), 'utf-8');
		//console.log(bars_template);
		const template = handlebars.compile(bars_template);
		//console.log(template(data));
		return template(data);
	}
}