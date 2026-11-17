import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function AddWord() {
  return (
    <>
      <PageHeader kicker="A new entry" title="Add a word" />
      <EmptyState illustration="pen" title="Type a word, press Enter">
        <p>The quick-add form arrives in Step 3. It fills in the meaning, part of speech and an example for you.</p>
      </EmptyState>
    </>
  )
}
