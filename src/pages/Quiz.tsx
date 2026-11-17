import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function Quiz() {
  return (
    <EmptyState
      illustration="tea"
      title="The evening quiz"
      actions={<ButtonLink to="/add">Add a word</ButtonLink>}
    >
      <p className="font-hand text-2xl text-green">“So, what does it mean?”</p>
      <p className="mt-3">Save at least four words and the quiz opens.</p>
    </EmptyState>
  )
}
