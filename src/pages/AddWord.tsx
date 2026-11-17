import { usePageTitle } from '../lib/usePageTitle'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import Illustration from '../components/Illustration'
import PageHeader from '../components/PageHeader'
import WordForm from '../components/WordForm'
import WordSearch from '../components/WordSearch'
import { btn } from '../components/ui'
import { lookupWord, type DefinitionOption } from '../lib/dictionary'
import { suggestWords } from '../lib/suggest'
import { usedTitles } from '../lib/titles'
import type { Word } from '../lib/types'
import { emptyForm, formFromLookup, formToInput, type FormValues } from '../lib/wordForm'
import { wordKey } from '../lib/words'
import { useNotebook } from '../store/context'

type Phase = 'search' | 'loading' | 'form'

const LOOKUP_MESSAGES = {
  'not-found': "isn't in the dictionary. Write the meaning yourself below.",
  offline: "You're offline, so the dictionary can't be reached. Write the meaning yourself below.",
  error: "The dictionary didn't answer. Write the meaning yourself below, or try again later.",
}

export default function AddWord() {
  usePageTitle('Add a word')
  const { words, addWord, setLastSource, notebook } = useNotebook()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase>('search')
  const [values, setValues] = useState<FormValues>(() => emptyForm())
  const [options, setOptions] = useState<DefinitionOption[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [saved, setSaved] = useState<Word | null>(null)
  const [didYouMean, setDidYouMean] = useState<string[]>([])
  const searchInput = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  const titles = useMemo(() => usedTitles(words), [words])
  const savedKeys = useMemo(() => new Set(words.map((w) => wordKey(w.word))), [words])
  const lastSource = notebook.settings.lastSource

  const startForm = (word: string) => {
    setValues(emptyForm(word, lastSource))
    setOptions([])
  }

  const lookup = async (raw: string) => {
    const word = raw.trim()
    if (!word) return
    const id = ++requestId.current
    setSaved(null)
    setNotice(null)
    setDidYouMean([])
    setPhase('loading')
    const outcome = await lookupWord(word)
    if (id !== requestId.current) return // a newer lookup started
    if (outcome.ok) {
      setValues(formFromLookup(outcome.result, emptyForm(word, lastSource)))
      setOptions(outcome.result.options)
    } else {
      startForm(word)
      setNotice(outcome.reason === 'not-found' ? `“${word}” ${LOOKUP_MESSAGES['not-found']}` : LOOKUP_MESSAGES[outcome.reason])
    }
    setPhase('form')

    // A likely typo? Offer close spellings.
    if (!outcome.ok && outcome.reason === 'not-found') {
      const close = (await suggestWords(word)).filter((s) => wordKey(s) !== wordKey(word) && !s.includes(' ')).slice(0, 3)
      if (id === requestId.current) setDidYouMean(close)
    }
  }

  // Arriving from Home's quick-add box: /add?word=tirade
  const fromHome = params.get('word')
  useEffect(() => {
    if (!fromHome) return
    setParams({}, { replace: true })
    setQuery(fromHome)
    void lookup(fromHome)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per incoming word
  }, [fromHome])

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    void lookup(query)
  }

  const writeItMyself = () => {
    requestId.current++
    setSaved(null)
    setNotice(null)
    startForm(query.trim())
    setPhase('form')
  }

  const reset = () => {
    requestId.current++
    setPhase('search')
    setQuery('')
    setNotice(null)
    setTimeout(() => searchInput.current?.focus(), 0)
  }

  const save = () => {
    const input = formToInput(values)
    const word = addWord(input)
    setLastSource(input.source)
    setSaved(word)
    reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const duplicate = phase === 'form' ? words.find((w) => wordKey(w.word) === wordKey(values.word)) : undefined

  return (
    <>
      <PageHeader kicker="A new entry" title="Add a word" />

      {saved && (
        <div role="status" className="mb-6 flex items-center gap-4 rounded-lg bg-paper-deep px-4 py-3">
          <Illustration name="sparkle" className="w-12 shrink-0" decorative />
          <p>
            Saved <b className="font-display text-xl text-green">{saved.word}</b>.{' '}
            <Link to="/library" className="text-green underline underline-offset-2">
              See your library
            </Link>
          </p>
        </div>
      )}

      {phase !== 'form' ? (
        <div className="flex flex-col gap-4">
          <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <WordSearch
              value={query}
              onChange={setQuery}
              onPick={(w) => {
                setQuery(w)
                void lookup(w)
              }}
              disabled={phase === 'loading'}
              inputRef={searchInput}
              inNotebook={(w) => savedKeys.has(wordKey(w))}
            />
            <button type="submit" className={btn.primary} disabled={phase === 'loading' || !query.trim()}>
              {phase === 'loading' ? 'Looking up…' : 'Look up'}
            </button>
          </form>
          <p className="text-muted">
            Press Enter and the dictionary fills in the meaning, part of speech and more. Or{' '}
            <button type="button" onClick={writeItMyself} className="text-green underline underline-offset-2">
              write it yourself
            </button>
            .
          </p>
          {phase === 'search' && !saved && (
            <div className="flex justify-center pt-6">
              <Illustration name="pen" className="w-36" decorative />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {notice && (
            <div className="flex flex-col gap-2 rounded-md border border-line bg-card px-4 py-3">
              <p>{notice}</p>
              {didYouMean.length > 0 && (
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-muted">Did you mean</span>
                  {didYouMean.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setQuery(s)
                        void lookup(s)
                      }}
                      className="font-display text-xl font-semibold text-green underline decoration-1 underline-offset-4"
                    >
                      {s}
                    </button>
                  ))}
                </p>
              )}
            </div>
          )}
          {duplicate && (
            <p className="rounded-md border border-green px-4 py-3">
              “{duplicate.word}” is already in your notebook.{' '}
              <Link to={`/words/${duplicate.id}/edit`} className="text-green underline underline-offset-2">
                Edit that entry
              </Link>{' '}
              instead, or save this as a separate one.
            </p>
          )}
          <WordForm
            values={values}
            onChange={setValues}
            onSubmit={save}
            submitLabel="Save word"
            onCancel={reset}
            definitionOptions={options}
            titleSuggestions={titles}
          />
        </div>
      )}
    </>
  )
}
