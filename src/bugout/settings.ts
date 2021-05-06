import { workspace } from "vscode"
import { env } from "process"

const configuration = workspace.getConfiguration()
export const bugoutSpireUrl: string | undefined = configuration.get("Bugout.Api.endpoint")
export const bugoutHumbugJournalId: string | undefined = configuration.get("Bugout.CrashReportsJournal")

export function getBugoutAccessToken(): string | undefined {
	const bugoutAccessTokenEnv: string | undefined = env.BUGOUT_ACCESS_TOKEN
	const bugoutAccessToken: string | undefined = configuration.get("Bugout.AccessToken")
	if (bugoutAccessTokenEnv) {
		return bugoutAccessTokenEnv
	} else {
		return bugoutAccessToken
	}
}
