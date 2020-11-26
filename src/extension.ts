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
	let currentPanel: vscode.WebviewPanel | undefined = undefined;

	// Samples of `window.registerSpireDataProvider`
	const Provider = new BugOut(vscode.workspace.rootPath);
	// vscode.window.registerTreeDataProvider('Bugout.getJournals', nodeDependenciesProvider);
	console.log('init start');
	//let journals = await Provider.getJournalsTreeView()
	//vscode.window.registerTreeDataProvider('journalsView', new TreeDataProvider(journals));
	//let provider = new searchResultsProvider(context.extensionUri);
	vscode.commands.registerCommand('Bugout.search', ()  => { searchInput(context, context.extensionUri,currentPanel);});
	vscode.commands.registerCommand('Bugout.addEntry', (entry: Entry) => {editEntry(context, context.extensionUri, currentPanel);});
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
	const input = await vscode.window.showInputBox();

	searchResultsProvider.getSearch(context,extensionUri,panel,input)

}

async function editEntry(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined) { 

	searchResultsProvider.generateEditEntry(context,extensionUri, panel)

}


function getCurrentJournal(){
	

	return 'd6c9fbf3-e4c0-4d1a-8129-e9e6768d1054'
}

function getAccessToken(){

	return '02c27666-9b99-487b-a69d-accadfad65fa'
}

function getDataApiProvider(){
	
	return 'https://08195ea00112.ngrok.io'
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

	

	public static async getSearch(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined, query?: string, tags?: Array<string>) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
	 	console.log('Panel get search');
		console.log(panel);
		if (panel == undefined) {
			panel = vscode.window.createWebviewPanel(
				searchResultsProvider.viewType,
				"[Bugout] journals",
				vscode.ViewColumn.Beside
				
			);
			panel.webview.options = {
				// Allow scripts in the webview
				enableScripts: true,
				enableCommandUris: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] 
			};
		}
		
		panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, extensionUri, query);

		panel.webview.onDidReceiveMessage(
			async message => {
				console.log(message.command)
			  switch (message.command) {
				case 'search':
					if (panel != undefined) {
						panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, extensionUri, message.text);
					}

				  console.log('search resive')
				  return;
				case 'createNewEntry':
					console.log('Create Entry');
					this.createEntry(message.entry);
					
			  }
			},
			undefined,
			context.subscriptions
		  );
		
	}

	public static async createEntry(entry: any) {

		const options = {
			headers : {
				"x-bugout-client-id": "slack-some-track",
				"Authorization": "Bearer 02c27666-9b99-487b-a69d-accadfad65fa",
			}
		  };

		let payload  = {
			"title": entry.title,
			"content": entry.content,
			"tags": entry.tags.split(','),
			"context_id": 'context_id',
			"context_url": 'permalink',
			"context_type": "vscode",
		}
		console.log(payload);
		await axios.default.post(`https://07c5df1f01ea.ngrok.io/journals/d6c9fbf3-e4c0-4d1a-8129-e9e6768d1054/entries`, payload, options); ///.then(function (response) {return response.data})



	}

	public static async generateEditEntry(context: vscode.ExtensionContext,extensionUri: vscode.Uri, panel: vscode.WebviewPanel | undefined) {

		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		var selection = editor.selection;
		var text = editor.document.getText(selection);
		console.log(context.extensionPath);
		console.log(context.extensionUri);
		console.log(vscode.Uri.file(path.join(context.extensionPath, 'media')));
		
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
						panel.webview.html =  await this._getSearchHtmlForWebview(panel.webview, extensionUri, message.text);
					}

				  console.log('search resive')
				  return;
				case 'createNewEntry':
					console.log('Create Entry');
					this.createEntry(message.entry);
					
			  }
			},
			undefined,
			context.subscriptions
		  );
		


	}


	private _extensionUri(_extensionUri: any, arg1: string, arg2: string) {
		throw new Error('Method not implemented.');
	}

	

	private static async _getSearchHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri, query?: string) {

		let params = { headers : {
			"x-bugout-client-id": "slack-some-track",
			"Authorization": "Bearer 02c27666-9b99-487b-a69d-accadfad65fa",
		}}
		let orange = vscode.window.createOutputChannel("Orange");
		console.log(query);
		const result  = await axios.default.get(`https://07c5df1f01ea.ngrok.io/journals/d6c9fbf3-e4c0-4d1a-8129-e9e6768d1054/search?q=${query}`,params) ///.then(function (response) {return response.data})
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

	private static async _getEditEntryHtmlForWebview(webview: vscode.Webview, extentionPath: string, content: string) {
		//console.log(this._extensionUri, 'media', 'fastselect.js');


		let params = { headers : {
			"x-bugout-client-id": "slack-some-track",
			"Authorization": "Bearer 02c27666-9b99-487b-a69d-accadfad65fa",
		}};
		const result  = await axios.default.get(`https://07c5df1f01ea.ngrok.io/journals/d6c9fbf3-e4c0-4d1a-8129-e9e6768d1054/tags`,params); ///.then(function (response) {return response.data})
		let tags = result.data;
		console.log(tags);
		var tags_option: any[] = [];

		for (var tag of tags) {
			tags_option.push({"text": tag[0], "value":tag[0]})
		}
		console.log(JSON.stringify(tags_option));
		const scriptPathOnDisk = vscode.Uri.file(path.join('file///c%3A/Users/Andrey/vscode-extension-samples-master/Vs-code-integration', 'media', 'fastselect.js'));
		const styleFastSelectPath = vscode.Uri.file(path.join(extentionPath, 'media', 'fastselect.css'));
		console.log(scriptPathOnDisk);
		console.log(styleFastSelectPath);
		const styleSrc = webview.asWebviewUri(scriptPathOnDisk);
		const scriptSrc = webview.asWebviewUri(scriptPathOnDisk);

		const nonce = getNonce();
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
			-->
			<!--<meta http-equiv="Content-Security-Policy" content="default-src 'none';">-->

			<style>
			html, body {
				height: 100%;
			}
			</style>
			<style>
			.bg {
				display: flex;
				-webkit-box-align: center;
				align-items: center;
				margin-bottom: 1rem;
			}
			.input_title {
				width: 100%;
				display: block;
				-webkit-box-align: center;
				align-items: center;
				position: relative;
				transition: all 0.2s ease 0s;
				outline: none;
				appearance: none;
				font-size: 1em;
				height: 2.5rem;
				border-radius: 0.5rem;
				border-width: 0px;
				border-style: initial;
				border-image: initial;
				border-color: inherit;
				min-height: 10px;
				line-height: 1.0;
				resize: none;
			}
			.submit_button {
				background-color: #4CAF50; /* Green */
				border: none;
				color: white;
				padding: 12px 28px;
				text-align: center;
				text-decoration: none;
				display: inline-block;
				font-size: 12px;
				border-radius: 0.5rem;
			  }
			::-webkit-input-placeholder { color: #666;} 
			:-moz-placeholder { color: #666; }
			::-moz-placeholder { color: #666; }
			:-ms-input-placeholder { color: #666; }
			</style>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Cat Coding</title>
		</head>
		<body>
			<style>
			textarea {
				height: 100%;
				padding-bottom:25px;
				border: none;padding: 2px;
				background: rgba(255,255,255,0.95);
				min-height: 5em;
				max-height: 50vh;
				width: 100%;
			  	border-radius: 2%;
			  }
			</style>
			<h4> Title </h4>
			<div class="bg">
				
				<input id="title" class="input_title" type="text" placeholder="Let's find something..."/>
			</div>

			<script>
			  	/*
				var autoExpand = function (field) {

					// Reset field height
					field.style.height = 'inherit';
				
					// Get the computed styles for the element
					var computed = window.getComputedStyle(field);
				
					// Calculate the height
					var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
								+ parseInt(computed.getPropertyValue('padding-top'), 10)
								+ field.scrollHeight
								+ parseInt(computed.getPropertyValue('padding-bottom'), 10)
								+ parseInt(computed.getPropertyValue('border-bottom-width'), 10);
				
					field.style.height = height + 'px';
				
				};
				*/
				
				document.addEventListener('input1', function (event) {
					if (event.target.tagName.toLowerCase() !== 'textarea') return;
					autoExpand(event.target);
				}, false);
				const vscode = acquireVsCodeApi();
				function useAdvise() {
					let text_ = document.querySelector("#search").value;
					vscode.postMessage({command: 'search',text: text_})
				}
			</script>
			<h4> Content </h4>
			<div style="height:50%; padding-bottom:5px;">
				<textarea id="content" style="width:100%;">${content}</textarea>
			</div>
			<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>


			<link rel="stylesheet" href="https://rawgit.com/dbrekalo/fastselect/master/dist/fastselect.min.css">
			<script src="https://rawgit.com/dbrekalo/fastsearch/master/dist/fastsearch.min.js"></script>

			<style>
				@-webkit-keyframes fstAnimationEnter{from{opacity:0;-webkit-transform:translate3d(0, -1em, 0)}to{opacity:1;-webkit-transform:translate3d(0, 0, 0)}}@-moz-keyframes fstAnimationEnter{from{opacity:0;-moz-transform:translate3d(0, -1em, 0)}to{opacity:1;-moz-transform:translate3d(0, 0, 0)}}@keyframes fstAnimationEnter{from{opacity:0;-webkit-transform:translate3d(0, -1em, 0);-moz-transform:translate3d(0, -1em, 0);-ms-transform:translate3d(0, -1em, 0);-o-transform:translate3d(0, -1em, 0);transform:translate3d(0, -1em, 0)}to{opacity:1;-webkit-transform:translate3d(0, 0, 0);-moz-transform:translate3d(0, 0, 0);-ms-transform:translate3d(0, 0, 0);-o-transform:translate3d(0, 0, 0);transform:translate3d(0, 0, 0)}}.fstElement{display:inline-block;position:relative;border:1px solid #D7D7D7;box-sizing:border-box;color:#232323;font-size:1.1em;background-color:#fff}.fstElement>select,.fstElement>input{position:absolute;left:-999em}.fstToggleBtn{font-size:1.4em;display:block;position:relative;box-sizing:border-box;padding:.71429em 1.42857em .71429em .71429em;min-width:14.28571em;cursor:pointer}.fstToggleBtn:after{position:absolute;content:"";right:.71429em;top:50%;margin-top:-.17857em;border:.35714em solid transparent;border-top-color:#cacaca}.fstQueryInput{-webkit-appearance:none;-moz-appearance:none;-ms-appearance:none;-o-appearance:none;appearance:none;outline:none;box-sizing:border-box;background:transparent;border:0}.fstResults{position:absolute;left:-1px;top:100%;right:-1px;max-height:30em;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid #D7D7D7;border-top:0;background-color:#FFF;display:none}.fstResultItem{font-size:1.4em;display:block;padding:.5em .71429em;margin:0;cursor:pointer;border-top:1px solid #fff}.fstResultItem.fstUserOption{color:#707070}.fstResultItem.fstFocused{color:#fff;background-color:#43A2F3;}.fstResultItem.fstSelected{color:#fff;background-color:#2694f1;}.fstGroupTitle{font-size:1.4em;display:block;padding:.5em .71429em;margin:0;font-weight:bold}.fstGroup{padding-top:1em}.fstGroup:first-child{padding-top:0}.fstNoResults{font-size:1.4em;display:block;padding:.71429em .71429em;margin:0;color:#999}.fstSingleMode .fstControls{position:absolute;left:-1px;right:-1px;top:100%;padding:0.5em;border:1px solid #D7D7D7;background-color:#fff;display:none}.fstSingleMode .fstQueryInput{font-size:1.4em;display:block;width:100%;padding:.5em .35714em;color:#999;border:1px solid #D7D7D7}.fstSingleMode.fstActive{z-index:100}.fstSingleMode.fstActive.fstElement,.fstSingleMode.fstActive .fstControls,.fstSingleMode.fstActive .fstResults{box-shadow:0 0.2em 0.2em rgba(0,0,0,0.1)}.fstSingleMode.fstActive .fstControls{display:block}.fstSingleMode.fstActive .fstResults{display:block;z-index:10;margin-top:-1px}.fstChoiceItem{display:inline-block;font-size:1.2em;position:relative;margin:0 .41667em .41667em 0;padding:.33333em .33333em .33333em 1.5em;float:left;border-radius:.25em;border:1px solid #43A2F3;cursor:auto;color:#fff;background-color:#43A2F3;-webkit-animation:fstAnimationEnter 0.2s;-moz-animation:fstAnimationEnter 0.2s;animation:fstAnimationEnter 0.2s}.fstChoiceItem.mod1{background-color:#F9F9F9;border:1px solid #D7D7D7;color:#232323}.fstChoiceItem.mod1>.fstChoiceRemove{color:#a4a4a4}.fstChoiceRemove{margin:0;padding:0;border:0;cursor:pointer;background:none;font-size:1.16667em;position:absolute;left:0;top:50%;width:1.28571em;line-height:1.28571em;margin-top:-.64286em;text-align:center;color:#fff}.fstChoiceRemove::-moz-focus-inner{padding:0;border:0}.fstMultipleMode .fstControls{box-sizing:border-box;padding:0.5em 0.5em 0em 0.5em;overflow:hidden;width:20em;cursor:text}.fstMultipleMode .fstQueryInput{font-size:1.4em;float:left;padding:.28571em 0;margin:0 0 .35714em 0;width:2em;color:#999}.fstMultipleMode .fstQueryInputExpanded{float:none;width:100%;padding:.28571em .35714em}.fstMultipleMode .fstFakeInput{font-size:1.4em}.fstMultipleMode.fstActive,.fstMultipleMode.fstActive .fstResults{box-shadow:0 0.2em 0.2em rgba(0,0,0,0.1)}.fstMultipleMode.fstActive .fstResults{display:block;z-index:10;border-top:1px solid #D7D7D7}

				.fstElement { font-size: 0.7em; ; }
				.fstToggleBtn { min-width: 0.7em; }

				.submitBtn { display: none; }

				.fstMultipleMode { display: block; }
				.fstMultipleMode .fstControls { width: 100%; }

			</style>


			<script>
			(function(root, factory) {

				if (typeof define === 'function' && define.amd) {
					define(['jquery', 'fastsearch'], factory);
				} else if (typeof module === 'object' && module.exports) {
					module.exports = factory(require('jquery'), require('fastsearch'));
				} else {
					factory(root.jQuery);
				}
			
			}(this, function($) {
			
				var $document = $(document),
					instanceNum = 0,
					Fastsearch = $.fastsearch,
					pickTo = Fastsearch.pickTo,
					selectorFromClass = Fastsearch.selectorFromClass;
			
				function Fastselect(inputElement, options) {
			
					this.init.apply(this, arguments);
			
				}
			
				$.extend(Fastselect.prototype, {
			
					init: function(inputElement, options) {
			
						this.$input = $(inputElement);
			
						this.options = pickTo($.extend(true, {}, Fastselect.defaults, options, {
							placeholder: this.$input.attr('placeholder')
						}), this.$input.data(), [
							'url', 'loadOnce', 'apiParam', 'initialValue', 'userOptionAllowed'
						]);
						
						this.ens = '.fastselect' + (++instanceNum);
						this.hasCustomLoader = this.$input.is('input');
						this.isMultiple = !!this.$input.attr('multiple');
						this.userOptionAllowed = this.hasCustomLoader && this.isMultiple && this.options.userOptionAllowed;
			
						this.optionsCollection = new OptionsCollection(pickTo({multipleValues: this.isMultiple}, this.options, [
							'url', 'loadOnce', 'parseData', 'matcher'
						]));
			
						this.setupDomElements();
						this.setupFastsearch();
						this.setupEvents();
			
					},
			
					setupDomElements: function() {
			
						this.$el = $('<div>').addClass(this.options.elementClass);
			
						this[this.isMultiple ? 'setupMultipleElement' : 'setupSingleElement'](function() {
			
							this.updateDomElements();
							this.$controls.appendTo(this.$el);
							this.$el.insertAfter(this.$input);
							this.$input.detach().appendTo(this.$el);
			
						});
			
					},
			
					setupSingleElement: function(onDone) {
			
						var initialOptions = this.processInitialOptions(),
							toggleBtnText = initialOptions && initialOptions.length ? initialOptions[0].text : this.options.placeholder;
			
						this.$el.addClass(this.options.singleModeClass);
						this.$controls = $('<div>').addClass(this.options.controlsClass);
						this.$toggleBtn = $('<div>').addClass(this.options.toggleButtonClass).text(toggleBtnText).appendTo(this.$el);
						this.$queryInput = $('<input>').attr('placeholder', this.options.searchPlaceholder).addClass(this.options.queryInputClass).appendTo(this.$controls);
			
						onDone.call(this);
			
					},
			
					setupMultipleElement: function(onDone) {
			
						var self = this,
							options = self.options,
							initialOptions = this.processInitialOptions();
			
						this.$el.addClass(options.multipleModeClass);
						this.$controls = $('<div>').addClass(options.controlsClass);
						this.$queryInput = $('<input>').addClass(options.queryInputClass).appendTo(this.$controls);
			
						initialOptions && $.each(initialOptions, function(i, option) {
			
							self.addChoiceItem(option);
			
						});
			
						onDone.call(this);
			
					},
			
					updateDomElements: function() {
			
						this.$el.toggleClass(this.options.noneSelectedClass, !this.optionsCollection.hasSelectedValues());
						this.adjustQueryInputLayout();
			
					},
			
					processInitialOptions: function() {
			
						var self = this, options;
			
						if (this.hasCustomLoader) {
			
							options = this.options.initialValue;
			
							$.isPlainObject(options) && (options = [options]);
			
						} else {
			
							options = $.map(this.$input.find('option:selected').get(), function(option) {
			
								var $option = $(option);
			
								return {
									text: $option.text(),
									value: $option.attr('value')
								};
			
							});
			
						}
			
						options && $.each(options, function(i, option) {
							self.optionsCollection.setSelected(option);
						});
			
						return options;
			
					},
			
					addChoiceItem: function(optionModel) {
			
						$(
							'<div data-text="' + optionModel.text + '" data-value="' + optionModel.value + '" class="' + this.options.choiceItemClass + '">' +
								$('<div>').html(optionModel.text).text() +
								'<button class="' + this.options.choiceRemoveClass + '" type="button">×</button>' +
							'</div>'
						).insertBefore(this.$queryInput);
			
					},
			
					setupFastsearch: function() {
			
						var self = this,
							options = this.options,
							fastSearchParams = {};
			
						pickTo(fastSearchParams, options, [
							'resultsContClass', 'resultsOpenedClass', 'resultsFlippedClass', 'groupClass', 'itemClass', 'focusFirstItem',
							'groupTitleClass', 'loadingClass', 'noResultsClass', 'noResultsText', 'focusedItemClass', 'flipOnBottom'
						]);
			
						this.fastsearch = new Fastsearch(this.$queryInput.get(0), $.extend(fastSearchParams, {
			
							wrapSelector: this.isMultiple ? this.$el : this.$controls,
			
							minQueryLength: 0,
							typeTimeout: this.hasCustomLoader ? options.typeTimeout : 0,
							preventSubmit: true,
							fillInputId: false,
			
							responseFormat: {
								label: 'text',
								groupCaption: 'label'
							},
			
							onItemSelect: function($item, model, fastsearch) {
			
								var maxItems = options.maxItems;
			
								if (self.isMultiple && maxItems && (self.optionsCollection.getValues().length > (maxItems - 1))) {
			
									options.onMaxItemsReached && options.onMaxItemsReached(this);
			
								} else {
			
									self.setSelectedOption(model);
									self.writeToInput();
									!self.isMultiple && self.hide();
									options.clearQueryOnSelect && fastsearch.clear();
			
									if (self.userOptionAllowed && model.isUserOption) {
										fastsearch.$resultsCont.remove();
										delete fastsearch.$resultsCont;
										self.hide();
									}
			
									options.onItemSelect && options.onItemSelect.call(self, $item, model, self, fastsearch);
			
								}
			
							},
			
							onItemCreate: function($item, model) {
			
								model.$item = $item;
								model.selected && $item.addClass(options.itemSelectedClass);
			
								if (self.userOptionAllowed && model.isUserOption) {
									$item.text(self.options.userOptionPrefix + $item.text()).addClass(self.options.userOptionClass);
								}
			
								options.onItemCreate && options.onItemCreate.call(self, $item, model, self);
			
							}
			
						}));
			
						this.fastsearch.getResults = function() {
			
							if (self.userOptionAllowed && self.$queryInput.val().length > 1) {
								self.renderOptions();
							}
			
							self.getOptions(function() {
								self.renderOptions(true);
							});
			
						};
			
					},
			
					getOptions: function(onDone) {
			
						var options = this.options,
							self = this,
							params = {};
			
						if (this.hasCustomLoader) {
			
							var query = $.trim(this.$queryInput.val());
			
							if (query && options.apiParam) {
								params[options.apiParam] = query;
							}
			
							this.optionsCollection.fetch(params, onDone);
			
						} else {
			
							!this.optionsCollection.models && this.optionsCollection.reset(this.gleanSelectData(this.$input));
							onDone();
			
						}
			
					},
			
					namespaceEvents: function(events) {
			
						return Fastsearch.prototype.namespaceEvents.call(this, events);
			
					},
			
					setupEvents: function() {
			
						var self = this,
							options = this.options;
			
						if (this.isMultiple) {
			
							this.$el.on(this.namespaceEvents('click'), function(e) {
			
								$(e.target).is(selectorFromClass(options.controlsClass)) && self.$queryInput.focus();
								
							});
			
							this.$queryInput.on(this.namespaceEvents('keyup'), function(e) {
			
								// if (self.$queryInput.val().length === 0 && e.keyCode === 8) {
								//     console.log('TODO implement delete');
								// }
			
								self.adjustQueryInputLayout();
								self.show();
			
							}).on(this.namespaceEvents('focus'), function() {
			
								self.show();
			
							});
			
							this.$el.on(this.namespaceEvents('click'), selectorFromClass(options.choiceRemoveClass), function(e) {
			
								var $choice = $(e.currentTarget).closest(selectorFromClass(options.choiceItemClass));
			
								self.removeSelectedOption({
									value: $choice.attr('data-value'),
									text: $choice.attr('data-text')
								}, $choice);
			
							});
			
						} else {
			
							this.$el.on(this.namespaceEvents('click'), selectorFromClass(options.toggleButtonClass), function() {
			
								self.$el.hasClass(options.activeClass) ? self.hide() : self.show(true);
			
							});
			
						}
			
					},
			
					adjustQueryInputLayout: function() {
			
						if (this.isMultiple && this.$queryInput) {
			
							var noneSelected = this.$el.hasClass(this.options.noneSelectedClass);
			
							this.$queryInput.toggleClass(this.options.queryInputExpandedClass, noneSelected);
			
							if (noneSelected) {
			
								this.$queryInput.attr({
									style: '',
									placeholder: this.options.placeholder
								});
			
							} else {
			
								this.$fakeInput = this.$fakeInput || $('<span>').addClass(this.options.fakeInputClass);
								this.$fakeInput.text(this.$queryInput.val().replace(/\s/g, '&nbsp;'));
								this.$queryInput.removeAttr('placeholder').css('width', this.$fakeInput.insertAfter(this.$queryInput).width() + 20);
								this.$fakeInput.detach();
			
							}
			
						}
			
					},
			
					show: function(focus) {
			
						this.$el.addClass(this.options.activeClass);
						focus ? this.$queryInput.focus() : this.fastsearch.handleTyping();
			
						this.documentCancelEvents('on');
			
					},
			
					hide: function() {
			
						this.$el.removeClass(this.options.activeClass);
			
						this.documentCancelEvents('off');
			
					},
			
					documentCancelEvents: function(setup) {
			
						Fastsearch.prototype.documentCancelEvents.call(this, setup, this.hide);
			
					},
			
					setSelectedOption: function(option) {
			
						if (this.optionsCollection.isSelected(option.value)) {
							return;
						}
			
						this.optionsCollection.setSelected(option);
			
						var selectedModel = this.optionsCollection.findWhere(function(model) {
							return model.value === option.value;
						});
			
						if (this.isMultiple) {
			
							this.$controls && this.addChoiceItem(option);
			
						} else {
			
							this.fastsearch && this.fastsearch.$resultItems.removeClass(this.options.itemSelectedClass);
							this.$toggleBtn && this.$toggleBtn.text(option.text);
			
						}
			
						selectedModel && selectedModel.$item.addClass(this.options.itemSelectedClass);
			
						this.updateDomElements();
			
					},
			
					removeSelectedOption: function(option, $choiceItem) {
			
						var removedModel = this.optionsCollection.removeSelected(option);
			
						if (removedModel && removedModel.$item) {
			
							removedModel.$item.removeClass(this.options.itemSelectedClass);
			
						}
			
						if ($choiceItem) {
							$choiceItem.remove();
						} else {
							this.$el.find(selectorFromClass(this.options.choiceItemClass) + '[data-value="' + option.value + '"]').remove();
						}
			
						this.updateDomElements();
						this.writeToInput();
			
					},
			
					writeToInput: function() {
			
						var values = this.optionsCollection.getValues(),
							delimiter = this.options.valueDelimiter,
							formattedValue = this.isMultiple ? (this.hasCustomLoader ? values.join(delimiter) : values) : values[0];
			
						this.$input.val(formattedValue).trigger('change');
			
					},
			
					renderOptions: function(filter) {
			
						var query = this.$queryInput.val();
						var data;
			
						if (this.optionsCollection.models) {
							data = (filter ? this.optionsCollection.filter(query) : this.optionsCollection.models).slice(0);
						} else {
							data = [];
						}
			
						if (this.userOptionAllowed) {
			
							var queryInList = this.optionsCollection.models && this.optionsCollection.findWhere(function(model) {
								return model.value === query;
							});
			
							query && !queryInList && data.unshift({
								text: query,
								value: query,
								isUserOption: true
							});
			
						}
			
						this.fastsearch.showResults(this.fastsearch.storeResponse(data).generateResults(data));
			
					},
			
					gleanSelectData: function($select) {
			
						var self = this,
							$elements = $select.children();
			
						if ($elements.eq(0).is('optgroup')) {
			
							return $.map($elements.get(), function(optgroup) {
			
								var $optgroup = $(optgroup);
			
								return {
									label: $optgroup.attr('label'),
									items: self.gleanOptionsData($optgroup.children())
								};
			
							});
			
						} else {
			
							return this.gleanOptionsData($elements);
			
						}
			
					},
			
					gleanOptionsData: function($options) {
			
						return $.map($options.get(), function(option) {
							var $option = $(option);
							return {
								text: $option.text(),
								value: $option.attr('value'),
								selected: $option.is(':selected')
							};
						});
			
					},
			
					destroy: function() {
			
						$document.off(this.ens);
						this.fastsearch.destroy();
						this.$input.off(this.ens).detach().insertAfter(this.$el);
						this.$el.off(this.ens).remove();
			
						this.$input.data() && delete this.$input.data().fastselect;
			
					}
			
				});
			
				function OptionsCollection(options) {
			
					this.init(options);
			
				}
			
				$.extend(OptionsCollection.prototype, {
			
					defaults: {
						loadOnce: false,
						url: null,
						parseData: null,
						multipleValues: false,
						matcher: function(text, query) {
			
							return text.toLowerCase().indexOf(query.toLowerCase()) > -1;
			
						}
					},
			
					init: function(options) {
			
						this.options = $.extend({}, this.defaults, options);
						this.selectedValues = {};
					},
			
					fetch: function(fetchParams, onDone) {
			
						var self = this,
							afterFetch = function() {
								self.applySelectedValues(onDone);
							};
			
						if (this.options.loadOnce) {
			
							this.fetchDeferred = this.fetchDeferred || this.load(fetchParams);
							this.fetchDeferred.done(afterFetch);
			
						} else {
							this.load(fetchParams, afterFetch);
						}
			
					},
			
					reset: function(models) {
			
						this.models = this.options.parseData ? this.options.parseData(models) : models;
						this.applySelectedValues();
			
					},
			
					applySelectedValues: function(onDone) {
			
						this.each(function(option) {
			
							if (this.options.multipleValues && option.selected) {
			
								this.selectedValues[option.value] = true;
			
							} else {
			
								option.selected = !!this.selectedValues[option.value];
			
							}
			
						});
			
						onDone && onDone.call(this);
			
					},
			
					load: function(params, onDone) {
			
						var self = this,
							options = this.options;
			
							data = ${JSON.stringify(tags_option)};
			
							self.models = options.parseData ? options.parseData(data) : data;
			
							onDone && onDone.call(self);
			
						
			
					},
			
					setSelected: function(option) {
			
						if (!this.options.multipleValues) {
							this.selectedValues = {};
						}
			
						this.selectedValues[option.value] = true;
						this.applySelectedValues();
			
					},
			
					removeSelected: function(option) {
			
						var model = this.findWhere(function(model) {
							return option.value === model.value;
						});
			
						model && (model.selected = false);
			
						delete this.selectedValues[option.value];
			
						return model;
			
					},
			
					isSelected: function(value) {
			
						return !!this.selectedValues[value];
			
					},
			
					hasSelectedValues: function() {
			
						return this.getValues().length > 0;
			
					},
			
					each: function(iterator) {
			
						var self = this;
			
						this.models && $.each(this.models, function(i, option) {
			
							option.items ? $.each(option.items, function(i, nestedOption) {
								iterator.call(self, nestedOption);
							}) : iterator.call(self, option);
			
						});
			
					},
			
					where: function(predicate) {
			
						var temp = [];
			
						this.each(function(option) {
							predicate(option) && temp.push(option);
						});
			
						return temp;
			
					},
			
					findWhere: function(predicate) {
			
						var models = this.where(predicate);
			
						return models.length ? models[0] : undefined;
			
					},
			
					filter: function(query) {
			
						var self = this;
			
						function checkItem(item) {
							return self.options.matcher(item.text, query) ? item : null;
						}
			
						if (!query || query.length === 0) {
							return this.models;
						}
			
						return $.map(this.models, function(item) {
			
							if (item.items) {
			
								var filteredItems = $.map(item.items, checkItem);
			
								return filteredItems.length ? {
									label: item.label,
									items: filteredItems
								} : null;
			
							} else {
								return checkItem(item);
							}
			
						});
			
					},
			
					getValues: function() {
			
						return $.map(this.selectedValues, function(prop, key) {
							return prop ? key : null;
						});
			
					}
			
				});
			
				Fastselect.defaults = {
			
					elementClass: 'fstElement',
					singleModeClass: 'fstSingleMode',
					noneSelectedClass: 'fstNoneSelected',
					multipleModeClass: 'fstMultipleMode',
					queryInputClass: 'fstQueryInput',
					queryInputExpandedClass: 'fstQueryInputExpanded',
					fakeInputClass: 'fstFakeInput',
					controlsClass: 'fstControls',
					toggleButtonClass: 'fstToggleBtn',
					activeClass: 'fstActive',
					itemSelectedClass: 'fstSelected',
					choiceItemClass: 'fstChoiceItem',
					choiceRemoveClass: 'fstChoiceRemove',
					userOptionClass: 'fstUserOption',
			
					resultsContClass: 'fstResults',
					resultsOpenedClass: 'fstResultsOpened',
					resultsFlippedClass: 'fstResultsFilpped',
					groupClass: 'fstGroup',
					itemClass: 'fstResultItem',
					groupTitleClass: 'fstGroupTitle',
					loadingClass: 'fstLoading',
					noResultsClass: 'fstNoResults',
					focusedItemClass: 'fstFocused',
			
					matcher: null,
			
					url: null,
					loadOnce: false,
					apiParam: 'query',
					initialValue: null,
					clearQueryOnSelect: true,
					minQueryLength: 1,
					focusFirstItem: false,
					flipOnBottom: true,
					typeTimeout: 150,
					userOptionAllowed: false,
					valueDelimiter: ',',
					maxItems: null,
			
					parseData: null,
					onItemSelect: null,
					onItemCreate: null,
					onMaxItemsReached: null,
			
					placeholder: 'Choose option',
					searchPlaceholder: 'Search options',
					noResultsText: 'No results',
					userOptionPrefix: 'Add '
			
				};
			
				$.Fastselect = Fastselect;
				$.Fastselect.OptionsCollection = OptionsCollection;
			
				$.fn.fastselect = function(options) {
					return this.each(function() {
						if (!$.data(this, 'fastselect')) {
							$.data(this, 'fastselect', new Fastselect(this, options));
						}
					});
				};
			
				return $;
			
			}));
			
			</script>
			<h4> Tags: </h4>	
			
			<div>
			<input
			id="tags"
			type="text"
			multiple
			class="tagsInput"
			value="Algeria,Angola"
			data-user-option-allowed="true"
			data-url="https://740d05658c79.ngrok.io/data.json"
			data-load-once="false"
			name="language"/>
			</div>

			<script>(function () {
				$('.tagsInput').fastselect();
			
			})();</script>
			<script>
				//const vscode = acquireVsCodeApi();
				function createEntry() {
					let title = document.querySelector("#title").value;
					let content = document.querySelector("#content").value;
					let tags = document.querySelector("#tags").value;
					vscode.postMessage({command: 'createNewEntry', entry: {'title': title, 'content': content, 'tags': tags}})
				}
			</script>

			<button type="button" class="btn btn-primary btn-lg pull-right submit_button" onclick="createEntry()">Submit</button>
		</body>
		</html>`;

	}
}