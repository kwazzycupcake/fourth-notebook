import { describe, expect, it } from 'vitest'
import { emptyNotebook } from './storage'
import { computeStats, dayKey, wordOfTheDay } from './stats'
import { createWord } from './words'

const words = ['tirade', 'atone', 'forgo', 'vie', 'stifle'].map((w) => createWord({ word: w, meanings: ['m'] }))

describe('computeStats', () => {
  it('counts words, favourites, revised words and accuracy', () => {
    const nb = {
      ...emptyNotebook(),
      words: [
        { ...words[0], timesRight: 3, timesWrong: 1, favourite: true },
        { ...words[1], timesWrong: 1 },
        words[2],
      ],
    }
    expect(computeStats(nb)).toEqual({ total: 3, favourites: 1, revised: 2, accuracy: 60, quizzes: 0 })
  })

  it('has no accuracy before any quiz', () => {
    expect(computeStats({ ...emptyNotebook(), words }).accuracy).toBeNull()
  })
})

describe('wordOfTheDay', () => {
  it('is the same all day, whatever order the words are in', () => {
    const a = wordOfTheDay(words, '2026-11-18')
    expect(wordOfTheDay([...words].reverse(), '2026-11-18')).toBe(a)
  })

  it('changes across days', () => {
    const picks = new Set(['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'].map((d) => wordOfTheDay(words, d)?.word))
    expect(picks.size).toBeGreaterThan(1)
  })

  it('handles an empty notebook', () => {
    expect(wordOfTheDay([])).toBeUndefined()
  })

  it('formats the local day', () => {
    expect(dayKey(new Date(2026, 10, 8))).toBe('2026-11-08')
  })
})
