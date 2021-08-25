import { ExtensionContext } from "vscode"

import BugoutSettings from "./utils/settings"
import { registerAuthSetup, registerBugoutTree, registerEntryEditor, registerHumbugHover } from "./events"

export async function activate(context: ExtensionContext): Promise<void> {
	BugoutSettings.init(context)

	// TODO(kompotkot): Add registerSetup() with humbug reporter
	// and consent checkbox in settings
	registerAuthSetup()

	await registerBugoutTree(context)
	await registerEntryEditor(context)
	await registerHumbugHover()
}

export async function deactivate(): Promise<void> {
	BugoutSettings.clean()
}
