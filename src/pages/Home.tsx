import { useState } from 'react'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'
import { useNotebook } from '../store/context'

export default function Home() {
  const { words } = useNotebook()
  // Read the date once when the page opens, not on every re-render.
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  )
  const recent = [...words].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between border-b border-ink pb-2 text-sm">
        <span className="smallcaps">Notebook No. 6</span>
        <span className="smallcaps">{today}</span>
      </div>

      {words.length === 0 ? (
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
      ) : (
        <section className="flex flex-col gap-4">
          <p className="font-display text-3xl font-semibold text-green">
            {words.length} {words.length === 1 ? 'word' : 'words'} in your notebook
          </p>
          <div className="flex flex-col">
            <span className="smallcaps text-sm text-muted">Recently saved</span>
            <ul>
              {recent.map((w) => (
                <li key={w.id} className="border-b border-line py-2">
                  <span className="font-display text-xl font-semibold">{w.word}</span>
                  <span className="text-muted"> — {w.meanings[0]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/add">Add a word</ButtonLink>
            <ButtonLink to="/library" variant="secondary">Open library</ButtonLink>
          </div>
        </section>
      )}
    </div>
  )
}
