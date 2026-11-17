import { useState, type FormEvent } from 'react'
import type { DefinitionOption } from '../lib/dictionary'
import type { PartOfSpeech, SourceType } from '../lib/types'
import { validateForm, type FormValues } from '../lib/wordForm'
import Chips from './Chips'
import { btn, field, label } from './ui'

const POS_OPTIONS: { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'noun' },
  { value: 'verb', label: 'verb' },
  { value: 'adjective', label: 'adjective' },
  { value: 'adverb', label: 'adverb' },
  { value: 'other', label: 'other' },
]

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'show', label: 'TV show' },
  { value: 'film', label: 'Film' },
  { value: 'news', label: 'News' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'other', label: 'Other' },
]

const TITLE_PLACEHOLDER: Record<SourceType, string> = {
  book: 'Book title',
  show: 'Show name',
  film: 'Film title',
  news: 'Newspaper, channel or site',
  conversation: 'Who with? (optional)',
  other: 'Where? (optional)',
}

export default function WordForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
  definitionOptions = [],
  titleSuggestions = [],
}: {
  values: FormValues
  onChange: (values: FormValues) => void
  onSubmit: () => void
  submitLabel: string
  onCancel?: () => void
  /** Dictionary definitions you can swap in. */
  definitionOptions?: DefinitionOption[]
  /** Book/show titles you've used before. */
  titleSuggestions?: string[]
}) {
  const [errors, setErrors] = useState<ReturnType<typeof validateForm>>({})
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => onChange({ ...values, [key]: value })
  const setMeaning = (i: number, text: string) =>
    set('meanings', values.meanings.map((m, j) => (j === i ? text : m)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateForm(values)
    setErrors(found)
    if (found.word || found.meaning) {
      document.getElementById(found.word ? 'word' : 'meaning-0')?.focus()
      return
    }
    onSubmit()
  }

  const chooseDefinition = (o: DefinitionOption) =>
    onChange({
      ...values,
      meanings: [o.definition, ...values.meanings.slice(1)],
      partOfSpeech: o.partOfSpeech ?? values.partOfSpeech,
      // Swap the example too, unless you wrote your own.
      example: exampleIsFromDictionary ? (o.example ?? '') : values.example,
    })

  const exampleIsFromDictionary = !values.example.trim() || definitionOptions.some((d) => d.example === values.example)

  const otherDefinitions = definitionOptions.filter((o) => o.definition !== values.meanings[0])

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {/* Word */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="word" className={label}>
          Word
        </label>
        <input
          id="word"
          className={`${field} font-display text-2xl font-semibold text-green`}
          value={values.word}
          onChange={(e) => set('word', e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!errors.word}
          aria-describedby={errors.word ? 'word-error' : undefined}
        />
        {values.phonetic && <span className="text-muted">{values.phonetic}</span>}
        {errors.word && (
          <span id="word-error" className="text-[15px] text-green">
            {errors.word}
          </span>
        )}
      </div>

      {/* Meanings */}
      <div className="flex flex-col gap-2">
        <label htmlFor="meaning-0" className={label}>
          Meaning
        </label>
        {values.meanings.map((m, i) => (
          <div key={i} className="flex flex-col gap-1">
            {i > 0 && (
              <div className="flex items-center justify-between">
                <label htmlFor={`meaning-${i}`} className="text-sm text-muted">
                  Meaning {i + 1}
                </label>
                <button
                  type="button"
                  className="text-sm text-muted underline-offset-2 hover:text-green hover:underline"
                  onClick={() => set('meanings', values.meanings.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
            )}
            <textarea
              id={`meaning-${i}`}
              className={field}
              rows={2}
              value={m}
              onChange={(e) => setMeaning(i, e.target.value)}
              placeholder={i === 0 ? 'What it means, in your own words or from the dictionary' : 'Another meaning'}
              aria-invalid={i === 0 && !!errors.meaning}
              aria-describedby={i === 0 && errors.meaning ? 'meaning-error' : undefined}
            />
          </div>
        ))}
        {errors.meaning && (
          <span id="meaning-error" className="text-[15px] text-green">
            {errors.meaning}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            className="self-start text-[15px] text-green underline-offset-2 hover:underline"
            onClick={() => set('meanings', [...values.meanings, ''])}
          >
            + Add another meaning
          </button>
        </div>

        {otherDefinitions.length > 0 && (
          <details className="rounded-md border border-line bg-card/60 px-3 py-2">
            <summary className="cursor-pointer text-[15px] text-green">
              Other dictionary definitions ({otherDefinitions.length})
            </summary>
            <ul className="mt-2 flex flex-col">
              {otherDefinitions.map((o, i) => (
                <li key={i} className="border-t border-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => chooseDefinition(o)}
                    className="w-full py-2 text-left text-[15px] hover:text-green"
                  >
                    {o.partOfSpeech && <i className="text-muted">{o.partOfSpeech}. </i>}
                    {o.definition}
                  </button>
                </li>
              ))}
            </ul>
            <p className="pb-1 text-sm text-muted">Tap one to use it as the main meaning.</p>
          </details>
        )}
      </div>

      {/* Part of speech */}
      <div className="flex flex-col gap-2">
        <span id="pos-label" className={label}>
          Part of speech
        </span>
        <Chips options={POS_OPTIONS} value={values.partOfSpeech} onChange={(v) => set('partOfSpeech', v)} labelledBy="pos-label" />
      </div>

      {/* Example */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="example" className={label}>
          Example sentence
        </label>
        <textarea
          id="example"
          className={`${field} italic`}
          rows={2}
          value={values.example}
          onChange={(e) => set('example', e.target.value)}
          placeholder="A sentence using the word (optional)"
        />
      </div>

      {/* Source */}
      <div className="flex flex-col gap-2">
        <span id="source-label" className={label}>
          Where did you find it?
        </span>
        <Chips options={SOURCE_OPTIONS} value={values.sourceType} onChange={(v) => set('sourceType', v)} labelledBy="source-label" />
        {values.sourceType && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="source-title"
              aria-label={TITLE_PLACEHOLDER[values.sourceType]}
              className={field}
              value={values.sourceTitle}
              onChange={(e) => set('sourceTitle', e.target.value)}
              placeholder={TITLE_PLACEHOLDER[values.sourceType]}
              list="title-suggestions"
            />
            {values.sourceType === 'book' && (
              <input
                id="source-author"
                aria-label="Author"
                className={field}
                value={values.sourceAuthor}
                onChange={(e) => set('sourceAuthor', e.target.value)}
                placeholder="Author (optional)"
              />
            )}
            <datalist id="title-suggestions">
              {titleSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        )}
      </div>

      {/* More details */}
      <details className="group flex flex-col">
        <summary className="cursor-pointer text-[15px] text-green">More details: synonyms, antonyms, notes</summary>
        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="synonyms" className={label}>
              Synonyms
            </label>
            <input
              id="synonyms"
              className={field}
              value={values.synonyms}
              onChange={(e) => set('synonyms', e.target.value)}
              placeholder="Separate with commas"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="antonyms" className={label}>
              Antonyms
            </label>
            <input
              id="antonyms"
              className={field}
              value={values.antonyms}
              onChange={(e) => set('antonyms', e.target.value)}
              placeholder="Separate with commas"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className={label}>
              Notes
            </label>
            <textarea
              id="notes"
              className={field}
              rows={2}
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything you want to remember about it"
            />
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <button type="submit" className={btn.primary}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={btn.quiet} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
