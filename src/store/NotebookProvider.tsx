import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { STORAGE_KEY } from '../config'
import { loadNotebook, saveNotebook } from '../lib/storage'
import { createWord, newId } from '../lib/words'
import { NotebookContext, type NotebookApi } from './context'
import { reducer } from './reducer'

const now = () => new Date().toISOString()

export default function NotebookProvider({ children }: { children: ReactNode }) {
  const [notebook, dispatch] = useReducer(reducer, undefined, () => loadNotebook())
  const [saveError, setSaveError] = useState<string | null>(null)

  // Save after every change. Skip the very first render (nothing changed yet).
  const loaded = useRef(notebook)
  useEffect(() => {
    if (notebook === loaded.current) return
    const result = saveNotebook(notebook)
    setSaveError(result.ok ? null : result.error)
  }, [notebook])

  // If the app is open in two tabs, keep them in step.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const fresh = loadNotebook()
      loaded.current = fresh
      dispatch({ type: 'replace', notebook: fresh })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Keep a ref so removeWord's undo can find the word's original position.
  const latest = useRef(notebook)
  useEffect(() => {
    latest.current = notebook
  }, [notebook])

  const api = useMemo<NotebookApi>(
    () => ({
      notebook,
      words: notebook.words,
      saveError,

      addWord: (input) => {
        const word = createWord(input)
        dispatch({ type: 'add', word })
        return word
      },
      updateWord: (id, changes) => dispatch({ type: 'update', id, changes, at: now() }),
      removeWord: (id) => {
        const index = latest.current.words.findIndex((w) => w.id === id)
        const word = latest.current.words[index]
        dispatch({ type: 'remove', id })
        return () => {
          if (word) dispatch({ type: 'restoreWord', word, index })
        }
      },
      toggleFavourite: (id) => dispatch({ type: 'toggleFavourite', id, at: now() }),
      recordQuiz: (session) => dispatch({ type: 'recordQuiz', session: { ...session, id: newId(), date: now() } }),
      setLastSource: (source) => dispatch({ type: 'setLastSource', source }),

      replaceNotebook: (next) => dispatch({ type: 'replace', notebook: next }),
      markBackedUp: () => dispatch({ type: 'markBackedUp', at: now() }),
    }),
    [notebook, saveError],
  )

  return <NotebookContext.Provider value={api}>{children}</NotebookContext.Provider>
}
