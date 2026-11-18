/*
  Keeps this device's notebook in step with your account, while you're signed in.
  When it syncs: on sign-in, on opening the app, when you come back to the tab
  or get back online, every few minutes, and shortly after any change.
*/
import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { cloudAvailable, describeError, getClient, pullChanges, pushChanges, signInReturnUrl } from '../lib/cloud'
import { emptyNotebook } from '../lib/storage'
import { countPending, pendingChanges, pullFrom } from '../lib/sync'
import type { Notebook } from '../lib/types'
import type { Action } from './reducer'
import type { CloudUser, SyncApi, SyncStatus } from './syncContext'

const DEBOUNCE_MS = 1500
const EVERY_MS = 5 * 60_000

const toCloudUser = (u: User): CloudUser => ({
  id: u.id,
  email: u.email,
  name: (u.user_metadata?.full_name ?? u.user_metadata?.name) as string | undefined,
  avatarUrl: (u.user_metadata?.avatar_url ?? u.user_metadata?.picture) as string | undefined,
})

export function useCloudSync(notebook: Notebook, dispatch: Dispatch<Action>, latest: RefObject<Notebook>): SyncApi {
  const [user, setUser] = useState<CloudUser | null>(null)
  const [status, setStatus] = useState<SyncStatus>(cloudAvailable ? 'starting' : 'off')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const userRef = useRef<CloudUser | null>(null)
  const running = useRef(false)
  const again = useRef(false)

  // Who's signed in. Supabase also finishes a Google sign-in here when you land back on the app.
  useEffect(() => {
    const p = getClient()
    if (!p) return
    let stop: (() => void) | undefined
    let cancelled = false
    p.then((c) => {
      if (cancelled) return
      const { data } = c.auth.onAuthStateChange((_event, session) => {
        const next = session?.user ? toCloudUser(session.user) : null
        // Ignore token refreshes for the same person.
        setUser((prev) => (prev?.id === next?.id && prev?.email === next?.email ? prev : next))
        if (!next) setStatus('off')
      })
      stop = () => data.subscription.unsubscribe()
    }).catch(() => setStatus('off'))
    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  const runSync = useCallback(async () => {
    const u = userRef.current
    const p = getClient()
    if (!u || !p) return
    if (running.current) {
      again.current = true
      return
    }
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    running.current = true
    setStatus('syncing')
    try {
      const c = await p
      do {
        again.current = false
        const before = latest.current
        const since = before.sync?.userId === u.id ? pullFrom(before.sync.lastPulledAt) : undefined
        const remote = await pullChanges(c, since)
        if (userRef.current?.id !== u.id) return
        // flushSync so `latest` already includes the pulled words when we work out what to upload.
        flushSync(() => dispatch({ type: 'applyRemote', userId: u.id, ...remote }))

        const pushed = pendingChanges(latest.current)
        if (countPending(pushed) > 0) {
          await pushChanges(c, u.id, pushed)
          if (userRef.current?.id !== u.id) return
          flushSync(() => dispatch({ type: 'markPushed', userId: u.id, pushed }))
        }
      } while (again.current)
      setStatus('synced')
      setError(null)
      setLastSyncedAt(new Date().toISOString())
    } catch (e) {
      setStatus(navigator.onLine ? 'error' : 'offline')
      setError(describeError(e))
    } finally {
      running.current = false
    }
  }, [dispatch, latest])

  // Sync as soon as you're signed in.
  useEffect(() => {
    userRef.current = user
    if (!user) return
    const t = setTimeout(() => void runSync(), 0)
    return () => clearTimeout(t)
  }, [user, runSync])

  // Shortly after you change something.
  const pending = useMemo(() => (notebook.sync ? countPending(pendingChanges(notebook)) : 0), [notebook])
  const hasUser = user !== null
  useEffect(() => {
    if (!hasUser || pending === 0) return
    const t = setTimeout(() => void runSync(), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [hasUser, pending, notebook, runSync])

  // When you come back to the app, get back online, and every few minutes.
  useEffect(() => {
    if (!hasUser) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void runSync()
    }
    const onOnline = () => void runSync()
    const onOffline = () => setStatus('offline')
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void runSync()
    }, EVERY_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(timer)
    }
  }, [hasUser, runSync])

  const signIn = useCallback(async () => {
    const c = await getClient()
    if (!c) return
    const { error: err } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: signInReturnUrl() } })
    if (err) setError(describeError(err))
  }, [])

  const signOut = useCallback<SyncApi['signOut']>(async () => {
    const c = await getClient()
    if (!c) return { ok: true }
    // Upload anything still waiting first, so nothing is lost.
    if (countPending(pendingChanges(latest.current)) > 0) await runSync()
    const left = countPending(pendingChanges(latest.current))
    if (left > 0) {
      return {
        ok: false,
        error: `${left} ${left === 1 ? 'change hasn’t' : 'changes haven’t'} synced yet. Connect to the internet and try again, so nothing is lost.`,
      }
    }
    await c.auth.signOut({ scope: 'local' })
    userRef.current = null
    setUser(null)
    setStatus('off')
    setLastSyncedAt(null)
    dispatch({ type: 'load', notebook: { ...emptyNotebook(), settings: latest.current.settings } })
    return { ok: true }
  }, [dispatch, latest, runSync])

  const deleteAccount = useCallback<SyncApi['deleteAccount']>(async () => {
    const c = await getClient()
    if (!c) return { ok: true }
    const { error: err } = await c.rpc('delete_my_account')
    if (err) return { ok: false, error: describeError(err) }
    await c.auth.signOut({ scope: 'local' })
    userRef.current = null
    setUser(null)
    setStatus('off')
    setLastSyncedAt(null)
    // Keep the words on this device; just forget the account.
    const { sync: _sync, ...rest } = latest.current
    dispatch({ type: 'load', notebook: rest })
    return { ok: true }
  }, [dispatch, latest])

  return useMemo(
    () => ({
      available: cloudAvailable,
      user,
      status,
      pending,
      lastSyncedAt,
      error,
      signIn,
      signOut,
      deleteAccount,
      syncNow: () => void runSync(),
    }),
    [user, status, pending, lastSyncedAt, error, signIn, signOut, deleteAccount, runSync],
  )
}
