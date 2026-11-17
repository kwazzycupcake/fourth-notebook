import { Link } from 'react-router'
import { POS_SHORT, describeSource, formatDate } from '../lib/labels'
import type { Word } from '../lib/types'

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  )
}

/** One dictionary-style entry. Tap the word to open the full entry. */
export default function WordEntry({
  word: w,
  expanded,
  onToggle,
  onFavourite,
  onDelete,
}: {
  word: Word
  expanded: boolean
  onToggle: () => void
  onFavourite: () => void
  onDelete: () => void
}) {
  const panelId = `entry-${w.id}`
  const source = describeSource(w.source)
  const quizzed = w.timesRight + w.timesWrong

  return (
    <li className="border-b border-line">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="group flex min-w-0 flex-1 flex-col py-3 text-left"
        >
          <span className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-green group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
              {w.word}
            </span>
            {w.partOfSpeech && POS_SHORT[w.partOfSpeech] && <i className="text-muted">{POS_SHORT[w.partOfSpeech]}</i>}
          </span>
          {!expanded && <span className="truncate text-muted">{w.meanings[0]}</span>}
        </button>
        <button
          type="button"
          onClick={onFavourite}
          aria-pressed={w.favourite}
          aria-label={w.favourite ? `Remove ${w.word} from favourites` : `Add ${w.word} to favourites`}
          className={`mt-3 rounded-md p-2 transition-colors ${w.favourite ? 'text-green' : 'text-muted/50 hover:text-green'}`}
        >
          <Star filled={w.favourite} />
        </button>
      </div>

      {expanded && (
        <div id={panelId} className="flex flex-col gap-3 pb-5">
          {w.phonetic && <span className="-mt-2 text-muted">{w.phonetic}</span>}

          {w.meanings.length === 1 ? (
            <p>{w.meanings[0]}</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {w.meanings.map((m, i) => (
                <li key={i}>
                  <b className="mr-1">{i + 1}.</b>
                  {m}
                </li>
              ))}
            </ol>
          )}

          {w.example && <p className="italic">“{w.example}”</p>}

          {(w.synonyms.length > 0 || w.antonyms.length > 0) && (
            <dl className="flex flex-col gap-1 text-[15px]">
              {w.synonyms.length > 0 && (
                <div>
                  <dt className="smallcaps inline text-muted">Similar: </dt>
                  <dd className="inline">{w.synonyms.join(', ')}</dd>
                </div>
              )}
              {w.antonyms.length > 0 && (
                <div>
                  <dt className="smallcaps inline text-muted">Opposite: </dt>
                  <dd className="inline">{w.antonyms.join(', ')}</dd>
                </div>
              )}
            </dl>
          )}

          {w.notes && <p className="rounded-md bg-paper-deep px-3 py-2 text-[15px]">{w.notes}</p>}

          <p className="text-sm text-muted">
            {source ? (
              <>
                Found in <i>{source}</i> ·{' '}
              </>
            ) : null}
            Saved {formatDate(w.savedAt)}
            {quizzed > 0 && (
              <>
                {' '}· Quiz: {w.timesRight} right, {w.timesWrong} wrong
              </>
            )}
          </p>

          <div className="flex gap-4 text-[15px]">
            <Link to={`/words/${w.id}/edit`} className="text-green underline underline-offset-2">
              Edit
            </Link>
            <button type="button" onClick={onDelete} className="text-muted underline underline-offset-2 hover:text-green">
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
