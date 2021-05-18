import * as vscode from "vscode"
import BugoutClient from "@bugout/bugout-js"
import * as path from "path"
import * as process from "process"
import * as fs from "fs"

export const bugoutClient = new BugoutClient()

export let rootPath: string | undefined

export function getPlatform(): string {
	if (process.platform === "win32") {
		return "win32"
	}
	if (process.platform === "linux") {
		return "linux"
	}
	throw new Error(`Sorry, the platform '${process.platform}' is not supported by Bugout.`)
}

export async function setTempRootPath(extensionContext: vscode.ExtensionContext): Promise<void> {
	/*
	Create folder: temp in bugout.bugout
	*/
	rootPath =
		extensionContext.extensionMode === vscode.ExtensionMode.Test
			? path.join(__dirname, "..", "..", "temp")
			: path.join(extensionContext.globalStorageUri.fsPath, "temp")

	fs.rmdirSync(rootPath, { recursive: true })
	await fs.promises.mkdir(rootPath, { recursive: true })
}

export function cleanTempRootPath(): void {
	if (rootPath) {
		try {
			fs.rmdirSync(rootPath, { recursive: true })
		} catch (err) {
			// Unable to clean temp path.
		}
	}
}

export async function removeTempEntry(entryPath: string) {
	await fs.unlink(entryPath, (err) => {
		if (err) {
			console.log("Unable to remove entry temp file")
			return
		}
	})
}

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
