import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function Import() {
  return (
    <>
      <PageHeader kicker="From your chats" title="Import from WhatsApp" />
      <EmptyState illustration="newspaper" title="Your saved words, in one go">
        <p>
          Arrives in Step 5. Paste your messages or upload WhatsApp's chat export. It reads your
          <span className="whitespace-nowrap"> “word: meaning” </span> and <span className="whitespace-nowrap">“eg-”</span> format and keeps the dates.
        </p>
      </EmptyState>
    </>
  )
}
