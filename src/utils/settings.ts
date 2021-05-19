import BugoutClient from "@bugout/bugout-js"
import * as path from "path"
import * as process from "process"
import * as fs from "fs"
import { ExtensionContext, ExtensionMode, SecretStorage } from "vscode"

export const bugoutClient = new BugoutClient()

type BugoutAuthData = {
	access_token: string | undefined
	humbug_journal_id: string | undefined
}

export default class BugoutSettings {
	private static _instance: BugoutSettings
	private authStorage: SecretStorage

	public platform: string
	public scheme: string
	public tempRootPath: string

	constructor(private context: ExtensionContext) {
		this.scheme = "bugout"
		this.authStorage = context.secrets
		this.tempRootPath = this.setTempRootPath()
		this.platform = this.getPlatform()
	}

	static init(context: ExtensionContext): void {
		BugoutSettings._instance = new BugoutSettings(context)
	}

	static get instance(): BugoutSettings {
		return BugoutSettings._instance
	}

	async storeAuthData(accessToken?: string, humbugJournalId?: string): Promise<void> {
		/*
		Update values in bugout_auth secret authStorage.
		*/
		try {
			let authData = await this.getAuthData()
			if (accessToken) authData.access_token = accessToken
			if (humbugJournalId) authData.humbug_journal_id = humbugJournalId
			this.authStorage.store("bugout_auth", JSON.stringify(authData))
		} catch (err) {
			console.log("Unable to store Bugout authentication data in Secret Storage")
		}
	}

	async getAuthData(): Promise<BugoutAuthData> {
		/*
		Retrieve data from bugout_auth secret authStorage.
		*/
		let authDataString = await this.authStorage.get("bugout_auth")
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

	getPlatform(): string {
		if (process.platform === "win32") {
			return "win32"
		}
		if (process.platform === "linux") {
			return "linux"
		}
		throw new Error(`Sorry, the platform '${process.platform}' is not supported by Bugout`)
	}

	setTempRootPath(): string {
		/*
		Create folder: temp in bugout.bugout
		*/
		try {
			const rootPath =
				this.context.extensionMode === ExtensionMode.Test
					? path.join(__dirname, "..", "..", "temp")
					: path.join(this.context.globalStorageUri.fsPath, "temp")

			fs.rmdirSync(rootPath, { recursive: true })
			fs.mkdirSync(rootPath, { recursive: true })
			return rootPath
		} catch (e) {
			throw new Error("Unable to set tempRootPath")
		}
	}

	static removeTempEntry(entryPath: string) {
		try {
			fs.unlinkSync(entryPath)
		} catch (e) {
			// Unable to delete entry file.
		}
	}

	static clean(): void {
		try {
			fs.rmdirSync(this._instance.tempRootPath, { recursive: true })
		} catch (e) {
			// Unable to clean temp path.
		}
	}
}
