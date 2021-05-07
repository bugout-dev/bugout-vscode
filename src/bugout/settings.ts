import { workspace } from "vscode"
import { env } from "process"

const configuration = workspace.getConfiguration()

function getBugoutAccessToken(): string | undefined {
	const bugoutAccessToken: string | undefined = configuration.get("Bugout.AccessToken")
	if (bugoutAccessToken) {
		return bugoutAccessToken
	}
	const bugoutAccessTokenEnv: string | undefined = env.BUGOUT_ACCESS_TOKEN
	if (bugoutAccessTokenEnv) {
		return bugoutAccessTokenEnv
	}
	return undefined
}

function getBugoutSpireUrl(): string | undefined {
	const bugoutSpireUrl: string | undefined = configuration.get("Bugout.Api.endpoint")
	if (bugoutSpireUrl) {
		return bugoutSpireUrl
	}
	const bugoutSpireUrlEnv: string | undefined = env.BUGOUT_SPIRE_URL
	if (bugoutSpireUrlEnv) {
		return bugoutSpireUrlEnv
	}
	return "https://spire.bugout.dev"
}

function getBugoutHumbugJournalId(): string | undefined {
	const bugoutHumbugJournalId: string | undefined = configuration.get("Bugout.CrashReportsJournal")
	if (bugoutHumbugJournalId) {
		return bugoutHumbugJournalId
	}
	const bugoutHumbugJournalIdEnv: string | undefined = env.BUGOUT_HUMBUG_JOURNAL_ID
	if (bugoutHumbugJournalIdEnv) {
		return bugoutHumbugJournalIdEnv
	}
	return undefined
}

export const bugoutToken = getBugoutAccessToken()
export const bugoutSpireUrl = getBugoutSpireUrl()
export const bugoutHumbugJournalId = getBugoutHumbugJournalId()
