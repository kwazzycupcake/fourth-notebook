import { usePageTitle } from '../lib/usePageTitle'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  usePageTitle('Not found')
  return (
    <EmptyState illustration="book" title="This page isn't in the notebook" actions={<ButtonLink to="/">Go home</ButtonLink>} />
  )
}
