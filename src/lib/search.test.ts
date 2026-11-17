import { describe, expect, it } from 'vitest'
import { NO_FILTERS, filterWords, letterOf, sortWords } from './search'
import { createWord } from './words'

const tirade = createWord({
  word: 'tirade',
  meanings: ['a long angry speech'],
  partOfSpeech: 'noun',
  synonyms: ['rant'],
  source: { type: 'news', title: 'The Hindu' },
  savedAt: '2026-11-10T09:00:00Z',
})
const atone = createWord({
  word: 'Atone',
  meanings: ['to show you are sorry'],
  partOfSpeech: 'verb',
  source: { type: 'book', title: 'The Secret History', author: 'Donna Tartt' },
  favourite: true,
  savedAt: '2026-11-12T09:00:00Z',
})
const cafe = createWord({ word: 'café', meanings: ['a small restaurant'], savedAt: '2026-11-01T09:00:00Z' })
const all = [tirade, atone, cafe]
const words = (list: { word: string }[]) => list.map((w) => w.word)

describe('filterWords', () => {
  it('finds words by meaning, synonym, source or author', () => {
    expect(words(filterWords(all, { ...NO_FILTERS, query: 'angry' }))).toEqual(['tirade'])
    expect(words(filterWords(all, { ...NO_FILTERS, query: 'RANT' }))).toEqual(['tirade'])
    expect(words(filterWords(all, { ...NO_FILTERS, query: 'tartt' }))).toEqual(['Atone'])
  })

  it('needs every search term to match, and ignores accents', () => {
    expect(words(filterWords(all, { ...NO_FILTERS, query: 'show sorry' }))).toEqual(['Atone'])
    expect(words(filterWords(all, { ...NO_FILTERS, query: 'show angry' }))).toEqual([])
    expect(words(filterWords(all, { ...NO_FILTERS, query: 'cafe' }))).toEqual(['café'])
  })

  it('filters by source, part of speech and favourites', () => {
    expect(words(filterWords(all, { ...NO_FILTERS, sourceType: 'news' }))).toEqual(['tirade'])
    expect(words(filterWords(all, { ...NO_FILTERS, partOfSpeech: 'verb' }))).toEqual(['Atone'])
    expect(words(filterWords(all, { ...NO_FILTERS, favouritesOnly: true }))).toEqual(['Atone'])
  })
})

describe('sortWords', () => {
  it('sorts A–Z ignoring capitals', () => {
    expect(words(sortWords(all, 'az'))).toEqual(['Atone', 'café', 'tirade'])
  })

  it('sorts newest first', () => {
    expect(words(sortWords(all, 'newest'))).toEqual(['Atone', 'tirade', 'café'])
  })

  it('puts the most-missed words first', () => {
    const missed = [
      { ...tirade, timesWrong: 1, timesRight: 5 },
      { ...atone, timesWrong: 3, timesRight: 0 },
      { ...cafe, timesWrong: 1, timesRight: 0 },
    ]
    expect(words(sortWords(missed, 'missed'))).toEqual(['Atone', 'café', 'tirade'])
  })
})

describe('letterOf', () => {
  it('groups by first letter, folding accents and symbols', () => {
    expect(letterOf('éclat')).toBe('E')
    expect(letterOf('tirade')).toBe('T')
    expect(letterOf('24/7')).toBe('#')
  })
})
