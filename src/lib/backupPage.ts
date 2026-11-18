/*
  The backup file people download: a web page (.html) that anyone can open by
  double-clicking. It shows the whole notebook, nicely set, like a printed
  dictionary. Hidden inside it is the same data as JSON, so the app can read the
  file back when you restore it.
*/
import type { Notebook, Word } from './types'
import { describeSource, POS_SHORT } from './labels'

/** Marks the hidden data inside the page. Don't change it: old backups use it. */
export const DATA_ID = 'fourth-notebook-data'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function entry(w: Word): string {
  const pos = w.partOfSpeech && POS_SHORT[w.partOfSpeech] ? ` <i>${POS_SHORT[w.partOfSpeech]}</i>` : ''
  const phon = w.phonetic ? ` <span class="muted">${esc(w.phonetic)}</span>` : ''
  const meanings =
    w.meanings.length === 1
      ? `<p>${esc(w.meanings[0])}</p>`
      : `<ol>${w.meanings.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>`
  const lines = [
    w.example && `<p class="ex">“${esc(w.example)}”</p>`,
    w.synonyms.length > 0 && `<p class="muted">Similar: ${esc(w.synonyms.join(', '))}</p>`,
    w.antonyms.length > 0 && `<p class="muted">Opposite: ${esc(w.antonyms.join(', '))}</p>`,
    w.notes && `<p class="muted">Note: ${esc(w.notes)}</p>`,
    describeSource(w.source) && `<p class="muted">Found in ${esc(describeSource(w.source)!)} · saved ${day(w.savedAt)}</p>`,
  ].filter(Boolean)
  return `<article><h3>${w.favourite ? '★ ' : ''}${esc(w.word)}${pos}${phon}</h3>${meanings}${lines.join('')}</article>`
}

export function renderBackupPage(notebook: Notebook, now = new Date()): string {
  const { sync: _sync, ...rest } = notebook
  const data = JSON.stringify({ app: 'fourth-notebook', exportedAt: now.toISOString(), ...rest })
    // Keep the data from ever ending the <script> early.
    .replace(/</g, '\\u003c')

  const words = [...notebook.words].sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }))
  const letters = new Map<string, Word[]>()
  for (const w of words) {
    const l = /^[a-z]/i.test(w.word) ? w.word[0].toUpperCase() : '#'
    letters.set(l, [...(letters.get(l) ?? []), w])
  }
  const body = [...letters]
    .map(([l, ws]) => `<section><h2>${l}</h2>${ws.map(entry).join('')}</section>`)
    .join('')
  const count = `${words.length} ${words.length === 1 ? 'word' : 'words'}`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Fourth Notebook · ${day(now.toISOString())}</title>
<style>
  body { background:#f5f0e6; color:#22302a; font:17px/1.55 Georgia, 'Times New Roman', serif; margin:0; padding:32px 16px 64px; }
  main { max-width:640px; margin:0 auto; }
  h1 { font-size:44px; line-height:1.05; color:#2e4a3b; margin:8px 0 4px; }
  h2 { font-size:32px; color:#2e4a3b; border-bottom:1px solid #d9d0bd; margin:36px 0 8px; padding-bottom:2px; }
  h3 { font-size:22px; color:#2e4a3b; margin:0; }
  h3 i, .muted { color:#6e7468; font-weight:normal; }
  article { padding:12px 0; border-bottom:1px solid #e8e2d3; }
  p, ol { margin:4px 0; } ol { padding-left:22px; }
  .muted { font-size:15px; }
  .ex { font-style:italic; }
  .kicker { font-variant:small-caps; letter-spacing:.06em; color:#6e7468; font-size:14px; border-bottom:1px solid #22302a; padding-bottom:6px; }
  .note { background:#e8e2d3; border-radius:8px; padding:14px 16px; margin:20px 0; font-size:15px; }
  @media print { .note { display:none } body { background:#fff } }
</style>
</head>
<body>
<main>
<div class="kicker">The Fourth Notebook · backup</div>
<h1>My notebook</h1>
<p class="muted">${count}, saved on ${day(now.toISOString())}.</p>
<div class="note">
  <b>Keep this file safe.</b> It's a complete copy of your notebook. To bring it back into the app, open
  The Fourth Notebook, go to <b>More → Backup &amp; restore</b>, tap <b>Choose backup file</b> and pick this file.
  You can also print it.
</div>
${body}
</main>
<script type="application/json" id="${DATA_ID}">${data}</script>
</body>
</html>
`
}

/** Pulls the hidden data back out of a backup page. Null if it isn't one. */
export function extractBackupData(html: string): string | null {
  const match = html.match(new RegExp(`<script[^>]*id="${DATA_ID}"[^>]*>([\\s\\S]*?)</script>`))
  return match ? match[1] : null
}
