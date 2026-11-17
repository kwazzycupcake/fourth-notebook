import { Link } from 'react-router'
import type { ReactNode } from 'react'

const styles = {
  primary: 'bg-green text-paper hover:bg-green-deep',
  secondary: 'border border-green text-green hover:bg-paper-deep',
}

// A link styled as a button. Real <button> variants come with the forms in Step 3.
export function ButtonLink({
  to,
  children,
  variant = 'primary',
}: {
  to: string
  children: ReactNode
  variant?: keyof typeof styles
}) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-[15px] transition-colors ${styles[variant]}`}>
      {children}
    </Link>
  )
}
