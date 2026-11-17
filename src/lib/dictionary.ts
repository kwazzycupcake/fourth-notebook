/*
  Looks words up in the Free Dictionary API (https://dictionaryapi.dev).
  Free, no key. Some words come back without examples or synonyms; those
  fields simply stay empty for you to fill in.
*/
import type { PartOfSpeech } from './types'
import { PARTS_OF_SPEECH } from './types'

const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const TIMEOUT_MS = 8000
const MAX_LIST = 5

/** One definition you can choose from. */
export type DefinitionOption = {
  partOfSpeech?: PartOfSpeech
  definition: string
  example?: string
}

export type LookupResult = {
  word: string
  phonetic?: string
  /** All definitions found, in dictionary order. The first is the suggested one. */
  options: DefinitionOption[]
  synonyms: string[]
  antonyms: string[]
}

export type LookupOutcome =
  | { ok: true; result: LookupResult }
  | { ok: false; reason: 'not-found' | 'offline' | 'error' }

// ---- The bits of the API response we use ----
type ApiDefinition = { definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] }
type ApiMeaning = { partOfSpeech?: string; definitions?: ApiDefinition[]; synonyms?: string[]; antonyms?: string[] }
type ApiEntry = { word?: string; phonetic?: string; phonetics?: { text?: string }[]; meanings?: ApiMeaning[] }

const toPos = (p: string | undefined): PartOfSpeech | undefined => {
  if (!p) return undefined
  const lower = p.toLowerCase()
  return PARTS_OF_SPEECH.includes(lower as PartOfSpeech) ? (lower as PartOfSpeech) : 'other'
}

const uniqueList = (items: (string | undefined)[], exclude: string): string[] => {
  const seen = new Set<string>([exclude.toLowerCase()])
  const out: string[] = []
  for (const item of items) {
    const t = item?.trim()
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t)
    if (out.length >= MAX_LIST) break
  }
  return out
}

/** Turns the API's response into what the form needs. Exported for tests. */
export function parseEntries(entries: ApiEntry[], searched: string): LookupResult | null {
  const options: DefinitionOption[] = []
  const synonyms: string[] = []
  const antonyms: string[] = []
  let phonetic: string | undefined

  for (const entry of entries) {
    phonetic ??= entry.phonetic || entry.phonetics?.find((p) => p.text)?.text
    for (const meaning of entry.meanings ?? []) {
      const partOfSpeech = toPos(meaning.partOfSpeech)
      for (const d of meaning.definitions ?? []) {
        const definition = d.definition?.trim()
        if (!definition) continue
        options.push({ partOfSpeech, definition, example: d.example?.trim() || undefined })
        synonyms.push(...(d.synonyms ?? []))
        antonyms.push(...(d.antonyms ?? []))
      }
      synonyms.push(...(meaning.synonyms ?? []))
      antonyms.push(...(meaning.antonyms ?? []))
    }
  }

  if (options.length === 0) return null
  return {
    word: entries[0]?.word?.trim() || searched,
    phonetic: phonetic?.trim() || undefined,
    options,
    synonyms: uniqueList(synonyms, searched),
    antonyms: uniqueList(antonyms, searched),
  }
}

export async function lookupWord(word: string, fetchFn: typeof fetch = fetch): Promise<LookupOutcome> {
  const q = word.trim()
  if (!q) return { ok: false, reason: 'not-found' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetchFn(API + encodeURIComponent(q.toLowerCase()), { signal: controller.signal })
    if (res.status === 404) return { ok: false, reason: 'not-found' }
    if (!res.ok) return { ok: false, reason: 'error' }
    const data: unknown = await res.json()
    const result = Array.isArray(data) ? parseEntries(data as ApiEntry[], q) : null
    return result ? { ok: true, result } : { ok: false, reason: 'not-found' }
  } catch {
    return { ok: false, reason: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error' }
  } finally {
    clearTimeout(timer)
  }
}
