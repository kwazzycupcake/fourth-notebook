import { createContext, useContext } from 'react'
import type { Notebook, QuizSession, Source, Word, WordInput } from '../lib/types'

export type NotebookApi = {
  notebook: Notebook
  words: Word[]
  /** Set when the last save failed (e.g. storage full or blocked). */
  saveError: string | null

  addWord: (input: WordInput) => Word
  updateWord: (id: string, changes: Partial<WordInput>) => void
  /** Deletes a word and returns a function that undoes the delete. */
  removeWord: (id: string) => () => void
  toggleFavourite: (id: string) => void
  recordQuiz: (session: Omit<QuizSession, 'id' | 'date'>) => void
  setLastSource: (source: Source | undefined) => void

  replaceNotebook: (notebook: Notebook) => void
  markBackedUp: () => void
}

export const NotebookContext = createContext<NotebookApi | null>(null)

export function useNotebook(): NotebookApi {
  const api = useContext(NotebookContext)
  if (!api) throw new Error('useNotebook must be used inside <NotebookProvider>')
  return api
}
