import { createContext, useContext } from 'react'

export type SyncStatus =
  /** Sync isn't set up in this build, or you're signed out. */
  | 'off'
  /** Still checking whether you're signed in. */
  | 'starting'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error'

export type CloudUser = { id: string; email?: string; name?: string; avatarUrl?: string }

export type SyncApi = {
  /** False when this build has no Supabase settings; hide sign-in entirely. */
  available: boolean
  user: CloudUser | null
  status: SyncStatus
  /** Changes on this device not yet on the server. */
  pending: number
  lastSyncedAt: string | null
  error: string | null
  signIn: () => Promise<void>
  /** Signs out and removes the words from this device (they stay in your account). */
  signOut: () => Promise<{ ok: true } | { ok: false; error: string }>
  /** Deletes the account and everything in it. Keeps this device's copy. */
  deleteAccount: () => Promise<{ ok: true } | { ok: false; error: string }>
  syncNow: () => void
}

export const SyncContext = createContext<SyncApi | null>(null)

export function useSync(): SyncApi {
  const api = useContext(SyncContext)
  if (!api) throw new Error('useSync must be used inside <NotebookProvider>')
  return api
}
