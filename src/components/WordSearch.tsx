import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { suggestWords } from '../lib/suggest'
import { field } from './ui'

/**
 * The "Type a word…" box, with suggestions as you type.
 * ↑ ↓ to move through them, Enter to pick one, Esc to close.
 */
export default function WordSearch({
  value,
  onChange,
  onPick,
  disabled,
  inputRef,
  inNotebook,
  id = 'lookup',
  label = 'Word to look up',
  placeholder = 'Type a word…',
  autoFocus = true,
  size = 'text-2xl',
  enterKeyHint = 'search',
}: {
  value: string
  onChange: (text: string) => void
  /** Called when a suggestion is chosen. */
  onPick: (word: string) => void
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  /** True if the word is already saved, so the list can say so. */
  inNotebook: (word: string) => boolean
  id?: string
  label?: string
  placeholder?: string
  autoFocus?: boolean
  /** Text size class for the box. */
  size?: string
  enterKeyHint?: 'search' | 'go'
}) {
  const listId = useId()
  const [typed, setTyped] = useState('') // only what you typed triggers suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const requestId = useRef(0)

  // Ask for suggestions a moment after you stop typing.
  useEffect(() => {
    const q = typed.trim()
    const id = ++requestId.current
    if (q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const words = await suggestWords(q, fetch, controller.signal)
      if (id !== requestId.current) return
      const list = words.filter((w) => w.toLowerCase() !== q.toLowerCase())
      setSuggestions(list)
      setActive(-1)
      setOpen(list.length > 0)
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [typed])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const pick = (word: string) => {
    requestId.current++
    close()
    setSuggestions([])
    onPick(word)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(suggestions[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        className={`${field} font-display ${size}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setTyped(e.target.value)
          if (e.target.value.trim().length < 2) close()
        }}
        onKeyDown={onKeyDown}
        onBlur={close}
        onFocus={() => suggestions.length > 0 && typed === value && setOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint={enterKeyHint}
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!open}
        className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-line bg-card shadow-md"
      >
        {suggestions.map((s, i) => (
          <li
            key={s}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown (not click) so the input keeps focus and the list doesn't close first
            onMouseDown={(e) => {
              e.preventDefault()
              pick(s)
            }}
            onMouseEnter={() => setActive(i)}
            className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 font-display text-xl ${
              i === active ? 'bg-paper-deep text-green' : ''
            }`}
          >
            <span>{s}</span>
            {inNotebook(s) && <span className="font-body text-sm text-muted">in your notebook</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
