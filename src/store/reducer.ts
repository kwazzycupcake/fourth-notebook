/*
  Every change to the notebook goes through here.
  Timestamps come in with the action so this stays predictable and easy to test.
*/
import { applyRemote, markPushed, type PendingChanges, type RemoteQuiz, type RemoteWord } from '../lib/sync'
import type { Notebook, QuizSession, Source, Word, WordInput } from '../lib/types'

export type Action =
  | { type: 'add'; word: Word }
  | { type: 'update'; id: string; changes: Partial<WordInput>; at: string }
  | { type: 'remove'; id: string }
  | { type: 'restoreWord'; word: Word; index: number }
  | { type: 'toggleFavourite'; id: string; at: string }
  | { type: 'recordQuiz'; session: QuizSession }
  /** Swap in different contents (e.g. a restored backup), keeping this device's sync state. */
  | { type: 'replace'; notebook: Notebook }
  /** Load exactly this, sync state included (another tab changed it, or you signed out). */
  | { type: 'load'; notebook: Notebook }
  | { type: 'applyRemote'; userId: string; words: RemoteWord[]; quizzes: RemoteQuiz[] }
  | { type: 'markPushed'; userId: string; pushed: PendingChanges }
  | { type: 'markBackedUp'; at: string }
  | { type: 'setLastSource'; source: Source | undefined }

const mapWord = (n: Notebook, id: string, fn: (w: Word) => Word): Notebook => ({
  ...n,
  words: n.words.map((w) => (w.id === id ? fn(w) : w)),
})

export function reducer(n: Notebook, action: Action): Notebook {
  switch (action.type) {
    case 'add':
      return { ...n, words: [...n.words, action.word] }

    case 'update':
      return mapWord(n, action.id, (w) => ({ ...w, ...action.changes, updatedAt: action.at }))

    case 'remove':
      return { ...n, words: n.words.filter((w) => w.id !== action.id) }

    case 'restoreWord': {
      // Undo a delete, putting the word back where it was.
      if (n.words.some((w) => w.id === action.word.id)) return n
      const words = [...n.words]
      words.splice(Math.min(action.index, words.length), 0, action.word)
      return { ...n, words }
    }

    case 'toggleFavourite':
      return mapWord(n, action.id, (w) => ({ ...w, favourite: !w.favourite, updatedAt: action.at }))

    case 'recordQuiz': {
      const { session } = action
      const results = new Map<string, { right: number; wrong: number }>()
      for (const a of session.answers) {
        const r = results.get(a.wordId) ?? { right: 0, wrong: 0 }
        if (a.correct) r.right++
        else r.wrong++
        results.set(a.wordId, r)
      }
      return {
        ...n,
        quizzes: [...n.quizzes, session],
        words: n.words.map((w) => {
          const r = results.get(w.id)
          if (!r) return w
          return {
            ...w,
            timesRight: w.timesRight + r.right,
            timesWrong: w.timesWrong + r.wrong,
            lastQuizzedAt: session.date,
          }
        }),
      }
    }

    case 'replace': {
      const { sync: _ignored, ...contents } = action.notebook
      return n.sync ? { ...contents, sync: n.sync } : contents
    }

    case 'load':
      return action.notebook

    case 'applyRemote':
      return applyRemote(n, action.userId, action.words, action.quizzes)

    case 'markPushed':
      return markPushed(n, action.userId, action.pushed)

    case 'markBackedUp':
      return { ...n, lastBackupAt: action.at }

    case 'setLastSource':
      return { ...n, settings: { ...n.settings, lastSource: action.source } }
  }
}
