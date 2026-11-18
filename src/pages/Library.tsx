import { usePageTitle } from '../lib/usePageTitle'
import { useCallback, useMemo, useState } from 'react'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import WordEntry from '../components/WordEntry'
import { btn, chipToggle, field, select } from '../components/ui'
import { SOURCE_LABELS } from '../lib/labels'
import {
  ALPHABET,
  NO_FILTERS,
  filterWords,
  groupByLetter,
  hasFilters,
  sortWords,
  type LibraryFilters,
  type SortOrder,
} from '../lib/search'
import { PARTS_OF_SPEECH, SOURCE_TYPES, type PartOfSpeech, type SourceType, type Word } from '../lib/types'
import { useNotebook } from '../store/context'

/** Words shown per letter before "Show all". */
const PER_LETTER = 3
/** Words shown at a time in "Newest first" and "Most missed". */
const PAGE = 30

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
  usePageTitle('Library')
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

  const entry = (w: Word) => (
    <WordEntry
      key={w.id}
      word={w}
      expanded={expanded.has(w.id)}
      onToggle={() => toggle(w.id)}
      onFavourite={() => toggleFavourite(w.id)}
      onDelete={() => remove(w)}
    />
  )

  // ---- A–Z: grouped by letter, a few words each ----
  const searching = hasFilters(filters)
  const groups = sort === 'az' ? groupByLetter(shown) : null
  const [openLetters, setOpenLetters] = useState<Set<string>>(() => new Set())
  const toggleLetter = (letter: string) => {
    const wasOpen = openLetters.has(letter)
    setOpenLetters((prev) => {
      const next = new Set(prev)
      if (wasOpen) next.delete(letter)
      else next.add(letter)
      return next
    })
    // Collapsing a long list can leave you far below it; bring the heading back.
    if (wasOpen) requestAnimationFrame(() => document.getElementById(`letter-${letter}`)?.scrollIntoView({ block: 'start' }))
  }
  const jumpTo = (letter: string) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  // ---- Other sort orders: 30 at a time ----
  // The count resets whenever sort or filters change.
  const viewKey = JSON.stringify(view)
  const [page, setPage] = useState({ key: viewKey, count: PAGE })
  const visibleCount = page.key === viewKey ? page.count : PAGE

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
            className={chipToggle(filters.favouritesOnly)}
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
      ) : groups ? (
        <>
          <LetterIndex available={new Set(groups.map((g) => g.letter))} onJump={jumpTo} />
          <div className="flex flex-col gap-8 pt-4">
            {groups.map(({ letter, words: inLetter }) => {
              // While searching or filtering, show every match. Otherwise a few per letter.
              const open = searching || openLetters.has(letter) || inLetter.length <= PER_LETTER
              const visible = open ? inLetter : inLetter.slice(0, PER_LETTER)
              const label = letter === '#' ? 'numbers and symbols' : letter
              return (
                <section key={letter} aria-labelledby={`letter-${letter}`}>
                  <h2
                    id={`letter-${letter}`}
                    className="flex scroll-mt-20 items-baseline justify-between border-b border-line pb-1 text-4xl"
                  >
                    {letter}
                    <span className="font-body text-sm font-normal text-muted">
                      {inLetter.length} {inLetter.length === 1 ? 'word' : 'words'}
                    </span>
                  </h2>
                  <ul>{visible.map(entry)}</ul>
                  {!searching && inLetter.length > PER_LETTER && (
                    <button
                      type="button"
                      onClick={() => toggleLetter(letter)}
                      aria-expanded={openLetters.has(letter)}
                      className="mt-2 text-[15px] text-green underline-offset-2 hover:underline"
                    >
                      {openLetters.has(letter)
                        ? 'Show fewer'
                        : `Show all ${inLetter.length} words in ${label} →`}
                    </button>
                  )}
                </section>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <ul>{shown.slice(0, visibleCount).map(entry)}</ul>
          {shown.length > visibleCount && (
            <div className="mt-6 flex flex-col items-center gap-1">
              <button type="button" className={btn.secondary} onClick={() => setPage({ key: viewKey, count: visibleCount + PAGE })}>
                Show {Math.min(PAGE, shown.length - visibleCount)} more
              </button>
              <span className="text-sm text-muted">
                Showing {visibleCount} of {shown.length}
              </span>
            </div>
          )}
        </>
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

/** A–Z tabs that stay at the top while you scroll. Letters with no words are faded. */
function LetterIndex({ available, onJump }: { available: Set<string>; onJump: (letter: string) => void }) {
  return (
    <nav
      aria-label="Jump to letter"
      className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 border-b border-line bg-paper/95 px-4 py-1.5 backdrop-blur"
    >
      <ul className="flex gap-0.5 overflow-x-auto sm:justify-between [scrollbar-width:none]">
        {ALPHABET.filter((l) => l !== '#' || available.has('#')).map((l) => {
          const has = available.has(l)
          return (
            <li key={l}>
              <button
                type="button"
                disabled={!has}
                onClick={() => onJump(l)}
                aria-label={has ? `Jump to ${l === '#' ? 'numbers and symbols' : l}` : `No words under ${l}`}
                className="grid h-8 min-w-7 place-items-center rounded font-display text-lg font-semibold text-green transition-colors hover:bg-paper-deep disabled:font-medium disabled:text-line disabled:hover:bg-transparent"
              >
                {l}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
