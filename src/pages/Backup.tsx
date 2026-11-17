import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function Backup() {
  return (
    <>
      <PageHeader kicker="Your data" title="Backup & restore" />
      <EmptyState illustration="notebooks" title="Keep a copy safe">
        <p>
          Arrives in Step 2. Your words live in this browser, so a backup file lets you restore them on a new phone or
          after clearing your browser.
        </p>
      </EmptyState>
    </>
  )
}
