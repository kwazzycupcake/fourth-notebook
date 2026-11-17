import { describe, expect, it } from 'vitest'
import { lookupWord, parseEntries } from './dictionary'

// Trimmed copy of the real API response for "tirade".
const tirade = [
  {
    word: 'tirade',
    phonetic: '/ˈtaɪɹeɪd/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          { definition: 'A long, angry or violent speech; a diatribe.', synonyms: [], antonyms: [] },
          { definition: 'A section of verse concerning a single theme; a laisse.', synonyms: [], antonyms: [] },
        ],
        synonyms: ['laisse', 'diatribe', 'rant'],
        antonyms: [],
      },
      {
        partOfSpeech: 'verb',
        definitions: [{ definition: 'To make a long, angry or violent speech, a tirade.' }],
      },
    ],
  },
]

const respond = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('parseEntries', () => {
  it('lists every definition with its part of speech, first one first', () => {
    const r = parseEntries(tirade, 'tirade')!
    expect(r.phonetic).toBe('/ˈtaɪɹeɪd/')
    expect(r.options.map((o) => o.partOfSpeech)).toEqual(['noun', 'noun', 'verb'])
    expect(r.options[0].definition).toBe('A long, angry or violent speech; a diatribe.')
    expect(r.synonyms).toEqual(['laisse', 'diatribe', 'rant'])
  })

  it('maps unusual parts of speech to "other" and drops the word itself from synonyms', () => {
    const r = parseEntries(
      [{ meanings: [{ partOfSpeech: 'interjection', definitions: [{ definition: 'hi', synonyms: ['Hello', 'hello', 'hey'] }] }] }],
      'hello',
    )!
    expect(r.options[0].partOfSpeech).toBe('other')
    expect(r.synonyms).toEqual(['hey'])
  })

  it('returns null when there are no definitions', () => {
    expect(parseEntries([{ word: 'x', meanings: [] }], 'x')).toBeNull()
  })
})

describe('lookupWord', () => {
  it('returns the parsed result', async () => {
    const out = await lookupWord('Tirade', respond(200, tirade))
    expect(out.ok && out.result.options.length).toBe(3)
  })

  it('reports not-found on 404', async () => {
    expect(await lookupWord('qwzxv', respond(404, { title: 'No Definitions Found' }))).toEqual({
      ok: false,
      reason: 'not-found',
    })
  })

  it('reports an error when the request fails', async () => {
    const failing = (async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch
    const out = await lookupWord('tirade', failing)
    expect(out.ok).toBe(false)
  })
})
