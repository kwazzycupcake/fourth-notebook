/*
  Talking to Supabase: sign-in, and reading/writing your rows.
  If the two VITE_SUPABASE_* settings are missing, sync is simply switched off
  and the app works exactly as before (saved in this browser only).
*/
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PendingChanges, RemoteQuiz, RemoteWord } from './sync'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const cloudAvailable = Boolean(URL && KEY)

let client: Promise<SupabaseClient> | null = null

/** The Supabase client, loaded only when sync is set up (keeps the app light otherwise). */
export function getClient(): Promise<SupabaseClient> | null {
  if (!cloudAvailable) return null
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL!, KEY!, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  )
  return client
}

/** Where Google sends you back to after signing in. */
export const signInReturnUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}account`

const PAGE = 1000

async function pullTable<T>(c: SupabaseClient, table: 'words' | 'quizzes', columns: string, since?: string): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    let q = c.from(table).select(columns).order('updated_at').order('id').range(from, from + PAGE - 1)
    if (since) q = q.gt('updated_at', since)
    const { data, error } = await q
    if (error) throw error
    rows.push(...(data as T[]))
    if (data.length < PAGE) return rows
  }
}

/** Everything changed on the server since `since` (or everything, the first time). */
export async function pullChanges(c: SupabaseClient, since?: string) {
  const [words, quizzes] = await Promise.all([
    pullTable<RemoteWord>(c, 'words', 'id,data,deleted,updated_at', since),
    pullTable<RemoteQuiz>(c, 'quizzes', 'id,data,updated_at', since),
  ])
  return { words, quizzes }
}

const chunks = <T>(list: T[], size = 500) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size))

/** Uploads new and edited words, deletes, and new quiz results. */
export async function pushChanges(c: SupabaseClient, userId: string, changes: PendingChanges) {
  const wordRows = [
    ...changes.upserts.map(({ word }) => ({ user_id: userId, id: word.id, data: word, deleted: false })),
    ...changes.deletes.map((id) => ({ user_id: userId, id, data: null, deleted: true })),
  ]
  for (const rows of chunks(wordRows)) {
    const { error } = await c.from('words').upsert(rows, { onConflict: 'user_id,id' })
    if (error) throw error
  }
  const quizRows = changes.quizzes.map((q) => ({ user_id: userId, id: q.id, data: q }))
  for (const rows of chunks(quizRows)) {
    const { error } = await c.from('quizzes').upsert(rows, { onConflict: 'user_id,id' })
    if (error) throw error
  }
}

/** A short message for people, from whatever went wrong. */
export function describeError(e: unknown): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return "You're offline. Changes will sync when you're back online."
  const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : ''
  if (/fetch|network/i.test(msg)) return "Couldn't reach the sync server. Changes will sync when it's back."
  if (/relation .* does not exist|schema cache/i.test(msg)) return 'The sync database isn’t set up yet (run supabase/schema.sql).'
  if (/JWT|token|auth/i.test(msg)) return 'Your sign-in has expired. Sign out and in again.'
  return msg || 'Something went wrong while syncing.'
}
