import { useState } from 'react'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function Home() {
  // Read the date once when the page opens, not on every re-render.
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between border-b border-ink pb-2 text-sm">
        <span className="smallcaps">Notebook No. 6</span>
        <span className="smallcaps">{today}</span>
      </div>

      <EmptyState
        illustration="book"
        title="Your notebook is empty"
        actions={
          <>
            <ButtonLink to="/add">Add your first word</ButtonLink>
            <ButtonLink to="/import" variant="secondary">Import from WhatsApp</ButtonLink>
          </>
        }
      >
        <p>He filled five. This is the sixth.</p>
      </EmptyState>
    </div>
  )
}
