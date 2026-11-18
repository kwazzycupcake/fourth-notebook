import { describe, expect, it } from 'vitest'
import { reducer } from '../store/reducer'
import { emptyNotebook, loadNotebook, parseBackup, saveNotebook, serializeBackup } from './storage'
import { applyRemote, countPending, fingerprint, markPushed, pendingChanges, type RemoteWord } from './sync'
import type { Notebook, Word } from './types'
import { createWord } from './words'

const U = 'user-1'
const at = (min: number) => new Date(Date.UTC(2026, 10, 18, 10, min)).toISOString()

const word = (w: string, min = 0, extra: Partial<Word> = {}): Word => ({
  ...createWord({ word: w, meanings: [`meaning of ${w}`] }, new Date(at(min))),
  ...extra,
})

const row = (w: Word, min: number): RemoteWord => ({ id: w.id, data: w, deleted: false, updated_at: at(min) })
const tomb = (id: string, min: number): RemoteWord => ({ id, data: null, deleted: true, updated_at: at(min) })

/** Signs in and uploads everything, so the notebook starts fully synced. */
function synced(words: Word[]): Notebook {
  const n = applyRemote({ ...emptyNotebook(), words }, U, [], [])
  return markPushed(n, U, pendingChanges(n))
}

describe('sync', () => {
  it('fingerprints ignore key order (the database reorders JSON keys)', () => {
    const w = word('tirade')
    const shuffled = Object.fromEntries(Object.entries(w).reverse()) as Word
    expect(fingerprint(shuffled)).toBe(fingerprint(w))
    expect(fingerprint({ ...w, favourite: true })).not.toBe(fingerprint(w))
  })

  it('uploads everything on this device the first time you sign in', () => {
    const n = applyRemote({ ...emptyNotebook(), words: [word('a'), word('b')] }, U, [], [])
    expect(pendingChanges(n).upserts).toHaveLength(2)
    expect(countPending(pendingChanges(markPushed(n, U, pendingChanges(n))))).toBe(0)
  })

  it('notices edits, deletes and new quiz results', () => {
    const a = word('a')
    const b = word('b')
    let n = synced([a, b])
    n = reducer(n, { type: 'toggleFavourite', id: a.id, at: at(5) })
    n = reducer(n, { type: 'remove', id: b.id })
    n = reducer(n, { type: 'recordQuiz', session: { id: 'q1', date: at(6), format: 'meaning', answers: [{ wordId: a.id, correct: true }] } })
    const p = pendingChanges(n)
    expect(p.upserts.map((u) => u.word.id)).toEqual([a.id])
    expect(p.deletes).toEqual([b.id])
    expect(p.quizzes.map((q) => q.id)).toEqual(['q1'])
  })

  it('brings in words added on another device', () => {
    const n = applyRemote(synced([word('a')]), U, [row(word('vie'), 3)], [])
    expect(n.words.map((w) => w.word)).toEqual(['a', 'vie'])
    expect(countPending(pendingChanges(n))).toBe(0)
    expect(n.sync?.lastPulledAt).toBe(at(3))
  })

  it("takes another device's edit when you haven't touched the word here", () => {
    const a = word('a')
    const n = applyRemote(synced([a]), U, [row({ ...a, notes: 'from phone', updatedAt: at(9) }, 9)], [])
    expect(n.words[0].notes).toBe('from phone')
    expect(countPending(pendingChanges(n))).toBe(0)
  })

  it('keeps the later edit when both devices changed a word, and the higher quiz counts', () => {
    const a = word('a')
    let n = synced([a])
    n = reducer(n, { type: 'update', id: a.id, changes: { notes: 'laptop' }, at: at(20) })
    const phone = { ...a, notes: 'phone', updatedAt: at(10), timesRight: 4 }
    n = applyRemote(n, U, [row(phone, 11)], [])
    expect(n.words[0]).toMatchObject({ notes: 'laptop', timesRight: 4 })
    expect(pendingChanges(n).upserts).toHaveLength(1) // the winner goes back up
  })

  it('removes a word deleted elsewhere, unless you edited it here since', () => {
    const a = word('a')
    const b = word('b')
    let n = synced([a, b])
    n = reducer(n, { type: 'update', id: b.id, changes: { notes: 'still want it' }, at: at(30) })
    n = applyRemote(n, U, [tomb(a.id, 31), tomb(b.id, 31)], [])
    expect(n.words.map((w) => w.word)).toEqual(['b'])
    expect(pendingChanges(n).upserts.map((u) => u.word.id)).toEqual([b.id]) // b is re-uploaded
    expect(pendingChanges(n).deletes).toEqual([])
  })

  it('keeps one copy when the same word was added on two devices', () => {
    const laptop = word('Tirade', 1, { notes: 'laptop' })
    const phone = word('tirade', 2, { timesWrong: 2 })
    const n = applyRemote(synced([laptop]), U, [row(phone, 3)], [])
    expect(n.words).toHaveLength(1)
    // The copy saved first keeps its id; the other id is deleted on the server.
    expect(n.words[0]).toMatchObject({ id: laptop.id, timesWrong: 2 })
    expect(pendingChanges(n).deletes).toEqual([phone.id])

    // The phone, pulling the laptop's copy, reaches the same answer.
    const onPhone = applyRemote(synced([phone]), U, [row(laptop, 3)], [])
    expect(onPhone.words.map((w) => w.id)).toEqual([laptop.id])
    expect(pendingChanges(onPhone).deletes).toEqual([phone.id])
  })

  it('adds quiz results from other devices once', () => {
    const q = { id: 'q9', data: { date: at(4), format: 'word', answers: [] }, updated_at: at(4) }
    let n = applyRemote(synced([]), U, [], [q])
    n = applyRemote(n, U, [], [q])
    expect(n.quizzes.map((x) => x.id)).toEqual(['q9'])
    expect(pendingChanges(n).quizzes).toEqual([])
  })

  it('starts afresh for a different account', () => {
    const n = applyRemote(synced([word('a')]), 'user-2', [], [])
    expect(n.sync?.userId).toBe('user-2')
    expect(pendingChanges(n).upserts).toHaveLength(1)
  })

  it('keeps sync state when restoring a backup, but never writes it into the file', () => {
    const n = synced([word('a')])
    const text = serializeBackup(n)
    expect(text).not.toContain('"sync"')
    const restored = parseBackup(text)
    if (!restored.ok) throw new Error('backup should parse')
    const replaced = reducer(n, { type: 'replace', notebook: { ...restored.notebook, words: [] } })
    expect(replaced.sync).toEqual(n.sync)
    expect(pendingChanges(replaced).deletes).toHaveLength(1) // "replace" deletes on the server too
  })

  it('remembers sync state across reloads', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
    const n = synced([word('a')])
    saveNotebook(n, storage)
    expect(loadNotebook(storage).sync).toEqual(n.sync)
  })
})
