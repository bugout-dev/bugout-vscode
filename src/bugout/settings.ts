import { workspace } from "vscode"

const configuration = workspace.getConfiguration()
export const bugoutSpireUrl: string | undefined = configuration.get("Bugout.Api.endpoint")
export const bugoutAccessToken: string | undefined = configuration.get("Bugout.AccessToken")
export const bugoutHumbugJournalId: string | undefined = configuration.get("Bugout.CrashReportsJournal")
