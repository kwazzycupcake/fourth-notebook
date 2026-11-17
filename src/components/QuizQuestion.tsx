import { useEffect, useRef } from 'react'
import { POS_SHORT, describeSource } from '../lib/labels'
import type { Question } from '../lib/quiz'
import { btn } from './ui'

const LETTERS = ['a', 'b', 'c', 'd']

/** One question, then the answer and a short explanation. */
export default function QuizQuestion({
  question: q,
  chosenId,
  onChoose,
  onNext,
  isLast,
}: {
  question: Question
  chosenId: string | null
  onChoose: (optionId: string) => void
  onNext: () => void
  isLast: boolean
}) {
  const answered = chosenId !== null
  const correct = chosenId === q.answerId
  const nextButton = useRef<HTMLButtonElement>(null)
  const w = q.word
  const source = describeSource(w.source)

  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!answered) return
    nextButton.current?.focus({ preventScroll: true })
    // On phones the explanation starts below the fold, so bring it into view.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panel.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
  }, [answered])

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt */}
      {q.format === 'meaning' ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="italic text-muted">So, what does</span>
          <span className="break-words font-display text-6xl font-semibold leading-none text-green sm:text-7xl">{q.prompt}</span>
          <span className="italic text-muted">mean?</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="italic text-muted">Which word means…</span>
          <p className="max-w-xl font-display text-3xl font-medium leading-snug text-green">{q.prompt}</p>
        </div>
      )}

      {/* Options */}
      <ul className="flex flex-col gap-2" aria-label="Answers">
        {q.options.map((o, i) => {
          const isAnswer = o.id === q.answerId
          const isChosen = o.id === chosenId
          let state = 'border-line bg-card hover:border-green'
          if (answered && isAnswer) state = 'border-green bg-green text-paper'
          else if (answered && isChosen) state = 'border-line bg-paper text-muted line-through'
          else if (answered) state = 'border-line bg-paper text-muted'
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onChoose(o.id)}
                className={`flex w-full items-baseline gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-default ${state} ${
                  q.format === 'word' ? 'font-display text-2xl font-semibold' : ''
                }`}
              >
                <span className={`shrink-0 font-body text-sm italic ${answered && isAnswer ? 'text-paper/80' : 'text-muted'}`}>
                  {LETTERS[i]}.
                </span>
                <span className="min-w-0 flex-1">{o.text}</span>
                {answered && isAnswer && <span aria-label="correct answer">✓</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Answer + explanation */}
      {answered && (
        <div ref={panel} className="flex scroll-mb-28 flex-col gap-4 rounded-lg bg-paper-deep p-5 sm:scroll-mb-8" role="status">
          <p className="font-display text-2xl font-semibold text-green">{correct ? 'Correct.' : 'Not quite.'}</p>
          <div className="flex flex-col gap-1">
            <p>
              <b className="font-display text-xl">{w.word}</b>
              {w.partOfSpeech && POS_SHORT[w.partOfSpeech] && <i className="text-muted"> {POS_SHORT[w.partOfSpeech]}</i>}
              {w.phonetic && <span className="text-muted"> {w.phonetic}</span>}
            </p>
            <p>{w.meanings[0]}</p>
            {w.meanings.length > 1 && <p className="text-[15px] text-muted">Also: {w.meanings.slice(1).join('; ')}</p>}
            {w.example && <p className="mt-1 italic">“{w.example}”</p>}
            {source && <p className="mt-1 text-sm text-muted">You found it in {source}.</p>}
          </div>
          <div>
            <button ref={nextButton} type="button" className={btn.primary} onClick={onNext}>
              {isLast ? 'See results' : 'Next question'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
