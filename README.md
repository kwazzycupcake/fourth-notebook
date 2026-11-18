# The Fourth Notebook

A personal dictionary that quizzes you back. My father filled three notebooks with words he found in the newspaper; this is the fourth.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/fourth-notebook/

To try it on your phone, connect it to the same Wi-Fi and open the "Network" address that `npm run dev` prints.

## Other commands

- `npm test` runs the tests
- `npm run lint` checks the code
- `npm run build` builds the site into `dist/`

## Deploying

Publishing is manual for now: on GitHub, open Actions → "Deploy to GitHub Pages" → Run workflow
(Pages must be set to "GitHub Actions" under Settings → Pages). See `.github/workflows/deploy.yml`.
Words are stored in your browser, not on GitHub. Signing in (below) keeps them in step across devices.

## Sign in to sync (Supabase)

Optional. Without these settings the app works exactly the same, saved in the browser only.

1. Create a free project at https://supabase.com, then run `supabase/schema.sql` in its SQL Editor.
2. Turn on Google under Authentication → Sign In / Providers, with a Google OAuth client.
3. Under Authentication → URL Configuration, allow `http://localhost:5173/fourth-notebook/**`
   and `https://kwazzycupcake.github.io/fourth-notebook/**`.
4. Put the project URL and publishable key in `.env.local` (not committed):

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   For the published site, add the same two as repository *variables* (Settings → Secrets and variables → Actions).
   The publishable key is meant to be public: row-level security makes sure each person can only read their own rows.

How sync works is explained at the top of `src/lib/sync.ts`.
