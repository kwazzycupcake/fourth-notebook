import type { PartOfSpeech, SourceType, Word } from './types'

export type SortOrder = 'az' | 'newest' | 'missed'

export type LibraryFilters = {
  query: string
  sourceType: SourceType | ''
  partOfSpeech: PartOfSpeech | ''
  favouritesOnly: boolean
}

export const NO_FILTERS: LibraryFilters = { query: '', sourceType: '', partOfSpeech: '', favouritesOnly: false }

export const hasFilters = (f: LibraryFilters) =>
  f.query.trim() !== '' || f.sourceType !== '' || f.partOfSpeech !== '' || f.favouritesOnly

/** Lower-case, accent-free text so "cafe" finds "café". */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()

const tokenize = (s: string) => fold(s).split(/[^\p{L}\p{N}']+/u).filter(Boolean)

/** Every word in everything you might search for (word, meanings, example, source, notes…). */
const searchableTokens = (w: Word) =>
  tokenize(
    [w.word, ...w.meanings, w.example, ...w.synonyms, ...w.antonyms, w.source?.title, w.source?.author, w.notes]
      .filter(Boolean)
      .join(' '),
  )

/**
 * Each search term must match the start of some word, so "rant" finds "rant"
 * but not "restaurant", and "plum" finds "plummet".
 */
export function filterWords(words: Word[], f: LibraryFilters): Word[] {
  const terms = tokenize(f.query)
  return words.filter((w) => {
    if (f.favouritesOnly && !w.favourite) return false
    if (f.sourceType && w.source?.type !== f.sourceType) return false
    if (f.partOfSpeech && w.partOfSpeech !== f.partOfSpeech) return false
    if (terms.length) {
      const tokens = searchableTokens(w)
      return terms.every((t) => tokens.some((tok) => tok.startsWith(t)))
    }
    return true
  })
}

const byWord = (a: Word, b: Word) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' })

export function sortWords(words: Word[], order: SortOrder): Word[] {
  const list = [...words]
  switch (order) {
    case 'az':
      return list.sort(byWord)
    case 'newest':
      return list.sort((a, b) => b.savedAt.localeCompare(a.savedAt) || byWord(a, b))
    case 'missed':
      // Most wrong answers first; ties go to the lower success rate.
      return list.sort((a, b) => {
        if (b.timesWrong !== a.timesWrong) return b.timesWrong - a.timesWrong
        const rate = (w: Word) => w.timesRight / Math.max(1, w.timesRight + w.timesWrong)
        return rate(a) - rate(b) || byWord(a, b)
      })
  }
}

/** The letter heading a word sits under in A–Z order ("#" for numbers and symbols). */
export function letterOf(word: string): string {
  const first = fold(word.trim()).charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

/** Every heading the index can show, in order. */
export const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']

/** Splits an A–Z sorted list into letter groups, keeping the order. */
export function groupByLetter(sorted: Word[]): { letter: string; words: Word[] }[] {
  const groups: { letter: string; words: Word[] }[] = []
  for (const w of sorted) {
    const letter = letterOf(w.word)
    const last = groups[groups.length - 1]
    if (last && last.letter === letter) last.words.push(w)
    else groups.push({ letter, words: [w] })
  }
  // "#" (numbers, symbols) sorts first alphabetically; show it last, like a dictionary.
  return [...groups.filter((g) => g.letter !== '#'), ...groups.filter((g) => g.letter === '#')]
}
