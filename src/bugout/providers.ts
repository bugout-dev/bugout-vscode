import * as vscode from "vscode"
import axios from "axios"
import * as handlebars from "handlebars"
import * as highlight from "highlight.js"
import * as path from "path"
import * as fs from "fs"
import * as showdown from "showdown"

import { bugoutGetJournals } from "./calls"
import { bugoutSpireUrl, bugoutAccessToken, defaultThemesMap, handlebarsHtmlEscape } from "./settings"

export class ListProvider implements vscode.TreeDataProvider<BugoutTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<BugoutTreeItem | undefined> = new vscode.EventEmitter<
		BugoutTreeItem | undefined
	>()
	readonly onDidChangeTreeData: vscode.Event<BugoutTreeItem | undefined> = this._onDidChangeTreeData.event

	private autoRefresh = true
	private editor!: vscode.TextEditor
	private userJournals: any

	constructor(private context: vscode.ExtensionContext) {
		console.log("constructor")
	}

	getTreeItem(element: BugoutTreeItem): BugoutTreeItem {
		// console.log("getTreeItem:", element)
		return element
	}

	async getChildren(element: BugoutTreeItem) {
		this.userJournals = await this.fetchJournals()
		let treeItems: BugoutTreeItem[] = []

		this.userJournals.journals.forEach((journal) => {
			let treeItem = new BugoutTreeItem(journal.name)
			treeItem.command = {
				command: "extension.select",
				title: "Select journal",
				arguments: [journal]
			}
			treeItems.push(treeItem)
		})

		return Promise.resolve(treeItems)
	}

	async refresh(): Promise<void> {
		console.log("Bugout tree list refreshed")
		this._onDidChangeTreeData.fire(undefined)
	}

	async select(
		journal,
		bugoutWebView: vscode.WebviewPanel | undefined,
		bugoutsearchResultsProvider: SearchResultsProvider
	): Promise<void> {
		bugoutsearchResultsProvider.getSearch(this.context, bugoutWebView, journal.id, " ")
	}

	private async fetchJournals() {
		let userJournals = await bugoutGetJournals()
		return userJournals
	}
}

export class BugoutTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
		public readonly iconPath = {
			light: path.join(__filename, "..", "..", "resources", "light", "folder.svg"),
			dark: path.join(__filename, "..", "..", "resources", "dark", "folder.svg")
		}
	) {
		super(label, collapsibleState)
	}
}

export class SearchResultsProvider {
	public static readonly viewType = "Bugout-search"
	static _extensionUri: vscode.Uri

	public async getSearch(
		context: vscode.ExtensionContext,
		panel: vscode.WebviewPanel | undefined,
		journal: string,
		query?: string,
		tags?: Array<string>
	) {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

		if (panel === undefined) {
			panel = vscode.window.createWebviewPanel(
				SearchResultsProvider.viewType,
				"[Bugout] journals",
				vscode.ViewColumn.Beside
			)

			panel.webview.options = {
				enableScripts: true,
				enableCommandUris: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))]
			}
		}

		panel.webview.html = await this._getSearchHtmlForWebview(
			panel.webview,
			context.extensionPath,
			context.extensionUri,
			journal,
			query
		)

		let theme = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "vs.css"))

		vscode.workspace.onDidChangeConfiguration(() => {
			if (!panel || panel === undefined) {
				return
			}
			let currentThemeName = vscode.workspace.getConfiguration("workbench").get("colorTheme")
			console.log
			if (typeof currentThemeName === "string") {
				if (defaultThemesMap[currentThemeName]) {
					theme = panel.webview.asWebviewUri(
						vscode.Uri.joinPath(context.extensionUri, "media", defaultThemesMap[currentThemeName])
					)
				} else {
					theme = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "vs2015.css"))
				}
			}
			// Send a message to our webview.
			// You can send any JSON serializable data.
			panel.webview.postMessage({
				command: "update",
				highlightStyle: `${theme.scheme}://${theme.authority}${theme.path}`
			})
		})

		panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case "search":
						console.log(message)
						if (panel !== undefined) {
							panel.webview.html = await this._getSearchHtmlForWebview(
								panel.webview,
								context.extensionPath,
								context.extensionUri,
								message.journal,
								message.query
							)
						}
						break
					case "swithcFormat":
						if (panel !== undefined) {
							panel.webview.html = await this._getSearchHtmlForWebview(
								panel.webview,
								context.extensionPath,
								context.extensionUri,
								message.journal,
								message.query,
								message.format
							)
						}
						break
					case "editing":
						// generate editing view
						if (panel !== undefined) {
							panel.webview.html = await this._getEditEntryHtmlForWebview(
								panel.webview,
								context.extensionPath,
								message.content,
								message.title,
								message.tags,
								message.entry_id,
								message.search_state,
								message.journal_id
							)
						}
						break

					case "saveEntry":
						let entry = message.entry

						const options = {
							headers: {
								"x-bugout-client-id": "slack-some-track",
								Authorization: `Bearer ${bugoutAccessToken}`
							}
						}

						console.log(message)

						var payload: any = {
							title: entry.title,
							content: entry.content,
							context_id: "context_id",
							context_url: "permalink",
							context_type: "vscode"
						}
						console.log(payload)
						await axios.put(
							`${bugoutSpireUrl}/journals/${message.journal_id}/entries/${message.entry_id}`,
							payload,
							options
						)
						console.log(entry.tags.split(","))
						payload = {
							tags: entry.tags.split(",")
						}
						await axios.put(
							`${bugoutSpireUrl}/journals/${message.journal_id}/entries/${message.entry_id}/tags`,
							payload,
							options
						)

						if (panel !== undefined) {
							panel.webview.html = await this._getSearchHtmlForWebview(
								panel.webview,
								context.extensionPath,
								context.extensionUri,
								message.journal_id,
								message.query,
								message.format
							)
						}
						break

					case "cancel":
						if (panel !== undefined) {
							panel.webview.html = await this._getSearchHtmlForWebview(
								panel.webview,
								context.extensionPath,
								context.extensionUri,
								message.journal_id,
								message.query,
								message.format
							)
						}
						break
				}
				return
			},
			undefined,
			context.subscriptions
		)
	}

	public async generateEditEntry(
		context: vscode.ExtensionContext,
		extensionUri: vscode.Uri,
		panel: vscode.WebviewPanel | undefined
	) {
		var editor = vscode.window.activeTextEditor

		if (!editor) {
			return // No open text editor
		}

		var selection = editor.selection
		var text = editor.document.getText(selection)
		const ext = editor.document.fileName.split(".").pop()

		if (ext === "py") {
			text = "```python\n" + text + "\n```"
		}

		if (panel === undefined) {
			const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

			panel = vscode.window.createWebviewPanel(
				SearchResultsProvider.viewType,
				"[Bugout] journals",
				vscode.ViewColumn.Beside
			)

			panel.webview.options = {
				// Allow scripts in the webview
				enableScripts: true,
				enableCommandUris: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))] //[context.extensionUri]
			}

			console.log(panel.webview, context.extensionPath, text)
			panel.webview.html = await this._getEditEntryHtmlForWebview(panel.webview, context.extensionPath, text)
		} else {
			console.log(panel.webview, context.extensionPath, text)
			panel.webview.html = await this._getEditEntryHtmlForWebview(panel.webview, context.extensionPath, text)
		}

		panel.webview.onDidReceiveMessage(
			async (message) => {
				console.log(message.command)
				switch (message.command) {
					case "search":
						if (panel !== undefined) {
							panel.webview.html = await this._getSearchHtmlForWebview(
								panel.webview,
								context.extensionPath,
								context.extensionUri,
								message.journal,
								message.query
							)
						}
						break

					case "createNewEntry":
						let entry = message.entry

						const options = {
							headers: {
								"x-bugout-client-id": "slack-some-track",
								Authorization: `Bearer ${bugoutAccessToken}`
							}
						}

						console.log(message)

						let payload = {
							title: entry.title,
							content: entry.content,
							tags: entry.tags.split(","),
							context_id: "context_id",
							context_url: "permalink",
							context_type: "vscode"
						}
						console.log(payload)
						await axios.post(`${bugoutSpireUrl}/journals/${message.journal_id}/entries`, payload, options) ///.then(function (response) {return response.data})
						axios.create()

						vscode.window.showInformationMessage("A new entry was created in your journal.")
						if (panel !== undefined) {
							panel.dispose()
						}
						break
				}
			},
			undefined,
			context.subscriptions
		)
	}

	private async _getSearchHtmlForWebview(
		webview: vscode.Webview,
		extensionPath: string,
		extensionUri: vscode.Uri,
		journal: string,
		query?: string,
		formating_off?: boolean
	) {
		if (query === undefined) {
			query = ""
		}

		showdown.extension("highlight", function () {
			return [
				{
					type: "output",
					filter: function (text, converter, options) {
						var left = "<pre><code\\b[^>]*>",
							right = "</code></pre>",
							flags = "g"
						var replacement = function (wholeMatch, match, left, right) {
							var lang = (left.match(/class=\"([^ \"]+)/) || [])[1]
							left = left.slice(0, 18) + "hljs " + left.slice(18)

							if (lang && highlight.getLanguage(lang)) {
								return left + highlight.highlight(lang, match).value + right
							} else {
								return left + highlight.highlightAuto(match).value + right
							}
						}
						return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags)
					}
				}
			]
		})

		let md = new showdown.Converter({
			tables: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			emoji: true,
			tasklists: true,
			simpleLineBreaks: true,
			ghCodeBlocks: true,
			extensions: ["highlight"]
		})

		let params = {
			headers: {
				"x-bugout-client-id": "slack-some-track",
				Authorization: `Bearer ${bugoutAccessToken}`
			}
		}
		console.log(`${bugoutSpireUrl}/journals/${journal}/search?q=${query}`)
		const result = await axios.get(`${bugoutSpireUrl}/journals/${journal}/search?q=${query}`, params) ///.then(function (response) {return response.data})
		console.log("result")
		console.log(result)
		let data = result.data.results
		const request_journals = await axios.get(`${bugoutSpireUrl}/journals/`, params)
		const journals = request_journals.data.journals

		const load_tags = await axios.get(`${bugoutSpireUrl}/journals/${journals[0].id}/tags`, params) ///.then(function (response) {return response.data})
		let tags = load_tags.data

		console.log(tags)
		var tags_option: any[] = []

		for (var tag of tags) {
			tags_option.push({ text: tag[0], value: tag[0] })
		}

		// Get resource paths

		let theme = "vs.css"
		const currentThemeName = vscode.workspace.getConfiguration("workbench").get("colorTheme")
		if (typeof currentThemeName === "string") {
			if (defaultThemesMap[currentThemeName]) {
				theme = defaultThemesMap[currentThemeName]
			}
		}

		const highlightstyleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", theme))
		const jquery_js_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "jquery2.1.min.js"))
		)
		const fastsearch_js_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "fastsearch.min.js"))
		)
		const fastselect_css_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "fastselect.scss"))
		)
		const fastselect_js_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "fastselect_custom.js"))
		)
		const BaseContentUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri))

		let templateContent =
			'<div> \
									<div> _title_ </div> \
									<div> _tags_ </div> \
									<div> _content_ </div> \
									<div id="statistics_container"> \
									    <div id="updated_at"> _updated_at_</div> \
										<div id="search_score"> _score_ </div> \
									</div> \
								</div>'

		let search_html_block = ""

		let json_entries_object = JSON.stringify(data)

		for (var [index, entry] of data.entries()) {
			console.log(entry)

			let entry_represend = templateContent
			entry["index"] = index
			entry["entry_id"] = entry.entry_url.split("/")[entry.entry_url.split("/").length - 1]
			entry["html_object"] = JSON.stringify(entry)
			entry["rendered_title"] = md.makeHtml("## " + entry.title + "\n")
			entry["rendered_tags"] = md.makeHtml("**Tags:** " + "`" + entry.tags.join("` | `") + "`")
			entry["rendered_content"] = md.makeHtml(entry.content)
			entry["rendered_date"] = new Date(entry.updated_at).toString()
			entry["rendered_score"] = md.makeHtml("Score: " + entry.score.toFixed(2).toString())
			entry["edit_icon"] = md.makeHtml(":pencil2:")

			// Use `key` and `value`
		}
		if (search_html_block === "") {
			search_html_block = "<h4>No entries found</h4>"
		}
		console.log(highlightstyleUri)

		let prerender_data = {
			data: data,
			json_data: json_entries_object,
			BaseContentUri: BaseContentUri,
			vscodehighlight: highlightstyleUri,
			search_html_block: search_html_block,
			tags_option: JSON.stringify(tags_option),
			query: query,
			journal: journal,
			journals: journals,

			// load static
			fastsearch_js_uri: fastsearch_js_uri,
			fastselect_js_uri: fastselect_js_uri,
			jquery_js_uri: jquery_js_uri,
			fastselect_css_uri: fastselect_css_uri
		}

		const bars_template = fs.readFileSync(path.join(extensionPath, "views/search.html"), "utf-8")

		const template = handlebars.compile(bars_template)
		console.log(template(prerender_data))
		return handlebarsHtmlEscape(template(prerender_data))
	}

	private async _getEditEntryHtmlForWebview(
		webview: vscode.Webview,
		extensionPath: string,
		content: string,
		input_title?: string,
		input_tags?: string,
		entry_id?: string,
		search_state?: any,
		journal_id?: string
	) {
		let params = {
			headers: {
				"x-bugout-client-id": "slack-some-track",
				Authorization: `Bearer ${bugoutAccessToken}`
			}
		}

		const request_journals = await axios.get(`${bugoutSpireUrl}/journals/`, params)
		var journals = request_journals.data.journals

		const result = await axios.get(`${bugoutSpireUrl}/journals/${journals[0].id}/tags`, params) ///.then(function (response) {return response.data})
		let tags = result.data

		console.log(tags)
		var tags_option: any[] = []

		for (var tag of tags) {
			tags_option.push({ text: tag[0], value: tag[0] })
		}
		console.log(JSON.stringify(tags_option))
		const jquery_js_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "jquery2.1.min.js"))
		)
		const fastsearch_js_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "fastsearch.min.js"))
		)
		const fastselect_css_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "fastselect.scss"))
		)
		const fastselect_js_uri = webview.asWebviewUri(
			vscode.Uri.file(path.join(extensionPath, "media", "fastselect_custom.js"))
		)

		var tags_init_data

		if (input_tags !== undefined) {
			tags_init_data = "'["
			for (tag of input_tags.split(",")) {
				console.log(tag)
				tags_init_data = tags_init_data + `{"text":"${tag}","value":"${tag}"},`
			}
			tags_init_data = tags_init_data.slice(0, -1) + "]'"
		}

		let data = {
			fastsearch_js_uri: fastsearch_js_uri,
			fastselect_js_uri: fastselect_js_uri,
			jquery_js_uri: jquery_js_uri,
			fastselect_css_uri: fastselect_css_uri,
			tags_option: JSON.stringify(tags_option),
			journals: journals,
			journal_id: journal_id,
			title: input_title,
			content: content,
			tags: input_tags,
			tags_init_data: tags_init_data,
			entry_id: entry_id,
			search_state: search_state
		}

		const bars_template = fs.readFileSync(path.join(extensionPath, "views/createEntry.html"), "utf-8")

		const template = handlebars.compile(bars_template)

		return template(data)
	}
}
function el(el: any, arg1: (any: any) => boolean) {
	throw new Error("Function not implemented.")
}
