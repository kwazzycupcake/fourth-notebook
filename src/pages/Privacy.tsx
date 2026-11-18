import type { ReactNode } from 'react'
import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import { usePageTitle } from '../lib/usePageTitle'

// Plain-language privacy policy. Keep it true: update it whenever the app starts
// sending anything new anywhere. Google's sign-in screen links here.
const UPDATED = '18 November 2026'

const ext = 'underline underline-offset-2 hover:text-green'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-3xl">{title}</h2>
      {children}
    </section>
  )
}

export default function Privacy() {
  usePageTitle('Privacy')
  return (
    <>
      <PageHeader kicker="The small print, in plain words" title="Privacy">
        <p>Last updated {UPDATED}.</p>
      </PageHeader>

      <div className="mx-auto flex max-w-xl flex-col gap-10 text-[17px] leading-relaxed">
        <section className="rounded-lg bg-paper-deep p-5">
          <h2 className="mb-2 font-body text-sm font-normal smallcaps text-muted">The short version</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Your words are yours. Nothing is sold, shared for advertising, or used to train anything.</li>
            <li>Without signing in, your notebook never leaves this browser.</li>
            <li>If you sign in, your notebook is stored in a database only your account can read.</li>
            <li>You can delete everything, whenever you like.</li>
          </ul>
        </section>

        <Section title="If you don't sign in">
          <p>
            Your words, meanings, notes and quiz results are saved in your browser's own storage on this device. They
            are not sent to any server. If you clear your browser's data, they're gone, so download a backup now and
            then from <Link to="/backup" className={ext}>Backup &amp; restore</Link>.
          </p>
        </Section>

        <Section title="If you sign in to sync">
          <p>Signing in with Google lets the app keep the same notebook on all your devices. To do that it stores:</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Everything in your notebook: words, meanings, examples, notes, sources and quiz results.</li>
            <li>
              What Google shares when you sign in: your name, email address and profile picture link. Never your
              Google password, and the app can't see your Gmail, contacts or anything else in your Google account.
            </li>
          </ul>
          <p>
            This is kept with{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className={ext}>
              Supabase
            </a>
            , a database service, on servers in Tokyo, Japan. The database only gives a notebook to the account it
            belongs to, so other people using the app can never see yours.
          </p>
          <p>
            One honest caveat: as the person who runs the app, I can see the database through Supabase's dashboard.
            I won't look at your notebook unless you ask me to help fix a problem with it.
          </p>
        </Section>

        <Section title="Other services the app uses">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <b>Looking up words.</b> When you search for a word, that word (and nothing else about you) is sent to
              the{' '}
              <a href="https://dictionaryapi.dev" target="_blank" rel="noreferrer" className={ext}>
                Free Dictionary API
              </a>{' '}
              for its meaning and to{' '}
              <a href="https://www.datamuse.com/api/" target="_blank" rel="noreferrer" className={ext}>
                Datamuse
              </a>{' '}
              for spelling suggestions.
            </li>
            <li>
              <b>Visit counts.</b>{' '}
              <a href="https://www.goatcounter.com" target="_blank" rel="noreferrer" className={ext}>
                GoatCounter
              </a>{' '}
              counts page visits and a few actions (like "a word was added") anonymously. It uses no cookies and never
              receives your words or who you are.
            </li>
            <li>
              <b>Hosting.</b> The app's pages are served by{' '}
              <a href="https://docs.github.com/en/pages" target="_blank" rel="noreferrer" className={ext}>
                GitHub Pages
              </a>
              , which, like any website host, briefly handles your IP address to send you the page.
            </li>
            <li>
              <b>Signing in.</b> Google handles the sign-in itself, under{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className={ext}>
                Google's privacy policy
              </a>
              .
            </li>
          </ul>
          <p>There are no ads, no tracking cookies and no data brokers.</p>
        </Section>

        <Section title="Deleting your data">
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              <b>Delete one word:</b> delete it in the Library. If you're signed in, it's deleted from your account too.
            </li>
            <li>
              <b>Delete your account:</b> go to <Link to="/account" className={ext}>Sync</Link> and choose "Delete my
              account". Your sign-in and every word and quiz result in it are removed from the server straight away.
            </li>
            <li>
              <b>Remove it from a device:</b> sign out, or clear this site's data in your browser settings.
            </li>
          </ul>
        </Section>

        <Section title="Questions">
          <p>
            This is a small personal project, shared with friends and family. If you have a question about your data,
            ask the person who shared it with you, or open an issue on{' '}
            <a href="https://github.com/kwazzycupcake/fourth-notebook/issues" target="_blank" rel="noreferrer" className={ext}>
              GitHub
            </a>
            . If anything here changes, this page will say so, with a new date at the top.
          </p>
        </Section>
      </div>
    </>
  )
}
