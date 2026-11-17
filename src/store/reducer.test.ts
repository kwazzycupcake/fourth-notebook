import { describe, expect, it } from 'vitest'
import { emptyNotebook } from '../lib/storage'
import { createWord } from '../lib/words'
import { reducer } from './reducer'

const start = () => {
  const a = createWord({ word: 'tirade', meanings: ['a long angry speech'] })
  const b = createWord({ word: 'atone', meanings: ['to show you are sorry'] })
  const c = createWord({ word: 'vie', meanings: ['to compete'] })
  return { a, b, c, nb: { ...emptyNotebook(), words: [a, b, c] } }
}

describe('reducer', () => {
  it('updates a word and its edit time', () => {
    const { a, nb } = start()
    const next = reducer(nb, { type: 'update', id: a.id, changes: { example: 'What a tirade.' }, at: '2026-11-18T10:00:00Z' })
    expect(next.words[0].example).toBe('What a tirade.')
    expect(next.words[0].updatedAt).toBe('2026-11-18T10:00:00Z')
    expect(nb.words[0].example).toBeUndefined() // original untouched
  })

  it('undoes a delete back into the same position', () => {
    const { b, nb } = start()
    const removed = reducer(nb, { type: 'remove', id: b.id })
    expect(removed.words.map((w) => w.word)).toEqual(['tirade', 'vie'])
    const restored = reducer(removed, { type: 'restoreWord', word: b, index: 1 })
    expect(restored.words.map((w) => w.word)).toEqual(['tirade', 'atone', 'vie'])
  })

  it('toggles favourite', () => {
    const { c, nb } = start()
    const next = reducer(nb, { type: 'toggleFavourite', id: c.id, at: '2026-11-18T10:00:00Z' })
    expect(next.words[2].favourite).toBe(true)
  })

  it('records quiz results on each word', () => {
    const { a, b, nb } = start()
    const next = reducer(nb, {
      type: 'recordQuiz',
      session: {
        id: 'q1',
        date: '2026-11-18T19:00:00Z',
        format: 'meaning',
        answers: [
          { wordId: a.id, correct: true },
          { wordId: b.id, correct: false },
          { wordId: a.id, correct: true },
        ],
      },
    })
    expect(next.quizzes).toHaveLength(1)
    expect(next.words[0]).toMatchObject({ timesRight: 2, timesWrong: 0, lastQuizzedAt: '2026-11-18T19:00:00Z' })
    expect(next.words[1]).toMatchObject({ timesRight: 0, timesWrong: 1 })
    expect(next.words[2].lastQuizzedAt).toBeUndefined()
  })
})
