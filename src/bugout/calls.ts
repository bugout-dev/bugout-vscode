import axios from "axios"

import { bugoutSpireUrl, bugoutAccessToken } from "./settings"

export async function bugoutGetSearchResults(journalId: string, q: string, content: boolean = false) {
	let params = {
		headers: {
			Authorization: `Bearer ${bugoutAccessToken}`
		}
	}
	const searchResult = await axios.get(
		`${bugoutSpireUrl}/journals/${journalId}/search?q=${q}&content=${content}`,
		params
	)
	return searchResult.data
}

export async function bugoutGetJournals() {
	let params = {
		headers: {
			Authorization: `Bearer ${bugoutAccessToken}`
		}
	}
	const result = await axios.get(`${bugoutSpireUrl}/journals`, params)
	return result.data
}

export async function bugoutGetJournalEntries(journalId: string) {
	let params = {
		headers: {
			Authorization: `Bearer ${bugoutAccessToken}`
		}
	}
	const result = await axios.get(`${bugoutSpireUrl}/journals/${journalId}/entries`, params)
	console.log(result.data)
	return result.data
}
