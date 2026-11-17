/*
  Word suggestions while you type, from the Datamuse API (https://www.datamuse.com/api/).
  Free, no key. It also corrects spelling ("ubiqitous" → "ubiquitous").
  Only the letters you've typed are sent.
*/

const API = 'https://api.datamuse.com/sug'
const MAX = 6

/** Returns up to 6 suggested words. Any failure just means no suggestions. */
export async function suggestWords(text: string, fetchFn: typeof fetch = fetch, signal?: AbortSignal): Promise<string[]> {
  const q = text.trim()
  if (q.length < 2) return []
  try {
    const res = await fetchFn(`${API}?s=${encodeURIComponent(q.toLowerCase())}&max=${MAX + 2}`, { signal })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of data) {
      const word = typeof item?.word === 'string' ? item.word.trim() : ''
      const key = word.toLowerCase()
      if (!word || seen.has(key)) continue
      seen.add(key)
      out.push(word)
      if (out.length >= MAX) break
    }
    return out
  } catch {
    return []
  }
}
