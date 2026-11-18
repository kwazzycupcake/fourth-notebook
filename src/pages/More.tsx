import type { ReactNode } from 'react'
import { Link } from 'react-router'
import Illustration from '../components/Illustration'
import PageHeader from '../components/PageHeader'
import { mailto } from '../config'
import { usePageTitle } from '../lib/usePageTitle'
import { useNotebook } from '../store/context'
import { useSync } from '../store/syncContext'

/** `href` instead of `to` for links that leave the app, like email. */
type Row = { to?: string; href?: string; title: string; note: string; badge?: ReactNode }

function backupNote(lastBackupAt: string | undefined): string {
  if (!lastBackupAt) return 'Save a copy of your notebook as a file'
  const days = Math.floor((Date.now() - Date.parse(lastBackupAt)) / 86_400_000)
  const when = days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  return `Last backup ${when}`
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="smallcaps font-body text-sm font-normal text-muted">{title}</h2>
      <ul className="overflow-hidden rounded-lg border border-line bg-card">
        {rows.map((r) => (
          <li key={r.title} className="border-t border-line first:border-t-0">
            <RowLink row={r}>
              <span className="min-w-0">
                <span className="block font-display text-2xl font-semibold leading-tight text-green">{r.title}</span>
                <span className="block truncate text-[15px] text-muted">{r.note}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {r.badge}
                <span aria-hidden className="text-green transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </RowLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

function RowLink({ row, children }: { row: Row; children: ReactNode }) {
  const cls = 'group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-paper-deep/60 sm:px-5'
  return row.href ? (
    <a href={row.href} className={cls}>
      {children}
    </a>
  ) : (
    <Link to={row.to ?? '/'} className={cls}>
      {children}
    </Link>
  )
}

const credit = 'underline underline-offset-2 hover:text-green'

export default function More() {
  usePageTitle('More')
  const sync = useSync()
  const { notebook } = useNotebook()

  const yourData: Row[] = [
    { to: '/backup', title: 'Backup & restore', note: backupNote(notebook.lastBackupAt) },
    { to: '/privacy', title: 'Privacy', note: 'What is stored, where, and who can see it' },
  ]
  const help: Row[] = [
    { href: mailto('The Fourth Notebook: feedback'), title: 'Send feedback', note: 'Report a bug, share an idea or ask a question' },
  ]
  const about: Row[] = [{ to: '/story', title: 'Our story', note: 'The first three vocabulary copies' }]

  return (
    <>
      <PageHeader title="More" />

      <div className="flex flex-col gap-8">
        {/* Sync lives in the account button at the top; on phones the story isn't in the bottom bar, so it's here. */}
        <div className="md:hidden">
          <Group title="About" rows={about} />
        </div>
        <Group title="Your data" rows={yourData} />
        <Group title="Help make it better" rows={help} />
      </div>

      <footer className="mt-14 flex flex-col items-center gap-4 text-center text-sm text-muted">
        <Illustration name="newspaper" className="w-20" decorative />
        <p className="font-hand text-2xl text-green">He filled three. This is the fourth.</p>
        <p className="max-w-sm">
          {sync.user
            ? 'Your words are saved on this device and in your account.'
            : 'Your words are saved in this browser' +
              (sync.available ? ' until you sign in to sync.' : '. Download a backup now and then.')}
        </p>
        <p className="max-w-sm">
          Definitions from the{' '}
          <a href="https://dictionaryapi.dev" target="_blank" rel="noreferrer" className={credit}>
            Free Dictionary API
          </a>{' '}
          (
          <a href="https://en.wiktionary.org" target="_blank" rel="noreferrer" className={credit}>
            Wiktionary
          </a>
          , CC BY-SA). Suggestions from{' '}
          <a href="https://www.datamuse.com/api/" target="_blank" rel="noreferrer" className={credit}>
            Datamuse
          </a>
          . Anonymous visit counts by{' '}
          <a href="https://www.goatcounter.com" target="_blank" rel="noreferrer" className={credit}>
            GoatCounter
          </a>
          .
        </p>
      </footer>
    </>
  )
}
