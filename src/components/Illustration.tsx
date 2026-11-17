/*
  The six line drawings. Rules: one line weight, accent colour only,
  pages filled with the card colour, at most one per screen.
*/
export type IllustrationName = 'book' | 'notebooks' | 'pen' | 'newspaper' | 'tea' | 'sparkle'

const labels: Record<IllustrationName, string> = {
  book: 'An open book',
  notebooks: 'A stack of five notebooks',
  pen: 'A fountain pen',
  newspaper: 'A newspaper with one word circled',
  tea: 'A cup of tea',
  sparkle: 'A sparkle',
}

const fill = { fill: 'var(--color-card)' }

function Drawing({ name }: { name: IllustrationName }) {
  switch (name) {
    case 'book':
      return (
        <>
          <path d="M60 24C47 15 28 13 12 17V73C28 69 47 71 60 80C73 71 92 69 108 73V17C92 13 73 15 60 24Z" style={fill} />
          <path d="M60 24V80" />
          <path d="M22 30C32 28 42 29 51 33M22 40C32 38 42 39 51 43M22 50C30 48 38 49 45 52M69 33C78 29 88 28 98 30M69 43C78 39 88 38 98 40M69 53C76 50 82 49 90 50" />
          <path d="M88 14V38L93 33L98 38V15" style={fill} />
        </>
      )
    case 'notebooks':
      return (
        <>
          <rect x="22" y="72" width="76" height="10" rx="2" style={fill} />
          <rect x="27" y="62" width="72" height="10" rx="2" style={fill} />
          <rect x="19" y="52" width="75" height="10" rx="2" style={fill} />
          <rect x="25" y="42" width="71" height="10" rx="2" style={fill} />
          <rect x="22" y="32" width="73" height="10" rx="2" style={fill} />
          <path d="M34 72v10M39 62v10M31 52v10M37 42v10M34 32v10" />
          <path d="M44 25L88 19M88 19L94 18.5L89 22.5Z" />
          <path d="M104 10v10M99 15h10" />
        </>
      )
    case 'pen':
      return (
        <>
          <g transform="rotate(-32 60 45)">
            <rect x="22" y="38" width="54" height="14" rx="7" style={fill} />
            <path d="M46 38v14M52 38v14" />
            <path d="M76 40L98 45L76 50Z" style={fill} />
            <path d="M80 45H92" />
          </g>
          <path d="M24 80C34 72 42 86 52 78S70 72 80 80" />
        </>
      )
    case 'newspaper':
      return (
        <>
          <rect x="18" y="14" width="84" height="62" rx="3" style={fill} />
          <path d="M28 25H92" strokeWidth={3} />
          <path d="M28 38H56M28 46H56M28 54H56M28 62H50M64 38H92M64 46H92" />
          <rect x="64" y="54" width="28" height="12" rx="1" />
          <ellipse cx="42" cy="46" rx="18" ry="6.5" transform="rotate(-4 42 46)" />
        </>
      )
    case 'tea':
      return (
        <>
          <path d="M30 44H82V56C82 70 70 78 56 78C42 78 30 70 30 56Z" style={fill} />
          <path d="M82 50C95 48 96 66 81 64" />
          <path d="M20 83H92" />
          <path d="M46 36C42 30 50 26 46 19M58 36C54 30 62 26 58 16M70 36C66 30 74 26 70 19" />
        </>
      )
    case 'sparkle':
      return (
        <>
          <path d="M58 16C60 34 64 38 82 41C64 44 60 48 58 66C56 48 52 44 34 41C52 38 56 34 58 16Z" style={fill} />
          <path d="M90 18v10M85 23h10M28 64v8M24 68h8" />
        </>
      )
  }
}

export default function Illustration({
  name,
  className = 'w-32',
  decorative = false,
}: {
  name: IllustrationName
  className?: string
  decorative?: boolean
}) {
  return (
    <svg
      viewBox="0 0 120 90"
      className={`text-green ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : labels[name]}
    >
      <Drawing name={name} />
    </svg>
  )
}
