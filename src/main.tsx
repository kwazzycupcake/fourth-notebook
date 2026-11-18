import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

// Fonts are bundled with the app (no Google request), so they also work offline.
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/400-italic.css'
import '@fontsource/caveat/500.css'

import './index.css'
import App from './App.tsx'
import NotebookProvider from './store/NotebookProvider.tsx'
import { initAnalytics } from './lib/analytics.ts'

// The site lives under /fourth-notebook/ (see vite.config.ts); pages are /fourth-notebook/library etc.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

// Old links used /#/library. Turn them into /library so bookmarks keep working.
if (location.hash.startsWith('#/')) {
  history.replaceState(null, '', `${basename}${location.hash.slice(1)}`)
}

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotebookProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </NotebookProvider>
  </StrictMode>,
)
