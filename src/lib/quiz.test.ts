import { describe, expect, it } from 'vitest'
import { buildQuestion, buildQuiz, maskWord, pickWords, practiceWeight } from './quiz'
import type { Word } from './types'
import { createWord } from './words'

/** Predictable "random" numbers for repeatable tests. */
function seeded(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const make = (word: string, meaning: string, partOfSpeech?: Word['partOfSpeech']) =>
  createWord({ word, meanings: [meaning], partOfSpeech })

const library = [
  make('tirade', 'a long, angry speech', 'noun'),
  make('predicament', 'a difficult situation', 'noun'),
  make('discretion', 'freedom to decide', 'noun'),
  make('atone', 'to show you are sorry', 'verb'),
  make('forgo', 'to decide not to have something', 'verb'),
  make('vie', 'to compete eagerly', 'verb'),
  make('ubiquitous', 'seeming to be everywhere', 'adjective'),
]

describe('buildQuestion', () => {
  it('gives four different options including the right one', () => {
    const q = buildQuestion(library[0], library, 'meaning', seeded())
    expect(q.prompt).toBe('tirade')
    expect(q.options).toHaveLength(4)
    expect(new Set(q.options.map((o) => o.text)).size).toBe(4)
    expect(q.options.find((o) => o.id === q.answerId)?.text).toBe('a long, angry speech')
  })

  it('prefers wrong options with the same part of speech', () => {
    const q = buildQuestion(library[3], library, 'word', seeded(7)) // atone (verb)
    const others = q.options.filter((o) => o.id !== q.answerId).map((o) => o.text).sort()
    // The other two verbs are always included; the third option is any other word.
    expect(others).toHaveLength(3)
    expect(others).toEqual(expect.arrayContaining(['forgo', 'vie']))
  })

  it('works with fewer words than options', () => {
    const q = buildQuestion(library[0], library.slice(0, 3), 'meaning', seeded())
    expect(q.options).toHaveLength(3)
  })

  it('never offers the same text twice', () => {
    const twins = [...library, make('Tirade', 'a long, angry speech', 'noun')]
    const q = buildQuestion(twins[0], twins, 'meaning', seeded(3))
    expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length)
  })
})

describe('maskWord', () => {
  it('hides the word and its simple forms in a definition', () => {
    expect(maskWord('To make a long speech, a tirade.', 'tirade')).toBe('To make a long speech, a _____.')
    expect(maskWord('Prices plummeted and kept plummeting.', 'plummet')).toBe('Prices _____ and kept _____.')
  })

  it("leaves other words that merely start the same alone", () => {
    expect(maskWord('a different viewpoint', 'vie')).toBe('a different viewpoint')
  })
})

describe('picking words', () => {
  it('weights missed and never-quizzed words higher', () => {
    const now = Date.parse('2026-11-18T12:00:00Z')
    const fresh = library[0]
    const known = { ...library[1], timesRight: 5, lastQuizzedAt: '2026-11-18T10:00:00Z' }
    const missed = { ...library[2], timesWrong: 3, lastQuizzedAt: '2026-11-18T10:00:00Z' }
    expect(practiceWeight(missed, now)).toBeGreaterThan(practiceWeight(fresh, now))
    expect(practiceWeight(fresh, now)).toBeGreaterThan(practiceWeight(known, now))
  })

  it('picks distinct words, never more than you have', () => {
    const picked = pickWords(library, 10, seeded(5))
    expect(picked).toHaveLength(library.length)
    expect(new Set(picked.map((w) => w.id)).size).toBe(library.length)
  })

  it('builds a quiz from only the words you ask for', () => {
    const quiz = buildQuiz(library, 'meaning', 10, { rng: seeded(), only: [library[5], library[6]] })
    expect(quiz.map((q) => q.word.word).sort()).toEqual(['ubiquitous', 'vie'])
    expect(quiz[0].options).toHaveLength(4)
  })
})
