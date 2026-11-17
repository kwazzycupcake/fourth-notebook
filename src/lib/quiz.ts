/*
  Quiz logic, kept apart from the screen so it can be tested.
  `rng` is a random-number function (Math.random by default) so tests can
  pass a predictable one.
*/
import type { QuizFormat, Word } from './types'
import { wordKey } from './words'

export const MIN_WORDS = 4
const OPTIONS = 4

export type Question = {
  word: Word
  format: QuizFormat
  /** For "meaning": the word. For "word": its meaning, with the word itself blanked out. */
  prompt: string
  options: { id: string; text: string }[]
  /** id of the correct option (the target word's id) */
  answerId: string
}

type Rng = () => number

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DAY = 24 * 60 * 60 * 1000

/**
 * How much a word needs practice. Words you get wrong, have never been
 * quizzed on, or haven't seen in a while come up more often.
 */
export function practiceWeight(w: Word, now = Date.now()): number {
  let weight = 1
  weight += w.timesWrong * 2
  weight -= Math.min(w.timesRight, 5) * 0.15
  if (!w.lastQuizzedAt) weight += 2
  else weight += Math.min((now - Date.parse(w.lastQuizzedAt)) / DAY, 14) * 0.1
  return Math.max(weight, 0.2)
}

/** Picks `count` different words, favouring the ones that need practice. */
export function pickWords(words: Word[], count: number, rng: Rng = Math.random, now = Date.now()): Word[] {
  const pool = words.map((w) => ({ w, weight: practiceWeight(w, now) }))
  const picked: Word[] = []
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let r = rng() * total
    let i = 0
    while (i < pool.length - 1 && r >= pool[i].weight) {
      r -= pool[i].weight
      i++
    }
    picked.push(pool[i].w)
    pool.splice(i, 1)
  }
  return picked
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Blanks out the word (and simple forms like -s, -ed, -ing) so a definition doesn't give it away. */
export function maskWord(text: string, word: string): string {
  const w = word.trim()
  if (!w) return text
  const stem = w.length > 4 && /e$/i.test(w) ? w.slice(0, -1) : w
  // Allow a short ending (plummet → plummeted, plummeting), not whole other words.
  const re = new RegExp(`\\b${escape(stem)}\\w{0,3}\\b`, 'gi')
  return text.replace(re, '_____')
}

/** The text shown for a word as an option, or as the thing to identify. */
const meaningOf = (w: Word) => w.meanings[0] ?? ''

/**
 * Builds one question. Wrong options come from your own words,
 * preferring the same part of speech so they're harder to rule out.
 */
export function buildQuestion(target: Word, library: Word[], format: QuizFormat, rng: Rng = Math.random): Question {
  const shown = (w: Word) => (format === 'meaning' ? meaningOf(w) : w.word)
  const seen = new Set([wordKey(shown(target))])
  const candidates = shuffle(
    library.filter((w) => w.id !== target.id && wordKey(w.word) !== wordKey(target.word)),
    rng,
  )
  // Same part of speech first, then everything else.
  candidates.sort((a, b) => {
    const same = (w: Word) => (target.partOfSpeech && w.partOfSpeech === target.partOfSpeech ? 0 : 1)
    return same(a) - same(b)
  })

  const distractors: Word[] = []
  for (const c of candidates) {
    const key = wordKey(shown(c))
    if (!key || seen.has(key)) continue
    seen.add(key)
    distractors.push(c)
    if (distractors.length === OPTIONS - 1) break
  }

  const options = shuffle([target, ...distractors], rng).map((w) => ({ id: w.id, text: shown(w) }))
  return {
    word: target,
    format,
    prompt: format === 'meaning' ? target.word : maskWord(meaningOf(target), target.word),
    options,
    answerId: target.id,
  }
}

/** A whole quiz: picks the words, then builds a question for each. */
export function buildQuiz(
  library: Word[],
  format: QuizFormat,
  count: number,
  opts: { rng?: Rng; only?: Word[] } = {},
): Question[] {
  const rng = opts.rng ?? Math.random
  const targets = opts.only ? shuffle(opts.only, rng) : pickWords(library, count, rng)
  return targets.map((w) => buildQuestion(w, library, format, rng))
}
