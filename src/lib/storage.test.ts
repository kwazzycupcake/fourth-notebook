import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../config'
import {
  emptyNotebook,
  loadNotebook,
  mergeNotebooks,
  parseBackup,
  saveNotebook,
  serializeBackup,
} from './storage'
import type { Notebook } from './types'
import { createWord, normalizeWord } from './words'

/** A stand-in for the browser's localStorage. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  }
}

const notebookWith = (...words: Parameters<typeof createWord>[0][]): Notebook => ({
  ...emptyNotebook(),
  words: words.map((w) => createWord(w)),
})

describe('createWord', () => {
  it('trims text and drops empty meanings', () => {
    const w = createWord({ word: '  tirade ', meanings: [' a long angry speech ', '  '], example: '  ' })
    expect(w.word).toBe('tirade')
    expect(w.meanings).toEqual(['a long angry speech'])
    expect(w.example).toBeUndefined()
    expect(w.box).toBe(1)
    expect(w.timesRight).toBe(0)
  })
})

describe('normalizeWord', () => {
  it('rejects entries with no word or no meaning', () => {
    expect(normalizeWord({ word: 'vie' })).toBeNull()
    expect(normalizeWord({ meanings: ['to compete'] })).toBeNull()
    expect(normalizeWord('nonsense')).toBeNull()
  })

  it('accepts an older single "meaning" field and fills defaults', () => {
    const w = normalizeWord({ word: 'stifle', meaning: 'to stop something continuing', box: 9, timesRight: -3 })
    expect(w?.meanings).toEqual(['to stop something continuing'])
    expect(w?.box).toBe(1)
    expect(w?.timesRight).toBe(0)
    expect(w?.synonyms).toEqual([])
    expect(w?.id).toBeTruthy()
  })
})

describe('save and load', () => {
  it('round-trips a notebook through storage', () => {
    const storage = fakeStorage()
    const nb = notebookWith({ word: 'atone', meanings: ['to show you are sorry'] })
    expect(saveNotebook(nb, storage)).toEqual({ ok: true })
    expect(loadNotebook(storage)).toEqual(nb)
  })

  it('returns an empty notebook when storage is empty or corrupted', () => {
    expect(loadNotebook(fakeStorage())).toEqual(emptyNotebook())
    expect(loadNotebook(fakeStorage({ [STORAGE_KEY]: '{not json' }))).toEqual(emptyNotebook())
  })

  it('reports a friendly error when storage is full', () => {
    const full = {
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    const result = saveNotebook(emptyNotebook(), full)
    expect(result.ok).toBe(false)
  })
})

describe('backup files', () => {
  it('parses a backup it wrote', () => {
    const nb = notebookWith({ word: 'forgo', meanings: ['to decide not to have'] })
    const parsed = parseBackup(serializeBackup(nb))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.notebook.words).toEqual(nb.words)
      expect(parsed.exportedAt).toBeTruthy()
      expect(parsed.skipped).toBe(0)
    }
  })

  it('explains what went wrong with a bad file', () => {
    expect(parseBackup('hello').ok).toBe(false)
    expect(parseBackup('{"something": "else"}').ok).toBe(false)
  })

  it('skips broken entries but keeps the rest', () => {
    const parsed = parseBackup(JSON.stringify({ words: [{ word: 'vie', meanings: ['to compete'] }, { word: 'x' }] }))
    expect(parsed.ok && parsed.notebook.words.length).toBe(1)
    expect(parsed.ok && parsed.skipped).toBe(1)
  })
})

describe('mergeNotebooks', () => {
  it('keeps words from both and the newer copy of a shared word', () => {
    const phone = notebookWith({ word: 'Tirade', meanings: ['old meaning'] }, { word: 'atone', meanings: ['sorry'] })
    const laptop = notebookWith({ word: 'tirade', meanings: ['new meaning'] }, { word: 'vie', meanings: ['compete'] })
    phone.words[0].updatedAt = '2026-11-01T00:00:00.000Z'
    laptop.words[0].updatedAt = '2026-11-10T00:00:00.000Z'

    const merged = mergeNotebooks(phone, laptop)
    expect(merged.words.map((w) => w.word).sort()).toEqual(['atone', 'tirade', 'vie'])
    expect(merged.words.find((w) => w.word.toLowerCase() === 'tirade')?.meanings).toEqual(['new meaning'])
  })
})
