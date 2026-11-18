import { describe, expect, it } from 'vitest'
import { emptyForm, formFromLookup, formFromWord, formToInput, splitList, validateForm } from './wordForm'
import { createWord } from './words'

describe('wordForm', () => {
  it('splits synonym lists on commas, semicolons and new lines', () => {
    expect(splitList(' rant, diatribe;outburst\n\n , ')).toEqual(['rant', 'diatribe', 'outburst'])
  })

  it('pre-fills the last source you used', () => {
    const v = emptyForm('vie', { type: 'book', title: 'Wolf Hall', author: 'Hilary Mantel' })
    expect(v).toMatchObject({ word: 'vie', sourceType: 'book', sourceTitle: 'Wolf Hall' })
  })

  it('keeps the author only for books', () => {
    const v = { ...emptyForm('vie'), meanings: ['to compete'], sourceType: 'show' as const, sourceTitle: 'Succession', sourceAuthor: 'x' }
    expect(formToInput(v).source).toEqual({ type: 'show', title: 'Succession', author: undefined })
  })

  it('keeps a title typed without choosing a source type', () => {
    const v = { ...emptyForm('vie'), meanings: ['to compete'], sourceTitle: ' Succession ' }
    expect(formToInput(v).source).toEqual({ type: 'other', title: 'Succession', author: undefined })
    expect(formToInput({ ...v, sourceTitle: '' }).source).toBeUndefined()
  })

  it('drops blank meanings and requires word + meaning', () => {
    const v = { ...emptyForm(' '), meanings: ['  ', ''] }
    expect(validateForm(v)).toEqual({ word: expect.any(String), meaning: expect.any(String) })
    expect(formToInput({ ...v, word: 'vie', meanings: ['', 'to compete'] }).meanings).toEqual(['to compete'])
  })

  it('fills from a lookup, keeping the chosen source', () => {
    const base = emptyForm('tirade', { type: 'news' })
    const v = formFromLookup(
      { word: 'tirade', phonetic: '/ˈtaɪɹeɪd/', options: [{ partOfSpeech: 'noun', definition: 'A long angry speech.' }], synonyms: ['rant'], antonyms: [] },
      base,
    )
    expect(v).toMatchObject({ meanings: ['A long angry speech.'], partOfSpeech: 'noun', synonyms: 'rant', sourceType: 'news' })
  })

  it('suggests the everyday sense (the one with an example) and its own example', () => {
    const v = formFromLookup(
      {
        word: 'plummet',
        options: [
          { partOfSpeech: 'noun', definition: 'A plumb bob.' },
          { partOfSpeech: 'verb', definition: 'To fall rapidly.', example: 'The arrow plummeted to earth.' },
        ],
        synonyms: [],
        antonyms: [],
      },
      emptyForm('plummet'),
    )
    expect(v).toMatchObject({ meanings: ['To fall rapidly.'], partOfSpeech: 'verb', example: 'The arrow plummeted to earth.' })
  })

  it('round-trips a saved word through the form', () => {
    const w = createWord({ word: 'atone', meanings: ['to show you are sorry'], synonyms: ['repent'], source: { type: 'book', title: 'X', author: 'Y' } })
    expect(formToInput(formFromWord(w))).toMatchObject({ word: 'atone', synonyms: ['repent'], source: { type: 'book', title: 'X', author: 'Y' } })
  })
})
