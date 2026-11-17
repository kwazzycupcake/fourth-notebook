import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function Library() {
  return (
    <>
      <PageHeader kicker="Your lexicon" title="Library" />
      <EmptyState
        illustration="book"
        title="No words yet"
        actions={<ButtonLink to="/add">Add a word</ButtonLink>}
      >
        <p>Every word you save appears here, A to Z, with search and filters.</p>
      </EmptyState>
    </>
  )
}
