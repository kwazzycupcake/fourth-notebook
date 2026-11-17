import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <EmptyState illustration="book" title="This page isn't in the notebook" actions={<ButtonLink to="/">Go home</ButtonLink>} />
  )
}
