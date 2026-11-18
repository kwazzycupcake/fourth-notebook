import { Link } from 'react-router'
import Illustration from './Illustration'

/** A short preview of "Our story", for the home page. */
export default function StoryTeaser({ drawing = true }: { drawing?: boolean }) {
  return (
    <Link
      to="/story"
      className="group flex flex-col gap-4 rounded-lg border border-line bg-card p-5 transition-colors hover:border-green sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      {drawing && <Illustration name="notebooks" className="w-24 shrink-0 self-center sm:w-28" decorative />}
      <div className="flex flex-col gap-2">
        <span className="smallcaps text-sm text-muted">Our story</span>
        <p className="font-hand text-2xl leading-snug text-green sm:text-[1.7rem]">“So, what does ubiquitous mean?”</p>
        <p className="text-[15px] text-ink">
          My father kept three vocabulary copies, filled with words from the newspaper, and quizzed us on them every
          evening. This is the fourth.
        </p>
        <span className="text-[15px] text-green">
          Read the story <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}
