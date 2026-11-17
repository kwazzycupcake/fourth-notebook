import type { Notebook, Word } from './types'

export type Stats = {
  total: number
  favourites: number
  /** Words you've been quizzed on at least once. */
  revised: number
  /** Share of quiz answers you got right, 0–100, or null if you haven't taken a quiz. */
  accuracy: number | null
  quizzes: number
}

export function computeStats(n: Notebook): Stats {
  let right = 0
  let wrong = 0
  let revised = 0
  let favourites = 0
  for (const w of n.words) {
    right += w.timesRight
    wrong += w.timesWrong
    if (w.timesRight + w.timesWrong > 0) revised++
    if (w.favourite) favourites++
  }
  return {
    total: n.words.length,
    favourites,
    revised,
    accuracy: right + wrong > 0 ? Math.round((right / (right + wrong)) * 100) : null,
    quizzes: n.quizzes.length,
  }
}

/** Local calendar day, e.g. "2026-11-18". */
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Small, stable hash of a string (same input, same number). */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Today's word: one word from your notebook that stays the same all day
 * and changes tomorrow. Adding words can change it, which is fine.
 */
export function wordOfTheDay(words: Word[], day = dayKey()): Word | undefined {
  if (words.length === 0) return undefined
  const sorted = [...words].sort((a, b) => a.id.localeCompare(b.id))
  return sorted[hash(day) % sorted.length]
}
