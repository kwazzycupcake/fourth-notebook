import { useCallback, useMemo, useState } from 'react'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import WordEntry from '../components/WordEntry'
import { btn, field, select } from '../components/ui'
import { SOURCE_LABELS } from '../lib/labels'
import { NO_FILTERS, filterWords, hasFilters, letterOf, sortWords, type LibraryFilters, type SortOrder } from '../lib/search'
import { PARTS_OF_SPEECH, SOURCE_TYPES, type PartOfSpeech, type SourceType, type Word } from '../lib/types'
import { useNotebook } from '../store/context'

// Remember sort and filters while you hop to Edit and back.
const SESSION_KEY = 'sixth-notebook.library'
function loadView(): { filters: LibraryFilters; sort: SortOrder } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    if (saved?.filters && saved?.sort) return saved
  } catch {
    /* ignore */
  }
  return { filters: NO_FILTERS, sort: 'az' }
}

export default function Library() {
  const { words, toggleFavourite, removeWord } = useNotebook()
  const [view, setView] = useState(loadView)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [toast, setToast] = useState<{ message: string; undo: () => void } | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const { filters, sort } = view
  const update = (next: Partial<typeof view>) => {
    const merged = { ...view, ...next }
    setView(merged)
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged))
    } catch {
      /* ignore */
    }
  }
  const setFilter = (next: Partial<LibraryFilters>) => update({ filters: { ...filters, ...next } })

  const shown = useMemo(() => sortWords(filterWords(words, filters), sort), [words, filters, sort])

  // Only offer filters you can actually use.
  const usedSources = SOURCE_TYPES.filter((s) => words.some((w) => w.source?.type === s))
  const usedPos = PARTS_OF_SPEECH.filter((p) => words.some((w) => w.partOfSpeech === p))

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const remove = (w: Word) => {
    const undo = removeWord(w.id)
    setToast({ message: `Deleted “${w.word}”.`, undo })
  }

  if (words.length === 0) {
    return (
      <>
        <PageHeader kicker="Your lexicon" title="Library" />
        <EmptyState illustration="book" title="No words yet" actions={<ButtonLink to="/add">Add a word</ButtonLink>}>
          <p>Every word you save appears here, A to Z, with search and filters.</p>
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader kicker="Your lexicon" title="Library" />

      <div className="mb-6 flex flex-col gap-3">
        <label htmlFor="library-search" className="sr-only">
          Search your words
        </label>
        <input
          id="library-search"
          type="search"
          className={field}
          value={filters.query}
          onChange={(e) => setFilter({ query: e.target.value })}
          placeholder="Search words, meanings, books…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="library-sort" className="sr-only">
            Sort
          </label>
          <select id="library-sort" className={select} value={sort} onChange={(e) => update({ sort: e.target.value as SortOrder })}>
            <option value="az">A–Z</option>
            <option value="newest">Newest first</option>
            <option value="missed">Most missed</option>
          </select>

          {usedSources.length > 0 && (
            <>
              <label htmlFor="library-source" className="sr-only">
                Source
              </label>
              <select
                id="library-source"
                className={select}
                value={filters.sourceType}
                onChange={(e) => setFilter({ sourceType: e.target.value as SourceType | '' })}
              >
                <option value="">All sources</option>
                {usedSources.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </>
          )}

          {usedPos.length > 1 && (
            <>
              <label htmlFor="library-pos" className="sr-only">
                Part of speech
              </label>
              <select
                id="library-pos"
                className={select}
                value={filters.partOfSpeech}
                onChange={(e) => setFilter({ partOfSpeech: e.target.value as PartOfSpeech | '' })}
              >
                <option value="">All types</option>
                {usedPos.map((p) => (
                  <option key={p} value={p}>
                    {p === 'other' ? 'Other' : `${p[0].toUpperCase()}${p.slice(1)}s`}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            aria-pressed={filters.favouritesOnly}
            onClick={() => setFilter({ favouritesOnly: !filters.favouritesOnly })}
            className={`rounded-full border px-3 py-1.5 text-[15px] transition-colors ${
              filters.favouritesOnly ? 'border-green bg-green text-paper' : 'border-line bg-card hover:border-green'
            }`}
          >
            ★ Favourites
          </button>
        </div>

        <p className="text-sm text-muted" aria-live="polite">
          {hasFilters(filters) ? `${shown.length} of ${words.length} words` : `${words.length} words`}
          {hasFilters(filters) && (
            <>
              {' · '}
              <button type="button" onClick={() => update({ filters: NO_FILTERS })} className="text-green underline underline-offset-2">
                Clear filters
              </button>
            </>
          )}
        </p>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-display text-2xl text-green">No words match</p>
          <button type="button" className={btn.secondary} onClick={() => update({ filters: NO_FILTERS })}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul>
          {shown.map((w, i) => {
            const letter = sort === 'az' ? letterOf(w.word) : null
            const newLetter = letter && (i === 0 || letterOf(shown[i - 1].word) !== letter)
            return (
              <Entry key={w.id} letter={newLetter ? letter : null}>
                <WordEntry
                  word={w}
                  expanded={expanded.has(w.id)}
                  onToggle={() => toggle(w.id)}
                  onFavourite={() => toggleFavourite(w.id)}
                  onDelete={() => remove(w)}
                />
              </Entry>
            )
          })}
        </ul>
      )}

      {toast && (
        <Toast
          message={toast.message}
          actionLabel="Undo"
          onAction={() => {
            toast.undo()
            setToast(null)
          }}
          onClose={closeToast}
        />
      )}
    </>
  )
}

/** Adds an A–Z letter heading above the first word of each letter. */
function Entry({ letter, children }: { letter: string | null; children: React.ReactNode }) {
  return (
    <>
      {letter && (
        <li aria-hidden className="mt-6 border-b border-line pb-1 font-display text-4xl font-semibold leading-none text-green first:mt-0">
          {letter}
        </li>
      )}
      {children}
    </>
  )
}
