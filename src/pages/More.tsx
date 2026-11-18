import { usePageTitle } from '../lib/usePageTitle'
import { Link } from 'react-router'
import Illustration from '../components/Illustration'
import PageHeader from '../components/PageHeader'

const links = [
  { to: '/story', title: 'Our story', note: 'The first three vocabulary copies' },
  { to: '/backup', title: 'Backup & restore', note: 'Keep a copy of your notebook as a file' },
]

export default function More() {
  usePageTitle('More')
  return (
    <>
      <PageHeader title="More" />
      <ul className="flex flex-col">
        {links.map((l) => (
          <li key={l.to} className="border-b border-line">
            <Link to={l.to} className="group flex items-baseline justify-between gap-4 py-4">
              <span>
                <span className="block font-display text-2xl font-semibold text-green">{l.title}</span>
                <span className="text-muted">{l.note}</span>
              </span>
              <span aria-hidden className="text-green transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 flex flex-col items-center gap-3 text-center text-sm text-muted">
        <Illustration name="newspaper" className="w-24" decorative />
        <p className="max-w-sm">
          Your words are saved in this browser only, never on a server. Download a backup now and then.
        </p>
        <p className="max-w-sm">
          The app counts visits anonymously with{' '}
          <a href="https://www.goatcounter.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-green">
            GoatCounter
          </a>
          : no cookies, and never the words you save.
        </p>
        <p className="max-w-sm">
          Definitions come from the{' '}
          <a href="https://dictionaryapi.dev" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-green">
            Free Dictionary API
          </a>
          , based on{' '}
          <a href="https://en.wiktionary.org" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-green">
            Wiktionary
          </a>{' '}
          (CC BY-SA). Word suggestions come from{' '}
          <a href="https://www.datamuse.com/api/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-green">
            Datamuse
          </a>
          .
        </p>
      </section>
    </>
  )
}
