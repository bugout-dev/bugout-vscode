import axios from "axios"

import { bugoutSpireUrl } from "./settings"

export async function bugoutGetSearchResults(
	accessToken: string,
	journalId: string,
	q: string,
	content: boolean = false
) {
	let params = {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	}
	const searchResult = await axios.get(
		`${bugoutSpireUrl}/journals/${journalId}/search?q=${q}&content=${content}`,
		params
	)
	return searchResult.data
}

export async function bugoutGetJournals(accessToken: string) {
	let params = {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	}
	const result = await axios.get(`${bugoutSpireUrl}/journals`, params)
	return result.data
}

export async function bugoutGetJournalEntries(accessToken: string, journalId: string) {
	let params = {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	}
	const result = await axios.get(`${bugoutSpireUrl}/journals/${journalId}/entries`, params)
	return result.data
}

export async function bugoutGetJournalEntry(accessToken: string, journalId: string, entryId: string) {
	let params = {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	}
	const result = await axios.get(`${bugoutSpireUrl}/journals/${journalId}/entries/${entryId}`, params)
	return result.data
}

export async function bugoutCreateJournalEntry(accessToken: string, journalId: string, entryData) {
	const params = {
		headers: {
			Authorization: `Bearer ${accessToken}`
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

export async function bugoutUpdateJournalEntry(accessToken: string, journalId: string, entryId: string, entryData) {
	const params = {
		headers: {
			Authorization: `Bearer ${accessToken}`
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
