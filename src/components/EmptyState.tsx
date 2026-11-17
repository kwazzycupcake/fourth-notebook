import type { ReactNode } from 'react'
import Illustration, { type IllustrationName } from './Illustration'

// Shown wherever a page has nothing to display yet.
export default function EmptyState({
  illustration,
  title,
  children,
  actions,
}: {
  illustration: IllustrationName
  title: string
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Illustration name={illustration} className="w-36" />
      <h2 className="text-3xl">{title}</h2>
      {children && <div className="max-w-md text-muted">{children}</div>}
      {actions && <div className="flex flex-wrap justify-center gap-3 pt-2">{actions}</div>}
    </div>
  )
}
