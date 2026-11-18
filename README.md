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
Words are stored in your browser, not on GitHub. Use Backup & restore to move them between devices.
