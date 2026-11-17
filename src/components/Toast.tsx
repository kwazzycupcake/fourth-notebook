import { useEffect } from 'react'

/** A short message above the bottom bar, with an optional action like Undo. */
export default function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 6000,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
  duration?: number
}) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, onClose, duration])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 sm:bottom-8">
      <div role="status" className="pointer-events-auto flex items-center gap-4 rounded-lg bg-ink px-4 py-3 text-paper shadow-lg">
        <span>{message}</span>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="font-semibold underline underline-offset-2">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
