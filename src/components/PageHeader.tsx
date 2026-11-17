import type { ReactNode } from 'react'

export default function PageHeader({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-2 border-b border-line pb-5">
      {kicker && <span className="smallcaps text-sm text-muted">{kicker}</span>}
      <h1 className="text-5xl">{title}</h1>
      {children && <div className="text-muted">{children}</div>}
    </header>
  )
}
