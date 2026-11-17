import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'

const links = [
  { to: '/story', title: 'Our story', note: 'The first five notebooks' },
  { to: '/import', title: 'Import from WhatsApp', note: 'Bring in the words you already saved' },
  { to: '/backup', title: 'Backup & restore', note: 'Keep a copy of your notebook as a file' },
]

export default function More() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="flex flex-col">
        {links.map((l) => (
          <li key={l.to} className="border-b border-line">
            <Link to={l.to} className="group flex items-baseline justify-between gap-4 py-4">
              <span>
                <span className="block font-display text-2xl font-semibold text-green">{l.title}</span>
                <span className="text-muted">{l.note}</span>
              </span>
              <span aria-hidden className="text-green transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
