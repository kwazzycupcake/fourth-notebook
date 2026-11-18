/*
  Converts between what the form shows (plain strings) and a saved Word.
*/
import type { LookupResult } from './dictionary'
import type { PartOfSpeech, Source, SourceType, Word, WordInput } from './types'

export type FormValues = {
  word: string
  meanings: string[]
  partOfSpeech: PartOfSpeech | ''
  phonetic: string
  example: string
  synonyms: string
  antonyms: string
  sourceType: SourceType | ''
  sourceTitle: string
  sourceAuthor: string
  notes: string
}

export function emptyForm(word = '', lastSource?: Source): FormValues {
  return {
    word,
    meanings: [''],
    partOfSpeech: '',
    phonetic: '',
    example: '',
    synonyms: '',
    antonyms: '',
    sourceType: lastSource?.type ?? '',
    sourceTitle: lastSource?.title ?? '',
    sourceAuthor: lastSource?.author ?? '',
    notes: '',
  }
}

export function formFromWord(w: Word): FormValues {
  return {
    word: w.word,
    meanings: w.meanings.length ? [...w.meanings] : [''],
    partOfSpeech: w.partOfSpeech ?? '',
    phonetic: w.phonetic ?? '',
    example: w.example ?? '',
    synonyms: w.synonyms.join(', '),
    antonyms: w.antonyms.join(', '),
    sourceType: w.source?.type ?? '',
    sourceTitle: w.source?.title ?? '',
    sourceAuthor: w.source?.author ?? '',
    notes: w.notes ?? '',
  }
}

/**
 * Picks the definition to suggest. The dictionary sometimes lists a rare sense first
 * (e.g. "plummet" as a plumb line), and the everyday sense is usually the one with an
 * example sentence, so prefer the first definition that has one.
 */
export function suggestedOption(result: LookupResult) {
  return result.options.find((o) => o.example) ?? result.options[0]
}

/** Fills the form from a dictionary result, keeping the source you already chose. */
export function formFromLookup(result: LookupResult, base: FormValues): FormValues {
  const pick = suggestedOption(result)
  return {
    ...base,
    word: base.word.trim() || result.word,
    meanings: [pick?.definition ?? ''],
    partOfSpeech: pick?.partOfSpeech ?? '',
    phonetic: result.phonetic ?? '',
    // Only use the example that belongs to the chosen definition.
    example: pick?.example ?? '',
    synonyms: result.synonyms.join(', '),
    antonyms: result.antonyms.join(', '),
  }
}

/** "rant, diatribe; outburst" → ["rant", "diatribe", "outburst"] */
export function splitList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formToInput(v: FormValues): WordInput {
  const title = v.sourceTitle.trim() || undefined
  // A title typed without picking a chip still counts, filed under "Other".
  const type = v.sourceType || (title ? 'other' : undefined)
  const source: Source | undefined = type
    ? {
        type,
        title,
        // The form no longer asks for an author, but keeps one saved on older words.
        author: type === 'book' ? v.sourceAuthor.trim() || undefined : undefined,
      }
    : undefined
  return {
    word: v.word.trim(),
    meanings: v.meanings.map((m) => m.trim()).filter(Boolean),
    partOfSpeech: v.partOfSpeech || undefined,
    phonetic: v.phonetic.trim() || undefined,
    example: v.example.trim() || undefined,
    synonyms: splitList(v.synonyms),
    antonyms: splitList(v.antonyms),
    source,
    notes: v.notes.trim() || undefined,
  }
}

/** Returns a message for each missing required field. */
export function validateForm(v: FormValues): { word?: string; meaning?: string } {
  const errors: { word?: string; meaning?: string } = {}
  if (!v.word.trim()) errors.word = 'Type the word.'
  if (!v.meanings.some((m) => m.trim())) errors.meaning = 'Add a meaning, in your own words or from the dictionary.'
  return errors
}
