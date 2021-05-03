import { workspace } from "vscode"

const configuration = workspace.getConfiguration()
export const bugoutSpireUrl: string | undefined = configuration.get("Bugout.Api.endpoint")
export const bugoutAccessToken: string | undefined = configuration.get("Bugout.AccessToken")
export const bugoutJournal: string | undefined = configuration.get("Bugout.Journal")
