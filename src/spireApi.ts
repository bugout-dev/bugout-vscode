import * as vscode from 'vscode';
import * as axios from 'axios';

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
class BugOut {

	

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

class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;
  
    data: TreeItem[];
  
    constructor(fill_data: TreeItem[]) {
      this.data = fill_data;


    }
  
    getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
      return element;
    }
  
    getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
      if (element === undefined) {
        return this.data;
      }
      return element.children;
    }
  }
  
  class TreeItem extends vscode.TreeItem {
    children: TreeItem[]|undefined;
  
    constructor(label: string, children?: TreeItem[]) {
      super(
          label,
          children === undefined ? vscode.TreeItemCollapsibleState.None :
                                   vscode.TreeItemCollapsibleState.Expanded);
      this.children = children;
    }
  }