import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { APP_NAME } from '../config'
import { trackPage } from '../lib/analytics'
import { useNotebook } from '../store/context'

/** Counts a page view whenever the page changes. Word ids are dropped so each edit page counts as one. */
function usePageViews() {
  const { pathname } = useLocation()
  useEffect(() => {
    const page = pathname.replace(/^\/words\/[^/]+\/edit$/, '/words/edit')
    trackPage(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${page}`)
  }, [pathname])
}

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean }

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)

const items: NavItem[] = [
  { to: '/', label: 'Home', end: true, icon: icon('M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z') },
  { to: '/library', label: 'Library', icon: icon('M12 7C10 5.5 7 5 4 5.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 5 14 5.5 12 7zM12 7v13') },
  { to: '/add', label: 'Add', icon: icon('M12 5v14M5 12h14') },
  { to: '/quiz', label: 'Quiz', icon: icon('M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z') },
  {
    to: '/more',
    label: 'More',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <circle cx="5" cy="12" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="19" cy="12" r="1.6" />
      </svg>
    ),
  },
]

export default function Layout() {
  const { saveError } = useNotebook()
  usePageViews()
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top bar: brand everywhere, links on desktop */}
      <header className="border-b border-line pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] py-3">
          <Link to="/" className="font-display text-2xl font-semibold text-green no-underline">
            {APP_NAME}
          </Link>
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `rounded-md px-3 py-1.5 text-[15px] transition-colors ${
                        isActive ? 'bg-paper-deep text-green' : 'text-muted hover:text-green'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-[max(1rem,env(safe-area-inset-left))] pb-28 pt-8 sm:pb-16">
        {saveError && (
          <p role="alert" className="mb-6 rounded-md border border-green bg-card px-4 py-3">
            {saveError}{' '}
            <Link to="/backup" className="text-green underline underline-offset-2">
              Go to Backup
            </Link>
          </p>
        )}
        <Outlet />
      </main>

      {/* Bottom bar on phones */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="grid grid-cols-5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-green' : 'text-muted'}`
                }
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full ${item.to === '/add' ? 'bg-green text-paper' : ''}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
