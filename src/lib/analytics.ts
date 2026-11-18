/*
  Anonymous visit and usage counts with GoatCounter (https://www.goatcounter.com).
  No cookies, no personal data, and never the words you save: only page
  addresses and a few named actions like "word-added".

  - Only runs on the published site (not while developing).
  - GoatCounter also ignores localhost and home-network addresses itself.
  - To stop counting your own visits, open the site once with
    #toggle-goatcounter at the end of the address.

  Dashboard: https://fourthnotebook.goatcounter.com
*/

const ENDPOINT = 'https://fourthnotebook.goatcounter.com/count'
const SCRIPT = 'https://gc.zgo.at/count.js'

type GoatCounter = {
  count: (vars: { path: string; title?: string; event?: boolean }) => void
}

declare global {
  interface Window {
    goatcounter?: GoatCounter & { no_onload?: boolean }
  }
}

/** Calls made before the script has loaded wait here. */
const queue: Parameters<GoatCounter['count']>[0][] = []

function send(vars: Parameters<GoatCounter['count']>[0]) {
  if (!import.meta.env.PROD) return
  const gc = window.goatcounter
  if (gc?.count) gc.count(vars)
  else queue.push(vars)
}

export function initAnalytics() {
  if (!import.meta.env.PROD || typeof document === 'undefined') return
  // We count pages ourselves as you move around the app (see trackPage).
  window.goatcounter = { ...(window.goatcounter ?? {}), no_onload: true } as Window['goatcounter']
  const s = document.createElement('script')
  s.async = true
  s.src = SCRIPT
  s.dataset.goatcounter = ENDPOINT
  s.onload = () => queue.splice(0).forEach((v) => window.goatcounter?.count?.(v))
  document.head.appendChild(s)
}

/** One page view, e.g. "/fourth-notebook/library". */
export function trackPage(path: string) {
  send({ path })
}

export type AppEvent = 'word-added' | 'quiz-finished' | 'backup-downloaded'

/** One use of a feature. Shows under "Events" in the dashboard. */
export function trackEvent(name: AppEvent) {
  send({ path: name, event: true })
}
