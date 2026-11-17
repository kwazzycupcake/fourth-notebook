import type { Word } from './types'

/** Source titles you've used before, most recent first, for autocomplete. */
export function usedTitles(words: Word[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const w of [...words].sort((a, b) => b.savedAt.localeCompare(a.savedAt))) {
    const t = w.source?.title
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase())
      out.push(t)
    }
  }
  return out
}
