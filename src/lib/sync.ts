/*
  The rules for keeping one notebook in step across devices.
  Pure functions only: no network here (that's cloud.ts), so it's easy to test.

  How it works
  - Every device keeps its own full copy (so the app works offline).
  - `notebook.sync.words` remembers a fingerprint of each word as the server has it.
    A word whose fingerprint has changed has edits waiting to go up.
    A fingerprint with no word next to it is a delete waiting to go up.
  - Pulling asks the server only for rows changed since the last pull.
  - If the same word was edited on two devices, the later edit wins.
  - If the same word was *added* on two devices (two ids), one copy is kept.
*/
import type { Notebook, QuizSession, SyncMeta, Word } from './types'
import { normalizeQuiz } from './storage'
import { normalizeWord, wordKey } from './words'

export type RemoteWord = { id: string; data: unknown; deleted: boolean; updated_at: string }
export type RemoteQuiz = { id: string; data: unknown; updated_at: string }

export type PendingChanges = {
  upserts: { word: Word; fingerprint: string }[]
  deletes: string[]
  quizzes: QuizSession[]
}

/** JSON with keys in a fixed order, so the same word always gives the same text. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** A short hash (cyrb53) of the word's contents. */
export function fingerprint(word: Word): string {
  const text = stableStringify(word)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export const freshMeta = (userId: string): SyncMeta => ({ userId, words: {}, quizzes: [] })

/** What this device has that the server doesn't yet. */
export function pendingChanges(n: Notebook): PendingChanges {
  const meta = n.sync
  if (!meta) return { upserts: [], deletes: [], quizzes: [] }
  const upserts = []
  const ids = new Set<string>()
  for (const word of n.words) {
    ids.add(word.id)
    const fp = fingerprint(word)
    if (meta.words[word.id] !== fp) upserts.push({ word, fingerprint: fp })
  }
  const deletes = Object.keys(meta.words).filter((id) => !ids.has(id))
  const known = new Set(meta.quizzes)
  const quizzes = n.quizzes.filter((q) => !known.has(q.id))
  return { upserts, deletes, quizzes }
}

export const countPending = (c: PendingChanges) => c.upserts.length + c.deletes.length + c.quizzes.length

const time = (s: string | undefined) => (s ? Date.parse(s) || 0 : 0)
const later = (a?: string, b?: string) => (time(a) >= time(b) ? a : b)

/** Two versions of one word: keep the later edit, and the higher quiz counts. */
function combine(a: Word, b: Word): Word {
  const base = time(a.updatedAt) >= time(b.updatedAt) ? a : b
  return {
    ...base,
    timesRight: Math.max(a.timesRight, b.timesRight),
    timesWrong: Math.max(a.timesWrong, b.timesWrong),
    lastQuizzedAt: later(a.lastQuizzedAt, b.lastQuizzedAt),
  }
}

/** Same word saved twice under different ids: which id to keep. Same answer on every device. */
const keepFirst = (a: Word, b: Word) =>
  time(a.savedAt) !== time(b.savedAt) ? time(a.savedAt) < time(b.savedAt) : a.id < b.id

/**
 * Brings changes pulled from the server into this device's notebook.
 * Signing in to a different account starts the bookkeeping afresh, so
 * everything on this device gets uploaded to that account.
 */
export function applyRemote(n: Notebook, userId: string, words: RemoteWord[], quizzes: RemoteQuiz[]): Notebook {
  const meta = n.sync?.userId === userId ? n.sync : freshMeta(userId)
  const synced = { ...meta.words }
  const local = new Map(n.words.map((w) => [w.id, w]))
  const byKey = new Map(n.words.map((w) => [wordKey(w.word), w.id]))
  const dirty = (w: Word) => fingerprint(w) !== synced[w.id]
  let pulledAt = meta.lastPulledAt

  const rows = [...words].sort((a, b) => time(a.updated_at) - time(b.updated_at))
  for (const row of rows) {
    pulledAt = later(row.updated_at, pulledAt)
    const mine = local.get(row.id)

    if (row.deleted) {
      // Deleted elsewhere. Keep it only if you edited it here since.
      if (mine && !dirty(mine)) {
        local.delete(row.id)
        if (byKey.get(wordKey(mine.word)) === row.id) byKey.delete(wordKey(mine.word))
      }
      delete synced[row.id]
      continue
    }

    const parsed = normalizeWord(row.data)
    if (!parsed) continue
    const theirs = { ...parsed, id: row.id }
    synced[row.id] = fingerprint(theirs)

    if (mine) {
      const next = dirty(mine) ? combine(mine, theirs) : theirs
      // A pulled copy replaces yours only if you haven't changed yours since.
      local.set(row.id, next)
      if (wordKey(mine.word) !== wordKey(next.word) && byKey.get(wordKey(mine.word)) === row.id) byKey.delete(wordKey(mine.word))
      byKey.set(wordKey(next.word), row.id)
      continue
    }

    const twinId = byKey.get(wordKey(theirs.word))
    const twin = twinId ? local.get(twinId) : undefined
    if (twin) {
      const merged = combine(twin, theirs)
      if (keepFirst(theirs, twin)) {
        // Keep the server's id; your copy's id gets deleted on the server, if it got there.
        local.delete(twin.id)
        local.set(row.id, { ...merged, id: row.id, savedAt: theirs.savedAt })
        byKey.set(wordKey(theirs.word), row.id)
      } else {
        // Keep your id. The server's copy stays in `synced` with no word, so it gets deleted there.
        local.set(twin.id, { ...merged, id: twin.id, savedAt: twin.savedAt })
      }
      continue
    }

    local.set(row.id, theirs)
    byKey.set(wordKey(theirs.word), row.id)
  }

  const knownQuizzes = new Set(meta.quizzes)
  const haveQuiz = new Set(n.quizzes.map((q) => q.id))
  const addedQuizzes: QuizSession[] = []
  for (const row of quizzes) {
    pulledAt = later(row.updated_at, pulledAt)
    knownQuizzes.add(row.id)
    if (haveQuiz.has(row.id)) continue
    const q = normalizeQuiz({ ...(row.data as object), id: row.id })
    if (!q) continue
    haveQuiz.add(q.id)
    addedQuizzes.push(q)
  }
  const allQuizzes = addedQuizzes.length
    ? [...n.quizzes, ...addedQuizzes].sort((a, b) => a.date.localeCompare(b.date))
    : n.quizzes

  return {
    ...n,
    words: [...local.values()],
    quizzes: allQuizzes,
    sync: { userId, lastPulledAt: pulledAt, words: synced, quizzes: [...knownQuizzes] },
  }
}

/** After an upload succeeds: remember what the server now has. */
export function markPushed(n: Notebook, userId: string, pushed: PendingChanges): Notebook {
  if (n.sync?.userId !== userId) return n
  const words = { ...n.sync.words }
  for (const { word, fingerprint: fp } of pushed.upserts) words[word.id] = fp
  for (const id of pushed.deletes) delete words[id]
  const quizzes = new Set(n.sync.quizzes)
  for (const q of pushed.quizzes) quizzes.add(q.id)
  return { ...n, sync: { ...n.sync, words, quizzes: [...quizzes] } }
}

/** Ask for a little overlap, in case two saves landed at nearly the same moment. */
export function pullFrom(lastPulledAt: string | undefined): string | undefined {
  if (!lastPulledAt) return undefined
  const t = Date.parse(lastPulledAt)
  return Number.isNaN(t) ? undefined : new Date(t - 60_000).toISOString()
}
