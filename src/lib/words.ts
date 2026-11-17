import type { Box, PartOfSpeech, Source, SourceType, Word, WordInput } from './types'
import { PARTS_OF_SPEECH, SOURCE_TYPES } from './types'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const clean = (s: unknown): string | undefined => {
  if (typeof s !== 'string') return undefined
  const t = s.trim()
  return t === '' ? undefined : t
}

const cleanList = (list: unknown): string[] =>
  Array.isArray(list) ? list.map(clean).filter((s): s is string => s !== undefined) : []

const cleanSource = (raw: unknown): Source | undefined => {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const type = SOURCE_TYPES.includes(r.type as SourceType) ? (r.type as SourceType) : undefined
  if (!type) return undefined
  return { type, title: clean(r.title), author: clean(r.author) }
}

const cleanPos = (raw: unknown): PartOfSpeech | undefined =>
  PARTS_OF_SPEECH.includes(raw as PartOfSpeech) ? (raw as PartOfSpeech) : undefined

const validDate = (raw: unknown, fallback: string): string =>
  typeof raw === 'string' && !Number.isNaN(Date.parse(raw)) ? raw : fallback

/** Builds a complete new word from what you typed. */
export function createWord(input: WordInput, now = new Date()): Word {
  const stamp = now.toISOString()
  return {
    id: newId(),
    word: input.word.trim(),
    meanings: cleanList(input.meanings),
    partOfSpeech: input.partOfSpeech,
    phonetic: clean(input.phonetic),
    example: clean(input.example),
    synonyms: cleanList(input.synonyms),
    antonyms: cleanList(input.antonyms),
    source: cleanSource(input.source),
    notes: clean(input.notes),
    favourite: input.favourite ?? false,
    savedAt: validDate(input.savedAt, stamp),
    updatedAt: stamp,
    timesRight: 0,
    timesWrong: 0,
    box: 1,
    dueAt: stamp,
  }
}

/**
 * Turns anything read from storage or a backup file into a valid Word,
 * filling in missing fields. Returns null if it has no word or no meaning.
 */
export function normalizeWord(raw: unknown, now = new Date()): Word | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const word = clean(r.word)
  // Accept an older single "meaning" field as well as "meanings".
  const meanings = cleanList(Array.isArray(r.meanings) ? r.meanings : [r.meaning])
  if (!word || meanings.length === 0) return null

  const stamp = now.toISOString()
  const box = [1, 2, 3, 4, 5].includes(r.box as number) ? (r.box as Box) : 1
  const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0)

  return {
    id: clean(r.id) ?? newId(),
    word,
    meanings,
    partOfSpeech: cleanPos(r.partOfSpeech),
    phonetic: clean(r.phonetic),
    example: clean(r.example),
    synonyms: cleanList(r.synonyms),
    antonyms: cleanList(r.antonyms),
    source: cleanSource(r.source),
    notes: clean(r.notes),
    favourite: r.favourite === true,
    savedAt: validDate(r.savedAt, stamp),
    updatedAt: validDate(r.updatedAt, stamp),
    timesRight: count(r.timesRight),
    timesWrong: count(r.timesWrong),
    lastQuizzedAt: typeof r.lastQuizzedAt === 'string' ? validDate(r.lastQuizzedAt, stamp) : undefined,
    box,
    dueAt: validDate(r.dueAt, stamp),
  }
}

/** Case-insensitive key used to spot the same word saved twice. */
export const wordKey = (word: string) => word.trim().toLocaleLowerCase()
