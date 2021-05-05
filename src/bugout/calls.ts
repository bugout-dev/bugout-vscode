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
	return result.data
}

export async function bugoutGetJournalEntry(journalId: string, entryId: string) {
	let params = {
		headers: {
			Authorization: `Bearer ${bugoutAccessToken}`
		}
	}
	const result = await axios.get(`${bugoutSpireUrl}/journals/${journalId}/entries/${entryId}`, params)
	return result.data
}

export async function bugoutCreateJournalEntry(journalId: string, entryData) {
	const params = {
		headers: {
			Authorization: `Bearer ${bugoutAccessToken}`
		}
	}
	const payload = {
		title: entryData.title,
		content: entryData.content,
		context_type: "vscode"
	}
	const result = await axios.post(`${bugoutSpireUrl}/journals/${journalId}/entries`, payload, params)
	return result.data
}

export async function bugoutUpdateJournalEntry(journalId: string, entryId: string, entryData) {
	const params = {
		headers: {
			Authorization: `Bearer ${bugoutAccessToken}`
		}
	}
	const payload = {
		title: entryData.title,
		content: entryData.content,
		tags: entryData.tags
	}
	const result = await axios.put(
		`${bugoutSpireUrl}/journals/${journalId}/entries/${entryId}?tags_action=replace`,
		payload,
		params
	)
	return result.data
}
