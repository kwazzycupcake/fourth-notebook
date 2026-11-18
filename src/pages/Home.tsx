import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '../components/Button'
import Illustration from '../components/Illustration'
import QuickAdd from '../components/QuickAdd'
import { POS_SHORT, describeSource } from '../lib/labels'
import { MIN_WORDS } from '../lib/quiz'
import { computeStats, wordOfTheDay } from '../lib/stats'
import { usePageTitle } from '../lib/usePageTitle'
import { useNotebook } from '../store/context'

const FULL_POS = { noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb', other: '' } as const

export default function Home() {
  usePageTitle()
  const { notebook, words } = useNotebook()
  // Read the date once when the page opens, not on every re-render.
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  )
  const stats = useMemo(() => computeStats(notebook), [notebook])
  const todays = useMemo(() => wordOfTheDay(words), [words])
  const recent = useMemo(() => [...words].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 3), [words])

  const masthead = (
    <div className="flex justify-between border-b border-ink pb-2 text-sm">
      <span className="smallcaps">Notebook No. 4</span>
      <span className="smallcaps">{today}</span>
    </div>
  )

  // ---------- A brand-new notebook ----------
  if (words.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        {masthead}
        <div className="flex flex-col items-center gap-4 text-center">
          <Illustration name="book" className="w-36" />
          <h1 className="text-5xl">Your notebook is empty</h1>
          <p className="max-w-md text-muted">
            Save the words you meet in books, shows and conversations, then let the evening quiz help you keep them.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md">
          <QuickAdd />
        </div>
        <p className="text-center font-hand text-2xl text-green">
          He filled three. This is the fourth.{' '}
          <Link to="/story" className="whitespace-nowrap font-body text-base underline underline-offset-2">
            Read the story
          </Link>
        </p>
      </div>
    )
  }

  const statCells = [
    { value: stats.total, label: stats.total === 1 ? 'word' : 'words' },
    { value: stats.revised, label: 'revised' },
    { value: stats.accuracy === null ? '–' : `${stats.accuracy}%`, label: 'quiz accuracy' },
    { value: stats.favourites, label: stats.favourites === 1 ? 'favourite' : 'favourites' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {masthead}

      <QuickAdd />

      {/* Today's word, set like a dictionary entry */}
      {todays && (
        <article className="flex flex-col gap-2" aria-labelledby="todays-word">
          <span className="smallcaps text-sm text-green">Today's word</span>
          <h1 id="todays-word" className="break-words text-6xl leading-none">
            {todays.word}
          </h1>
          {(todays.partOfSpeech || todays.phonetic) && (
            <p className="text-muted">
              {todays.partOfSpeech && FULL_POS[todays.partOfSpeech] && <i>{FULL_POS[todays.partOfSpeech]}</i>}
              {todays.partOfSpeech && FULL_POS[todays.partOfSpeech] && todays.phonetic && <>&nbsp;&nbsp;</>}
              {todays.phonetic}
            </p>
          )}
          <ol className="flex flex-col gap-1">
            {todays.meanings.map((m, i) => (
              <li key={i}>
                {todays.meanings.length > 1 && <b className="mr-1">{i + 1}.</b>}
                {m}
              </li>
            ))}
          </ol>
          {todays.example && <p className="italic">“{todays.example}”</p>}
          {describeSource(todays.source) && (
            <p className="text-sm text-muted">Found in {describeSource(todays.source)}</p>
          )}
        </article>
      )}

      {/* A few numbers, kept quiet */}
      <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {statCells.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col-reverse items-center py-3 ${i % 2 === 1 ? 'border-l border-line' : ''} ${
              i >= 2 ? 'border-t border-line sm:border-t-0' : ''
            } ${i === 2 ? 'sm:border-l' : ''}`}
          >
            {/* dt comes first for screen readers; flex-col-reverse shows the number on top */}
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="font-display text-3xl font-semibold leading-tight tabular-nums text-green">{s.value}</dd>
          </div>
        ))}
      </dl>

      {words.length >= MIN_WORDS ? (
        <div>
          <ButtonLink to="/quiz">Start the evening quiz →</ButtonLink>
        </div>
      ) : (
        <p className="text-muted">
          Save {MIN_WORDS - words.length} more {MIN_WORDS - words.length === 1 ? 'word' : 'words'} and the evening quiz opens.
        </p>
      )}

      {/* Recently saved */}
      <section className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <h2 className="smallcaps font-body text-sm font-normal text-muted">Recently saved</h2>
          <Link to="/library" className="text-[15px] text-green underline-offset-2 hover:underline">
            Open library →
          </Link>
        </div>
        <ul>
          {recent.map((w) => (
            <li key={w.id} className="border-b border-line">
              <Link to={`/words/${w.id}/edit`} className="flex items-baseline gap-2 py-2 hover:text-green">
                <span className="font-display text-xl font-semibold">{w.word}</span>
                {w.partOfSpeech && POS_SHORT[w.partOfSpeech] && <i className="text-muted">{POS_SHORT[w.partOfSpeech]}</i>}
                <span className="min-w-0 truncate text-muted">{w.meanings[0]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-sm text-muted">
        <Link to="/story" className="underline-offset-2 hover:text-green hover:underline">
          Why “the fourth notebook”?
        </Link>
      </p>
    </div>
  )
}
