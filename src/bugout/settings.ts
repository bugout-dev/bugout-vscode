import * as vscode from "vscode"

const configuration = vscode.workspace.getConfiguration()
export const bugoutSpireUrl: string | undefined = configuration.get("Bugout.Api.endpoint")

export type BugoutAuthData = {
	access_token: string | undefined
	humbug_journal_id: string | undefined
}

export default class BugoutSettings {
	private storage: vscode.SecretStorage

	private static _instance: BugoutSettings

	constructor(storage: vscode.SecretStorage) {
		this.storage = storage
	}

	static init(context: vscode.ExtensionContext): void {
		BugoutSettings._instance = new BugoutSettings(context.secrets)
	}

	static get instance(): BugoutSettings {
		return BugoutSettings._instance
	}

	async storeAuthData(accessToken?: string, humbugJournalId?: string): Promise<void> {
		/*
		Update values in bugout_auth secret storage.
		*/
		try {
			let authData = await this.getAuthData()
			if (accessToken) authData.access_token = accessToken
			if (humbugJournalId) authData.humbug_journal_id = humbugJournalId
			this.storage.store("bugout_auth", JSON.stringify(authData))
		} catch (err) {
			console.log("Unable to store Bugout authentication data in Secret Storage")
		}
	}

	async getAuthData(): Promise<BugoutAuthData> {
		/*
		Retrieve data from bugout_auth secret storage.
		*/
		let authDataString = await this.storage.get("bugout_auth")
		if (authDataString != null) {
			return JSON.parse(authDataString) as BugoutAuthData
		} else {
			const authData: BugoutAuthData = {
				access_token: undefined,
				humbug_journal_id: undefined
			}
			return authData
		}
	}
}
