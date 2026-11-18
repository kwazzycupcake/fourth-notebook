/*
  The only file that knows where the notebook is saved.
  Today that is the browser's localStorage. Moving to a database later
  means changing this file and nothing else.
*/
import { STORAGE_KEY } from '../config'
import type { Notebook, QuizSession, SyncMeta } from './types'
import { normalizeWord, wordKey } from './words'

type Reader = Pick<Storage, 'getItem'>
type Writer = Pick<Storage, 'setItem'>

const browserStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined // blocked, e.g. some private modes
  }
}

export function emptyNotebook(): Notebook {
  return { version: 1, words: [], quizzes: [], settings: {} }
}

export function normalizeQuiz(raw: unknown): QuizSession | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.date !== 'string' || !Array.isArray(r.answers)) return null
  const format = r.format === 'word' ? 'word' : 'meaning'
  const answers = r.answers
    .filter((a): a is { wordId: string; correct: boolean } =>
      !!a && typeof a === 'object' && typeof (a as Record<string, unknown>).wordId === 'string',
    )
    .map((a) => ({ wordId: a.wordId, correct: a.correct === true }))
  return { id: r.id, date: r.date, format, answers }
}

/**
 * Checks and repairs a notebook read from storage or a backup.
 * Returns null if it doesn't look like a notebook at all.
 */
export function normalizeNotebook(raw: unknown): { notebook: Notebook; skipped: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.words)) return null

  const now = new Date()
  const seen = new Set<string>()
  const words = []
  let skipped = 0
  for (const item of r.words) {
    const w = normalizeWord(item, now)
    if (!w || seen.has(w.id)) {
      skipped++
      continue
    }
    seen.add(w.id)
    words.push(w)
  }

  const quizzes = Array.isArray(r.quizzes)
    ? r.quizzes.map(normalizeQuiz).filter((q): q is QuizSession => q !== null)
    : []

  const settings = r.settings && typeof r.settings === 'object' ? (r.settings as Notebook['settings']) : {}
  const lastBackupAt = typeof r.lastBackupAt === 'string' ? r.lastBackupAt : undefined
  const sync = normalizeSync(r.sync)

  return { notebook: { version: 1, words, quizzes, settings, lastBackupAt, ...(sync && { sync }) }, skipped }
}

function normalizeSync(raw: unknown): SyncMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.userId !== 'string' || !r.words || typeof r.words !== 'object') return undefined
  const words: Record<string, string> = {}
  for (const [id, fp] of Object.entries(r.words as Record<string, unknown>)) if (typeof fp === 'string') words[id] = fp
  return {
    userId: r.userId,
    lastPulledAt: typeof r.lastPulledAt === 'string' ? r.lastPulledAt : undefined,
    words,
    quizzes: Array.isArray(r.quizzes) ? r.quizzes.filter((q): q is string => typeof q === 'string') : [],
  }
}

export function loadNotebook(storage: Reader | undefined = browserStorage()): Notebook {
  try {
    const text = storage?.getItem(STORAGE_KEY)
    if (!text) return emptyNotebook()
    return normalizeNotebook(JSON.parse(text))?.notebook ?? emptyNotebook()
  } catch {
    return emptyNotebook()
  }
}

export function saveNotebook(
  notebook: Notebook,
  storage: Writer | undefined = browserStorage(),
): { ok: true } | { ok: false; error: string } {
  if (!storage) return { ok: false, error: "This browser isn't allowing the app to save. Check that site data isn't blocked." }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(notebook))
    return { ok: true }
  } catch {
    return { ok: false, error: 'The browser ran out of space for this notebook. Download a backup now so nothing is lost.' }
  }
}

// ---------- Backup files ----------

export function serializeBackup(notebook: Notebook, now = new Date()): string {
  // Sync bookkeeping belongs to this device, not the backup.
  const { sync: _sync, ...rest } = notebook
  return JSON.stringify({ app: 'fourth-notebook', exportedAt: now.toISOString(), ...rest }, null, 2)
}

export function backupFilename(now = new Date()): string {
  const d = now.toISOString().slice(0, 10)
  return `fourth-notebook-backup-${d}.json`
}

export type ParsedBackup =
  | { ok: true; notebook: Notebook; skipped: number; exportedAt?: string }
  | { ok: false; error: string }

export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: "This file isn't a notebook backup. Choose the .json file you downloaded from Backup & restore." }
  }
  const result = normalizeNotebook(raw)
  if (!result) {
    return { ok: false, error: "This file doesn't contain any notebook words. Choose a backup downloaded from this app." }
  }
  const exportedAt = (raw as Record<string, unknown>).exportedAt
  const { sync: _sync, ...notebook } = result.notebook
  return {
    ok: true,
    notebook,
    skipped: result.skipped,
    exportedAt: typeof exportedAt === 'string' ? exportedAt : undefined,
  }
}

/**
 * Combines two notebooks, e.g. your phone's and your laptop's.
 * If the same word (ignoring capitals) is in both, the most recently edited copy wins.
 */
export function mergeNotebooks(current: Notebook, incoming: Notebook): Notebook {
  const byWord = new Map(current.words.map((w) => [wordKey(w.word), w]))
  for (const w of incoming.words) {
    const key = wordKey(w.word)
    const existing = byWord.get(key)
    if (!existing || Date.parse(w.updatedAt) > Date.parse(existing.updatedAt)) byWord.set(key, w)
  }
  const quizIds = new Set(current.quizzes.map((q) => q.id))
  const quizzes = [...current.quizzes, ...incoming.quizzes.filter((q) => !quizIds.has(q.id))]
  quizzes.sort((a, b) => a.date.localeCompare(b.date))

  return { ...current, words: [...byWord.values()], quizzes }
}
