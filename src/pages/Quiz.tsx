import { usePageTitle } from '../lib/usePageTitle'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'
import Illustration from '../components/Illustration'
import QuizQuestion from '../components/QuizQuestion'
import { btn } from '../components/ui'
import { MIN_WORDS, buildQuiz, type Question } from '../lib/quiz'
import type { QuizFormat, Word } from '../lib/types'
import { useNotebook } from '../store/context'

type Answer = { wordId: string; correct: boolean }

const FORMATS: { value: QuizFormat; title: string; note: string }[] = [
  { value: 'meaning', title: 'Guess the meaning', note: 'See a word, pick what it means.' },
  { value: 'word', title: 'Guess the word', note: 'See a meaning, pick the word.' },
]

const LENGTHS = [5, 10, 20]

function verdict(score: number, total: number): string {
  if (total === 0) return ''
  if (score === total) return "Full marks. He'd be proud."
  const ratio = score / total
  if (ratio >= 0.7) return 'Well remembered.'
  if (ratio >= 0.4) return 'Getting there.'
  return 'These need another look.'
}

const Masthead = ({ right }: { right: string }) => (
  <div className="flex justify-between border-b border-ink pb-2 text-sm">
    <span className="smallcaps">The evening quiz</span>
    <span className="smallcaps">{right}</span>
  </div>
)

export default function Quiz() {
  usePageTitle('The evening quiz')
  const { words, recordQuiz } = useNotebook()
  const [format, setFormat] = useState<QuizFormat>('meaning')
  const [length, setLength] = useState(10)
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [index, setIndex] = useState(0)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)

  // Save results once: when the quiz ends, or if you leave part-way through.
  const pending = useRef<{ format: QuizFormat; answers: Answer[] } | null>(null)
  const save = useCallback(() => {
    if (pending.current && pending.current.answers.length > 0) recordQuiz(pending.current)
    pending.current = null
  }, [recordQuiz])
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])
  useEffect(() => () => saveRef.current(), [])

  const start = (only?: Word[]) => {
    const qs = buildQuiz(words, format, length, { only })
    setQuestions(qs)
    setIndex(0)
    setChosenId(null)
    setAnswers([])
    setFinished(false)
    pending.current = { format, answers: [] }
    window.scrollTo({ top: 0 })
  }

  const question = questions?.[index]

  const choose = useCallback(
    (optionId: string) => {
      if (!question || chosenId) return
      const answer = { wordId: question.word.id, correct: optionId === question.answerId }
      setChosenId(optionId)
      setAnswers((prev) => [...prev, answer])
      if (pending.current) pending.current.answers.push(answer)
    },
    [question, chosenId],
  )

  const next = useCallback(() => {
    if (!questions || !chosenId) return
    if (index + 1 >= questions.length) {
      save()
      setFinished(true)
    } else {
      setIndex(index + 1)
      setChosenId(null)
    }
    window.scrollTo({ top: 0 })
  }, [questions, chosenId, index, save])

  // Keyboard: 1–4 or a–d to answer, → or N for the next question (Enter works on the focused button).
  useEffect(() => {
    if (!question || finished) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return
      const key = e.key.toLowerCase()
      const pick = '1234'.indexOf(key) >= 0 ? '1234'.indexOf(key) : 'abcd'.indexOf(key)
      if (!chosenId && pick >= 0 && question.options[pick]) {
        e.preventDefault()
        choose(question.options[pick].id)
      } else if (chosenId && (key === 'arrowright' || key === 'n')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, chosenId, finished, choose, next])

  // ---------- Not enough words ----------
  if (words.length < MIN_WORDS) {
    return (
      <EmptyState illustration="tea" title="The evening quiz" actions={<ButtonLink to="/add">Add a word</ButtonLink>}>
        <p className="font-hand text-2xl text-green">“So, what does it mean?”</p>
        <p className="mt-3">
          Save at least {MIN_WORDS} words and the quiz opens.{' '}
          {words.length > 0 && `You have ${words.length} so far.`}
        </p>
      </EmptyState>
    )
  }

  // ---------- Results ----------
  if (questions && finished) {
    const score = answers.filter((a) => a.correct).length
    const missedIds = new Set(answers.filter((a) => !a.correct).map((a) => a.wordId))
    const missed = questions.map((q) => q.word).filter((w) => missedIds.has(w.id))
    return (
      <div className="flex flex-col gap-6">
        <Masthead right="Results" />
        <div className="flex flex-col items-center gap-2 text-center">
          <Illustration name={score === answers.length ? 'sparkle' : 'tea'} className="w-28" decorative />
          <p className="font-display text-6xl font-semibold text-green">
            {score}
            <span className="text-3xl text-muted"> / {answers.length}</span>
          </p>
          <p className="font-hand text-3xl text-green">{verdict(score, answers.length)}</p>
        </div>

        {missed.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-2xl">To look at again</h2>
            <ul>
              {missed.map((w) => (
                <li key={w.id} className="border-b border-line py-2">
                  <span className="font-display text-xl font-semibold text-green">{w.word}</span>
                  <span className="text-muted"> — {w.meanings[0]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          {missed.length > 0 && (
            <button type="button" className={btn.primary} onClick={() => start(missed)}>
              Practise {missed.length === 1 ? 'that word' : `those ${missed.length}`} again
            </button>
          )}
          <button type="button" className={missed.length > 0 ? btn.secondary : btn.primary} onClick={() => setQuestions(null)}>
            New quiz
          </button>
          <Link to="/library" className={btn.quiet}>
            Back to library
          </Link>
        </div>
      </div>
    )
  }

  // ---------- A question ----------
  if (questions && question) {
    const formatTitle = FORMATS.find((f) => f.value === question.format)?.title ?? ''
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Masthead right={`${index + 1} of ${questions.length}`} />
          <div className="h-1 overflow-hidden rounded-full bg-paper-deep" aria-hidden>
            <div
              className="h-full bg-green transition-[width] duration-300"
              style={{ width: `${((index + (chosenId ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>{formatTitle}</span>
            <button
              type="button"
              className="underline-offset-2 hover:text-green hover:underline"
              onClick={() => {
                save()
                setQuestions(null)
              }}
            >
              End quiz
            </button>
          </div>
        </div>
        <QuizQuestion
          key={index}
          question={question}
          chosenId={chosenId}
          onChoose={choose}
          onNext={next}
          isLast={index + 1 >= questions.length}
        />
        <p className="hidden text-center text-sm text-muted sm:block">Press 1–4 to answer, then Enter for the next question.</p>
      </div>
    )
  }

  // ---------- Setup ----------
  const lengths = LENGTHS.filter((n) => n < words.length)
  return (
    <div className="flex flex-col gap-8">
      <Masthead right={`${words.length} words`} />
      <div className="flex flex-col items-center gap-2 text-center">
        <Illustration name="tea" className="w-24" decorative />
        <h1 className="text-5xl">The evening quiz</h1>
        <p className="font-hand text-2xl text-green">“So, what does it mean?”</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="smallcaps mb-3 text-sm text-muted">Kind of quiz</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map((f) => {
            const on = f.value === format
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => setFormat(f.value)}
                className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${
                  on ? 'border-green bg-green text-paper' : 'border-line bg-card hover:border-green'
                }`}
              >
                <span className="font-display text-2xl font-semibold">{f.title}</span>
                <span className={on ? 'text-paper/80' : 'text-muted'}>{f.note}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="smallcaps mb-3 text-sm text-muted">How many words</legend>
        <div className="flex flex-wrap gap-2">
          {[...lengths, words.length].map((n) => {
            const on = n === Math.min(length, words.length)
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => setLength(n)}
                className={`rounded-full border px-4 py-1.5 text-[15px] transition-colors ${
                  on ? 'border-green bg-green text-paper' : 'border-line bg-card hover:border-green'
                }`}
              >
                {n === words.length ? `All ${n}` : n}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-muted">Words you've missed, or haven't seen in a while, come up more often.</p>
      </fieldset>

      <div>
        <button type="button" className={`${btn.primary} px-6 py-3 text-[17px]`} onClick={() => start()}>
          Start the quiz
        </button>
      </div>
    </div>
  )
}
