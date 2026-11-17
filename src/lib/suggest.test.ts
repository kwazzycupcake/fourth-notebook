import { describe, expect, it } from 'vitest'
import { suggestWords } from './suggest'

const respond = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('suggestWords', () => {
  it('returns the suggested words in order, without duplicates', async () => {
    const out = await suggestWords(
      'plumm',
      respond([{ word: 'plummet' }, { word: 'Plummet' }, { word: 'plummy' }, { word: '' }, { score: 3 }]),
    )
    expect(out).toEqual(['plummet', 'plummy'])
  })

  it('waits for at least two letters', async () => {
    let called = false
    const spy = (async () => {
      called = true
      return new Response('[]')
    }) as unknown as typeof fetch
    expect(await suggestWords('p', spy)).toEqual([])
    expect(called).toBe(false)
  })

  it('returns nothing when the service fails', async () => {
    expect(await suggestWords('plumm', respond({ error: 'x' }, 500))).toEqual([])
    const failing = (async () => {
      throw new TypeError('offline')
    }) as unknown as typeof fetch
    expect(await suggestWords('plumm', failing)).toEqual([])
  })
})
