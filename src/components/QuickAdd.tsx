import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { wordKey } from '../lib/words'
import { useNotebook } from '../store/context'
import WordSearch from './WordSearch'
import { btn } from './ui'

/** One box on Home: type a word (with suggestions), press Enter, land on Add with it looked up. */
export default function QuickAdd() {
  const [word, setWord] = useState('')
  const navigate = useNavigate()
  const { words } = useNotebook()
  const saved = useMemo(() => new Set(words.map((w) => wordKey(w.word))), [words])

  const go = (w: string) => {
    const t = w.trim()
    if (t) navigate(`/add?word=${encodeURIComponent(t)}`)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    go(word)
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <WordSearch
        id="quick-add"
        label="Add a word"
        placeholder="Found a new word?"
        size="text-xl"
        autoFocus={false}
        enterKeyHint="go"
        value={word}
        onChange={setWord}
        onPick={go}
        inNotebook={(w) => saved.has(wordKey(w))}
      />
      <button type="submit" className={btn.primary} disabled={!word.trim()}>
        Add
      </button>
    </form>
  )
}
