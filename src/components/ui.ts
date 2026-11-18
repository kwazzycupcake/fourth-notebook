// Shared class names, so every button and field looks the same.

const btnBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export const btn = {
  primary: `${btnBase} bg-green text-paper hover:bg-green-deep`,
  secondary: `${btnBase} border border-green text-green hover:bg-paper-deep`,
  quiet: `${btnBase} text-muted hover:text-green`,
}

export const field =
  'w-full rounded-md border border-line bg-card px-3 py-2 text-[17px] text-ink placeholder:text-muted/70 transition-colors focus:border-green focus:outline-none'

export const label = 'smallcaps text-sm text-muted'

/** Compact dropdown for filter rows. */
export const select =
  'select-chevron h-10 max-w-full rounded-md border border-line bg-card pl-3 text-[15px] text-ink transition-colors hover:border-green focus:border-green focus:outline-none'

/** Toggle button that sits in the same row as `select`. */
export const chipToggle = (on: boolean) =>
  `inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[15px] transition-colors ${
    on ? 'border-green bg-green text-paper' : 'border-line bg-card hover:border-green'
  }`
