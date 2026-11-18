import { useState } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '../components/Button'
import Illustration from '../components/Illustration'
import PageHeader from '../components/PageHeader'
import { btn } from '../components/ui'
import { usePageTitle } from '../lib/usePageTitle'
import { useNotebook } from '../store/context'
import { useSync, type SyncApi } from '../store/syncContext'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export default function Account() {
  usePageTitle('Sync')
  const sync = useSync()

  if (!sync.available) {
    return (
      <>
        <PageHeader kicker="Your data" title="Sync" />
        <p className="text-muted">Sync isn't set up in this version of the app. Your words are saved in this browser.</p>
      </>
    )
  }

  return (
    <>
      <PageHeader kicker="Your data" title="Sync your notebook">
        <p>One notebook on your phone and every computer. Add a word on one, and it's on the others a moment later.</p>
      </PageHeader>
      {sync.status === 'starting' ? (
        <p className="text-muted" role="status">
          Checking whether you're signed in…
        </p>
      ) : sync.user ? (
        <SignedIn sync={sync} />
      ) : (
        <SignedOut sync={sync} />
      )}
    </>
  )
}

function SignedOut({ sync }: { sync: SyncApi }) {
  const { words } = useNotebook()
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Illustration name="notebooks" className="w-28 shrink-0" decorative />
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl">Sign in to sync</h2>
          <p className="text-muted">
            {words.length > 0
              ? `The ${plural(words.length, 'word')} on this device will be added to your account.`
              : 'Sign in on each device with the same Google account.'}
          </p>
          <div>
            <button
              type="button"
              className={btn.primary}
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void sync.signIn().finally(() => setBusy(false))
              }}
            >
              {busy ? 'Opening Google…' : 'Continue with Google'}
            </button>
          </div>
          {sync.error && (
            <p role="alert" className="rounded-md border border-green px-4 py-3">
              {sync.error}
            </p>
          )}
        </div>
      </section>

      <hr className="border-line" />
      <Privacy />
    </div>
  )
}

function SignedIn({ sync }: { sync: SyncApi }) {
  const { user, status, pending, lastSyncedAt, error } = sync
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<'out' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const line =
    status === 'syncing'
      ? 'Syncing…'
      : status === 'offline'
        ? pending > 0
          ? `You're offline. ${plural(pending, 'change')} will sync when you're back online.`
          : "You're offline. Changes will sync when you're back online."
        : status === 'error'
          ? (error ?? 'Sync failed.')
          : pending > 0
            ? `${plural(pending, 'change')} waiting to sync…`
            : lastSyncedAt
              ? `Everything is synced. Last checked at ${clock(lastSyncedAt)}.`
              : 'Everything is synced.'

  return (
    <div className="flex flex-col gap-10">
      {message && (
        <p role="alert" className="rounded-md border border-green px-4 py-3">
          {message}
        </p>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Illustration name="notebooks" className="w-28 shrink-0" decorative />
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl">{user?.name ? `Signed in as ${user.name}` : 'Signed in'}</h2>
          {user?.email && <p className="text-muted">{user.email}</p>}
          <p role="status" className="flex items-center gap-2">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${status === 'synced' && pending === 0 ? 'bg-green' : 'border border-green'}`}
            />
            {line}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn.secondary} onClick={sync.syncNow} disabled={status === 'syncing'}>
              Sync now
            </button>
            <button
              type="button"
              className={btn.quiet}
              disabled={busy !== null}
              onClick={async () => {
                setBusy('out')
                setMessage(null)
                const result = await sync.signOut()
                setBusy(null)
                if (!result.ok) setMessage(result.error)
              }}
            >
              {busy === 'out' ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          <p className="text-sm text-muted">
            Signing out removes your words from this device. They stay safe in your account: sign in again to bring them
            back.
          </p>
        </div>
      </section>

      <hr className="border-line" />
      <Privacy />

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">Delete your account</h2>
        <p className="text-muted">
          Deletes your account and every word and quiz result in it, from the server and so from your other devices. The
          copy on this device stays, and you can keep using the app without signing in.
        </p>
        {confirmDelete ? (
          <div className="flex flex-col gap-3 rounded-lg border border-green bg-card p-5">
            <p>
              <b>This can't be undone.</b> Download a backup first if you might want your words later.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={btn.primary}
                disabled={busy !== null}
                onClick={async () => {
                  setBusy('delete')
                  setMessage(null)
                  const result = await sync.deleteAccount()
                  setBusy(null)
                  setConfirmDelete(false)
                  setMessage(result.ok ? 'Your account and everything in it has been deleted.' : result.error)
                }}
              >
                {busy === 'delete' ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <ButtonLink to="/backup" variant="secondary">
                Download a backup
              </ButtonLink>
              <button type="button" className={btn.quiet} onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button type="button" className={btn.quiet + ' px-0 underline underline-offset-2'} onClick={() => setConfirmDelete(true)}>
              Delete my account…
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function Privacy() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl">What's stored, and who can see it</h2>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px]">
        <li>Your words, meanings, notes and quiz results, so every device has them.</li>
        <li>Your name and email from Google, only to know it's you. Never your Google password.</li>
        <li>
          No other user can see your notebook: each one is locked to its own account. Nothing is sold, shared or shown
          to advertisers.
        </li>
        <li>Without signing in, everything stays in this browser, just as before.</li>
        <li>You can delete your account, and everything in it, at any time.</li>
      </ul>
      <p className="text-[15px]">
        <Link to="/privacy" className="text-green underline underline-offset-2">
          Read the full privacy policy →
        </Link>
      </p>
    </section>
  )
}
