import type { PartOfSpeech, Source, SourceType } from './types'

export const SOURCE_LABELS: Record<SourceType, string> = {
  book: 'Book',
  show: 'TV show',
  film: 'Film',
  news: 'News',
  conversation: 'Conversation',
  other: 'Other',
}

export const POS_SHORT: Record<PartOfSpeech, string> = {
  noun: 'n.',
  verb: 'v.',
  adjective: 'adj.',
  adverb: 'adv.',
  other: '',
}

/** "The Secret History · Donna Tartt", "a conversation", "TV show" */
export function describeSource(s: Source | undefined): string | undefined {
  if (!s) return undefined
  const named = [s.title, s.author].filter(Boolean).join(' · ')
  if (named) return named
  return s.type === 'conversation' ? 'a conversation' : SOURCE_LABELS[s.type]
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
