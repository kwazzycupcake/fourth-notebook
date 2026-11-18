import { usePageTitle } from '../lib/usePageTitle'
import { Link } from 'react-router'
import Illustration from '../components/Illustration'
import PageHeader from '../components/PageHeader'
import { useSync, type SyncApi } from '../store/syncContext'

function syncNote({ user, status, pending }: SyncApi): string {
  if (!user) return 'Sign in to keep your words on every device'
  if (status === 'offline') return 'Offline: changes will sync later'
  if (status === 'error') return 'Sync needs attention'
  if (status === 'syncing' || pending > 0) return 'Syncing…'
  return `Synced${user.email ? ` as ${user.email}` : ''}`
}

export default function More() {
  usePageTitle('More')
  const sync = useSync()
  const links = [
    ...(sync.available ? [{ to: '/account', title: 'Sync', note: syncNote(sync) }] : []),
    { to: '/story', title: 'Our story', note: 'The first three vocabulary copies' },
    { to: '/backup', title: 'Backup & restore', note: 'Keep a copy of your notebook as a file' },
  ]
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
          {sync.user
            ? 'Your words are saved on this device and in your account, which only you can read.'
            : `Your words are saved in this browser only, never on a server${sync.available ? ', unless you sign in to sync' : ''}. Download a backup now and then.`}
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
