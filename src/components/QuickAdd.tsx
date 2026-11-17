import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { btn, field } from './ui'

/** One box on Home: type a word, press Enter, land on Add with it looked up. */
export default function QuickAdd() {
  const [word, setWord] = useState('')
  const navigate = useNavigate()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const w = word.trim()
    if (w) navigate(`/add?word=${encodeURIComponent(w)}`)
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <label htmlFor="quick-add" className="sr-only">
        Add a word
      </label>
      <input
        id="quick-add"
        className={`${field} font-display text-xl`}
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Found a new word?"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
      />
      <button type="submit" className={btn.primary} disabled={!word.trim()}>
        Add
      </button>
    </form>
  )
}
