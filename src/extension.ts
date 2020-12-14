import * as vscode from 'vscode';
//import { a } from 'axios';
import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import * as showdown from 'showdown';
import * as handlebars from 'handlebars';
import * as highlight from 'highlight.js';
// import { title } from 'process';
// import { exception } from 'console';
//import * as shiki from 'shiki';


const editor = vscode.window.activeTextEditor;


export async function activate(context: vscode.ExtensionContext) {

	

    //Create your objects - Needs to be a well-formed JSON object.
	let bugoutWebView: vscode.WebviewPanel | undefined = undefined;
	// let resp = await axios.get("https://spire.bugout.dev/ping");
	// console.log(resp);
	// console.log(vscode.workspace.getConfiguration('workbench').get('colorTheme'));
	// const config = getBugoutConfig();
	// vscode.window.showInformationMessage(`endpoint = ${config[0]} | token = ${config[1]}`);

	let bugoutProvider = new searchResultsProvider();

	console.log(vscode.window.activeTextEditor);
	// vscode.workspace.onDidChangeConfiguration((change) => {
    //     if (change.affectsConfiguration('workbench.colorTheme')) {
    //         for (var tabs of editor)
    //     }
    // }, undefined, context.subscriptions);

	// Samples of `window.registerSpireDataProvider`
	//const Provider = new BugOut(vscode.workspace.rootPath);
	
	// const fetresp = await( await fetch("https://spire.bugout.dev/ping")).text();
	// console.log(fetresp);
	// vscode.window.registerTreeDataProvider('Bugout.getJournals', nodeDependenciesProvider);
	//let journals = await Provider.getJournalsTreeView()
	//vscode.window.registerTreeDataProvider('journalsView', new TreeDataProvider(journals));
	//let provider = new searchResultsProvider(context.extensionUri);
	vscode.commands.registerCommand('Bugout.search', ()  => { searchInput(context, context.extensionUri,bugoutWebView, bugoutProvider);});
	vscode.commands.registerCommand('Bugout.addEntry', () => { editEntry(context, context.extensionUri, bugoutWebView, bugoutProvider );});
}


function getBugoutConfig() {
	const configuration = vscode.workspace.getConfiguration();
	const api = configuration.get<string>('Bugout.Api.endpoint');
	const token = configuration.get<string>('Bugout.AccessToken');

	return [api, token];
}
function getLanguageId(inId: string) {
    for (const language of languages) {
        if (inId === language.name || language.identifiers.some(langId => inId === langId)) {
            return language.language;
        }
    }
    return undefined;
};

async function searchInput(context: vscode.ExtensionContext,extensionUri: vscode.Uri,panel: vscode.WebviewPanel | undefined, bugoutProvider) { 
	const query = await vscode.window.showInputBox();

	const config = getBugoutConfig();
	const api = config[0];
	const token = config[1];

	let params = { headers : {"Authorization": `Bearer ${token}`}};

	//await( await fetch("https://spire.bugout.dev/ping")).text();
	const result  = await axios.get(`${api}/journals/`,params);
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
	bugoutProvider.getSearch(context,extensionUri, panel, selected_journal.id, query)

}

async function editEntry(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined, bugoutProvider) { 

	bugoutProvider.generateEditEntry(context,extensionUri, panel)

}


const defaultThemesMap = {
	'Visual Studio Light': 'github.css',
	'Default Light+': 'github.css',
	'Quiet Light': 'github.css',
	'Solarized Light': 'github.css',
	'Visual Studio Dark': 'vs2015.css',
	'Default Dark+': 'vs2015.css'
}

function float2int (value) {
    return value | 0;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getCurrentThemePath(themeName) {
	for (const ext of vscode.extensions.all) {
		const themes = ext.packageJSON.contributes && ext.packageJSON.contributes.themes;
		if (!themes) continue;
		const theme = themes.find(theme => theme.label === themeName || theme.id === themeName);
		if (theme) {
			return path.join(ext.extensionPath, theme.path);
		}
	}
}

class searchResultsProvider {

	public static readonly viewType = 'Bugout-search';
	static _extensionUri: vscode.Uri;



	public async getSearch(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined, journal: string, query?: string, tags?: Array<string>) {
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

		let theme = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vs.css'));
		
		// 
		vscode.workspace.onDidChangeConfiguration(() => {
	
			if (!panel || panel == undefined) {
				return;
			}

			//vscode-webview-resource://2dcea161-ba74-4cc9-9c23-dc533fd19767/file///c%3A/Users/Andrey/vscode-extension-samples-master/Vs-code-integration/media/github.css

			let currentThemeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
			console.log
			if (typeof currentThemeName === 'string' ) {
				if (defaultThemesMap[currentThemeName]) {
					theme = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', defaultThemesMap[currentThemeName]));
				}else {
					theme = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vs2015.css'));
				}
			}	
			// Send a message to our webview.
			// You can send any JSON serializable data.
			panel.webview.postMessage({ command: 'update' , highlightStyle:`${theme.scheme}://${theme.authority}${theme.path}`});
		});

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


	public async generateEditEntry(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined) {



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

					// if (panel != undefined) {
					// 	panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview,  context.extensionPath, context.extensionUri, message.journal_id, '');
					// }
					vscode.window.showInformationMessage('A new entry was created in your journal.');
					if (panel != undefined) {
						panel.dispose();
					}
					break;
			  }
			},
			undefined,
			context.subscriptions
		  );		


	}	
	
	private async _getSearchHtmlForWebview(webview: vscode.Webview, extensionPath: string, extensionUri: vscode.Uri, journal: string, query?: string, formating_off?: boolean) {

		
		const config = getBugoutConfig();
		const api = config[0];
		const token = config[1];

		showdown.extension('highlight', function () {
			return [{
			  type: "output",
			  filter: function (text, converter, options) {
			  var left = "<pre><code\\b[^>]*>",
				  right = "</code></pre>",
				  flags = "g";
			  var replacement = function (wholeMatch, match, left, right) {
				  	var lang = (left.match(/class=\"([^ \"]+)/) || [])[1];
					left = left.slice(0, 18) + 'hljs ' + left.slice(18);

					if (lang && highlight.getLanguage(lang)) {
						return left + highlight.highlight(lang, match).value + right;
							} else {
								return left + highlight.highlightAuto(match).value + right;
							}
				};
			  return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
			}	
		  }];
		});
		
		let md = new showdown.Converter({tables: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			emoji: true,
			tasklists: true,
			ghCodeBlocks: true,
			extensions:['highlight'],
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

		let theme = 'vs.css';
		const currentThemeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
		if (typeof currentThemeName === 'string' ) {
			if (defaultThemesMap[currentThemeName]) {
				theme = defaultThemesMap[currentThemeName];
			}
		}

		const jquery_js_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'jquery2.1.min.js')));
		const highlightstyleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', theme));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'));
		const codiconsFontUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', 'vscode-codicons', 'dist', 'codicon.ttf'));
		
		let templateContent =  '<div> \
									<div> _title_ </div> \
									<div> _tags_ </div> \
									<div> _content_ </div> \
									<div id="statistics_container"> \
									    <div id="updated_at"> _updated_at_</div> \
										<div id="search_score"> _score_ </div> \
									</div> \
								</div>';


		let search_html_block = '';
		for (var entry of data) {
			console.log(entry)
			
			let entry_represend = templateContent;
			if (formating_off){
				entry_represend = entry_represend.replace('title', entry.title);
				entry_represend = entry_represend.replace('tags', entry.tags.join(' ') );
				entry_represend = entry_represend.replace('content', entry.content);
				//console.log(entry.content);

			}else{
				///console.log(entry.content);
				entry_represend = entry_represend.replace('_title_', md.makeHtml('## ' + entry.title + '\n'));
				entry_represend = entry_represend.replace('_tags_', md.makeHtml('**Tags:** ' + '`' +  entry.tags.join('` | `') + '`'));
				entry_represend = entry_represend.replace('_content_', md.makeHtml(entry.content));
				var date2 = new Date(entry.updated_at);
				console.log(date2);
				entry_represend = entry_represend.replace('_updated_at_', date2.toString());
				entry_represend = entry_represend.replace('_score_', md.makeHtml('Score: '+ entry.score.toFixed(2).toString() +' | ' + ':star:'.repeat(float2int(entry.score))));



			}

			search_html_block = search_html_block + '<br><hr class="solid">' + entry_represend
			// Use `key` and `value`
		}
		if (search_html_block == '') {
			search_html_block = '<h4>No entries found</h4>';
		}
		console.log(highlightstyleUri);

		let prerender_data = {
			vscodehighlight: highlightstyleUri,
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

	private async _getEditEntryHtmlForWebview(webview: vscode.Webview, extensionPath: string, content: string) {

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
		const jquery_js_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'jquery2.1.min.js')));
		const fastsearch_js_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'fastsearch.min.js')));	
		const fastselect_css_uri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'fastselect.scss')));

		let data = {
			fastsearch_js_uri:fastsearch_js_uri,
			jquery_js_uri:jquery_js_uri,
			fastselect_css_uri:fastselect_css_uri,
			content: content,
			tags_option: JSON.stringify(tags_option),
			journals: journals
		}

		const bars_template = fs.readFileSync(path.join(extensionPath,'views/createEntry.html'), 'utf-8');
		//console.log(bars_template);
		const template = handlebars.compile(bars_template);
		//console.log(template(data));
		return template(data);
	}
}

// Taken from https://github.com/Microsoft/vscode-markdown-tm-grammar/blob/master/build.js
const languages = [
    { name: 'css', language: 'css', identifiers: ['css', 'css.erb'], source: 'source.css' },
    { name: 'basic', language: 'html', identifiers: ['html', 'htm', 'shtml', 'xhtml', 'inc', 'tmpl', 'tpl'], source: 'text.html.basic' },
    { name: 'ini', language: 'ini', identifiers: ['ini', 'conf'], source: 'source.ini' },
    { name: 'java', language: 'java', identifiers: ['java', 'bsh'], source: 'source.java' },
    { name: 'lua', language: 'lua', identifiers: ['lua'], source: 'source.lua' },
    { name: 'makefile', language: 'makefile', identifiers: ['Makefile', 'makefile', 'GNUmakefile', 'OCamlMakefile'], source: 'source.makefile' },
    { name: 'perl', language: 'perl', identifiers: ['perl', 'pl', 'pm', 'pod', 't', 'PL', 'psgi', 'vcl'], source: 'source.perl' },
    { name: 'r', language: 'r', identifiers: ['R', 'r', 's', 'S', 'Rprofile'], source: 'source.r' },
    { name: 'ruby', language: 'ruby', identifiers: ['ruby', 'rb', 'rbx', 'rjs', 'Rakefile', 'rake', 'cgi', 'fcgi', 'gemspec', 'irbrc', 'Capfile', 'ru', 'prawn', 'Cheffile', 'Gemfile', 'Guardfile', 'Hobofile', 'Vagrantfile', 'Appraisals', 'Rantfile', 'Berksfile', 'Berksfile.lock', 'Thorfile', 'Puppetfile'], source: 'source.ruby' },
    // 	Left to its own devices, the PHP grammar will match HTML as a combination of operators
    // and constants. Therefore, HTML must take precedence over PHP in order to get proper
    // syntax highlighting.
    { name: 'php', language: 'php', identifiers: ['php', 'php3', 'php4', 'php5', 'phpt', 'phtml', 'aw', 'ctp'], source: ['text.html.basic', 'source.php'] },
    { name: 'sql', language: 'sql', identifiers: ['sql', 'ddl', 'dml'], source: 'source.sql' },
    { name: 'vs_net', language: 'vs_net', identifiers: ['vb'], source: 'source.asp.vb.net' },
    { name: 'xml', language: 'xml', identifiers: ['xml', 'xsd', 'tld', 'jsp', 'pt', 'cpt', 'dtml', 'rss', 'opml'], source: 'text.xml' },
    { name: 'xsl', language: 'xsl', identifiers: ['xsl', 'xslt'], source: 'text.xml.xsl' },
    { name: 'yaml', language: 'yaml', identifiers: ['yaml', 'yml'], source: 'source.yaml' },
    { name: 'dosbatch', language: 'dosbatch', identifiers: ['bat', 'batch'], source: 'source.batchfile' },
    { name: 'clojure', language: 'clojure', identifiers: ['clj', 'cljs', 'clojure'], source: 'source.clojure' },
    { name: 'coffee', language: 'coffee', identifiers: ['coffee', 'Cakefile', 'coffee.erb'], source: 'source.coffee' },
    { name: 'c', language: 'c', identifiers: ['c', 'h'], source: 'source.c' },
    { name: 'cpp', language: 'cpp', identifiers: ['cpp', 'c\\+\\+', 'cxx'], source: 'source.cpp' },
    { name: 'diff', language: 'diff', identifiers: ['patch', 'diff', 'rej'], source: 'source.diff' },
    { name: 'dockerfile', language: 'dockerfile', identifiers: ['dockerfile', 'Dockerfile'], source: 'source.dockerfile' },
    { name: 'git_commit', identifiers: ['COMMIT_EDITMSG', 'MERGE_MSG'], source: 'text.git-commit' },
    { name: 'git_rebase', identifiers: ['git-rebase-todo'], source: 'text.git-rebase' },
    { name: 'go', language: 'go', identifiers: ['go', 'golang'], source: 'source.go' },
    { name: 'groovy', language: 'groovy', identifiers: ['groovy', 'gvy'], source: 'source.groovy' },
    { name: 'pug', language: 'pug', identifiers: ['jade', 'pug'], source: 'text.pug' },

    { name: 'js', language: 'javascript', identifiers: ['js', 'jsx', 'javascript', 'es6', 'mjs'], source: 'source.js' },
    { name: 'js_regexp', identifiers: ['regexp'], source: 'source.js.regexp' },
    { name: 'json', language: 'json', identifiers: ['json', 'json5', 'sublime-settings', 'sublime-menu', 'sublime-keymap', 'sublime-mousemap', 'sublime-theme', 'sublime-build', 'sublime-project', 'sublime-completions'], source: 'source.json' },
    { name: 'jsonc', language: 'jsonc', identifiers: ['jsonc'], source: 'source.json.comments' },
    { name: 'less', language: 'less', identifiers: ['less'], source: 'source.css.less' },
    { name: 'objc', language: 'objc', identifiers: ['objectivec', 'objective-c', 'mm', 'objc', 'obj-c', 'm', 'h'], source: 'source.objc' },
    { name: 'swift', language: 'swift', identifiers: ['swift'], source: 'source.swift' },
    { name: 'scss', language: 'scss', identifiers: ['scss'], source: 'source.css.scss' },

    { name: 'perl6', language: 'perl6', identifiers: ['perl6', 'p6', 'pl6', 'pm6', 'nqp'], source: 'source.perl.6' },
    { name: 'powershell', language: 'powershell', identifiers: ['powershell', 'ps1', 'psm1', 'psd1'], source: 'source.powershell' },
    { name: 'python', language: 'python', identifiers: ['python', 'py', 'py3', 'rpy', 'pyw', 'cpy', 'SConstruct', 'Sconstruct', 'sconstruct', 'SConscript', 'gyp', 'gypi'], source: 'source.python' },
    { name: 'regexp_python', identifiers: ['re'], source: 'source.regexp.python' },
    { name: 'rust', language: 'rust', identifiers: ['rust', 'rs'], source: 'source.rust' },
    { name: 'scala', language: 'scala', identifiers: ['scala', 'sbt'], source: 'source.scala' },
    { name: 'shell', language: 'shellscript', identifiers: ['shell', 'sh', 'bash', 'zsh', 'bashrc', 'bash_profile', 'bash_login', 'profile', 'bash_logout', '.textmate_init'], source: 'source.shell' },
    { name: 'ts', language: 'typescript', identifiers: ['typescript', 'ts'], source: 'source.ts' },
    { name: 'tsx', language: 'typescriptreact', identifiers: ['tsx'], source: 'source.tsx' },
    { name: 'csharp', language: 'csharp', identifiers: ['cs', 'csharp', 'c#'], source: 'source.cs' },
    { name: 'fsharp', language: 'fsharp', identifiers: ['fs', 'fsharp', 'f#'], source: 'source.fsharp' },
    { name: 'dart', language: 'dart', identifiers: ['dart'], source: 'source.dart' },
    { name: 'handlebars', language: 'handlebars', identifiers: ['handlebars', 'hbs'], source: 'text.html.handlebars' },
    { name: 'markdown', language: 'markdown', identifiers: ['markdown', 'md'], source: 'text.html.markdown' },
];