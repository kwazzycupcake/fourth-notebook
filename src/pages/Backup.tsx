import { trackEvent } from '../lib/analytics'
import { usePageTitle } from '../lib/usePageTitle'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router'
import Illustration from '../components/Illustration'
import PageHeader from '../components/PageHeader'
import { SAMPLE_WORDS } from '../lib/sampleWords'
import { backupFilename, mergeNotebooks, parseBackup, serializeBackup, type ParsedBackup } from '../lib/storage'
import type { Notebook } from '../lib/types'
import { useNotebook } from '../store/context'
import { useSync } from '../store/syncContext'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

const btn = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-[15px] transition-colors disabled:opacity-50'
const primary = `${btn} bg-green text-paper hover:bg-green-deep`
const secondary = `${btn} border border-green text-green hover:bg-paper-deep`

function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/html' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Backup() {
  usePageTitle('Backup & restore')
  const { notebook, words, replaceNotebook, markBackedUp, addWord } = useNotebook()
  const sync = useSync()
  const { user } = sync
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Extract<ParsedBackup, { ok: true }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleDownload = () => {
    download(serializeBackup(notebook), backupFilename())
    markBackedUp()
    trackEvent('backup-downloaded')
    setMessage(`Backup downloaded with ${plural(words.length, 'word')}.`)
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets you pick the same file again
    if (!file) return
    setMessage(null)
    const result = parseBackup(await file.text())
    if (result.ok) {
      setError(null)
      setPending(result)
    } else {
      setPending(null)
      setError(result.error)
    }
  }

  const apply = (mode: 'merge' | 'replace') => {
    if (!pending) return
    const next: Notebook =
      mode === 'merge'
        ? mergeNotebooks(notebook, pending.notebook)
        : { ...pending.notebook, settings: notebook.settings, lastBackupAt: notebook.lastBackupAt }
    replaceNotebook(next)
    setPending(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage(
      mode === 'merge'
        ? `Merged. Your notebook now has ${plural(next.words.length, 'word')}.`
        : `Restored ${plural(next.words.length, 'word')} from the backup.`,
    )
  }

  return (
    <>
      <PageHeader kicker="Your data" title="Backup & restore">
        <p>
          {user
            ? 'Your words sync to your account. A backup file is an extra copy you keep yourself.'
            : 'Your words are saved in this browser only. A backup file keeps a copy safe, in case you clear your browser.'}
        </p>
      </PageHeader>

      <div className="flex flex-col gap-10">
        {message && (
          <p role="status" className="rounded-md bg-paper-deep px-4 py-3 text-green">
            {message}
          </p>
        )}

        {/* Started without signing in? Say plainly that nothing needs moving. */}
        {sync.available && !user && words.length > 0 && (
          <section className="flex flex-col gap-2 rounded-lg border border-line bg-card p-5">
            <h2 className="text-2xl">Want your words on your phone too?</h2>
            <p>
              Just <Link to="/account" className="text-green underline underline-offset-2">sign in to sync</Link>. The{' '}
              {plural(words.length, 'word')} already in this browser are added to your account automatically, then
              show up on every device you sign in on. No need to download or upload anything.
            </p>
            <p className="text-[15px] text-muted">
              Words you saved on another device without signing in come along too: sign in there with the same account
              and both notebooks join up.
            </p>
          </section>
        )}

        {/* Download */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Illustration name="notebooks" className="w-28 shrink-0" decorative />
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl">Download a backup</h2>
            <p className="text-muted">
              {plural(words.length, 'word')} in your notebook.{' '}
              {notebook.lastBackupAt ? `Last backup: ${formatDate(notebook.lastBackupAt)}.` : 'No backup yet.'}
            </p>
            <div>
              <button type="button" className={primary} onClick={handleDownload} disabled={words.length === 0}>
                Download backup
              </button>
            </div>
            <p className="text-[15px] text-muted">
              The file opens in any web browser as a readable copy of your notebook, A to Z, and you can print it.
              Keep it somewhere safe, like your email or Google Drive.
            </p>
          </div>
        </section>

        <hr className="border-line" />

        {/* Restore */}
        <section className="flex flex-col gap-3">
          <h2 className="text-3xl">Restore from a backup</h2>
          <p className="text-muted">Choose a backup file you downloaded from this app.</p>
          <div>
            <input
              ref={fileInput}
              id="restore-file"
              type="file"
              accept="text/html,.html,.htm,application/json,.json"
              className="sr-only"
              onChange={handleFile}
            />
            <button type="button" className={secondary} onClick={() => fileInput.current?.click()}>
              Choose backup file
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-green px-4 py-3">
              {error}
            </p>
          )}

          {pending && (
            <div className="flex flex-col gap-4 rounded-lg border border-line bg-card p-5">
              <p>
                This backup has <b>{plural(pending.notebook.words.length, 'word')}</b>
                {pending.exportedAt && <> from {formatDate(pending.exportedAt)}</>}. Your notebook has{' '}
                <b>{plural(words.length, 'word')}</b>.
              </p>
              {pending.skipped > 0 && (
                <p className="text-muted">
                  {plural(pending.skipped, 'entry', 'entries')} in the file had no word or meaning and will be left out.
                </p>
              )}
              <div className="flex flex-col gap-2 text-[15px]">
                <p>
                  <b>Merge</b> keeps everything from both. If a word is in both, the most recently edited copy is kept.
                </p>
                <p>
                  <b>Replace</b> swaps your notebook for the backup. Words not in the backup are removed.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={primary} onClick={() => apply('merge')}>
                  Merge into my notebook
                </button>
                <button type="button" className={secondary} onClick={() => apply('replace')}>
                  Replace my notebook
                </button>
                <button type="button" className={`${btn} text-muted hover:text-green`} onClick={() => setPending(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {import.meta.env.DEV && (
          <section className="flex flex-col gap-3 rounded-lg border border-dashed border-line p-5">
            <span className="smallcaps text-sm text-muted">Only visible while developing</span>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  SAMPLE_WORDS.forEach((w) => addWord(w))
                  setMessage(`Added ${SAMPLE_WORDS.length} sample words.`)
                }}
              >
                Add sample words
              </button>
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  replaceNotebook({ ...notebook, words: [], quizzes: [] })
                  setMessage('Notebook cleared.')
                }}
              >
                Clear notebook
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
