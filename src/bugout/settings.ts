import { workspace } from "vscode"

export const defaultThemesMap = {
	"Visual Studio Light": "github.css",
	"Default Light+": "github.css",
	"Quiet Light": "github.css",
	"Solarized Light": "github.css",
	"Visual Studio Dark": "vs2015.css",
	"Default Dark+": "vs2015.css"
}

const configuration = workspace.getConfiguration()
export const bugoutSpireUrl: string | undefined = configuration.get("Bugout.Api.endpoint")
export const bugoutAccessToken: string | undefined = configuration.get("Bugout.AccessToken")
export const bugoutJournal: string | undefined = configuration.get("Bugout.Journal")

export function handlebarsHtmlEscape(template: string) {
	let left_combination = new RegExp(/&amplt/g)
	let right_combination = new RegExp(/&ampgt/g)
	let and_sign = new RegExp(/&amp/g)
	let left_sign = new RegExp(/&lt/g)
	let right_sign = new RegExp(/&gt/g)
	let double_quots_sign = new RegExp(/&quot/g)
	let quots_sign = new RegExp(/&#x27/g)
	let empersgrave_accentam_sign = new RegExp(/&#x60/g)
	let equals_sign = new RegExp(/&#x3D/g)

	return template
		.replace(left_combination, "<")
		.replace(right_combination, ">")
		.replace(double_quots_sign, '"')
		.replace(quots_sign, "'")
}
