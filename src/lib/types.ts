// The shape of everything the app saves.

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other'
export const PARTS_OF_SPEECH: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'adverb', 'other']

export type SourceType = 'book' | 'show' | 'film' | 'news' | 'conversation' | 'other'
export const SOURCE_TYPES: SourceType[] = ['book', 'show', 'film', 'news', 'conversation', 'other']

export type Source = {
  type: SourceType
  title?: string
  author?: string
}

/** Review box for spaced repetition (used from Phase 2). 5 = mastered. */
export type Box = 1 | 2 | 3 | 4 | 5

export type Word = {
  id: string
  word: string
  /** First item is the main meaning. Some words (like "discretion") have more. */
  meanings: string[]
  partOfSpeech?: PartOfSpeech
  /** Pronunciation, e.g. /ˈtaɪɹeɪd/ */
  phonetic?: string
  example?: string
  synonyms: string[]
  antonyms: string[]
  source?: Source
  notes?: string
  favourite: boolean
  /** When you found the word. */
  savedAt: string
  updatedAt: string
  timesRight: number
  timesWrong: number
  lastQuizzedAt?: string
  box: Box
  dueAt: string
}

/** What you type when adding a word. Everything except word + meanings is optional. */
export type WordInput = Pick<Word, 'word' | 'meanings'> &
  Partial<
    Pick<Word, 'partOfSpeech' | 'phonetic' | 'example' | 'synonyms' | 'antonyms' | 'source' | 'notes' | 'favourite' | 'savedAt'>
  >

export type QuizFormat = 'meaning' | 'word'

export type QuizSession = {
  id: string
  date: string
  format: QuizFormat
  answers: { wordId: string; correct: boolean }[]
}

export type Settings = {
  /** Pre-fills the source on the next word you add. */
  lastSource?: Source
}

export type Notebook = {
  version: 1
  words: Word[]
  quizzes: QuizSession[]
  settings: Settings
  lastBackupAt?: string
}
