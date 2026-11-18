import { useEffect } from 'react'
import { APP_NAME } from '../config'

/** Sets the browser tab title, e.g. "Library · The Fourth Notebook". */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
