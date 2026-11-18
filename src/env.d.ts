/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** e.g. https://abcd1234.supabase.co (Supabase → Project Settings → API) */
  readonly VITE_SUPABASE_URL?: string
  /** The publishable (public) key. Safe in the app: row-level security protects the data. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
