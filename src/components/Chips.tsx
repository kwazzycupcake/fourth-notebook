/** A row of toggle buttons. Tapping the selected one clears it. */
export default function Chips<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
}: {
  options: { value: T; label: string }[]
  value: T | ''
  onChange: (value: T | '') => void
  labelledBy: string
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? '' : o.value)}
            className={`rounded-full border px-3 py-1 text-[15px] transition-colors ${
              on ? 'border-green bg-green text-paper' : 'border-line bg-card text-ink hover:border-green'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
