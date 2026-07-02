import { useEffect } from 'react'
import { AlertTriangle, HelpCircle, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

/**
 * Uniform confirmation dialog matching the app's UI design system.
 *
 * Props:
 *   open        – boolean, controls visibility
 *   title       – string, bold heading (e.g. "Submit Assignments")
 *   message     – string | ReactNode, descriptive body text
 *   confirmLabel – string (default "Confirm")
 *   cancelLabel  – string (default "Cancel")
 *   variant     – "default" | "danger"  (danger tints confirm button red)
 *   onConfirm   – () => void
 *   onCancel    – () => void
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) {
  const { dark } = useTheme()

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const isDanger = variant === 'danger'
  const confirmBg = isDanger
    ? 'linear-gradient(105deg,#991b1b,#dc2626)'
    : `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className={`fixed left-1/2 top-1/2 z-[61] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl shadow-2xl ${
          dark ? 'bg-[#101F18]' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: isDanger ? 'linear-gradient(105deg,#7f1d1d,#991b1b)' : `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              {isDanger
                ? <AlertTriangle size={16} className="text-red-200" />
                : <HelpCircle size={16} className="text-white" />
              }
            </div>
            <p
              id="confirm-title"
              className="text-sm font-black text-white"
              style={{ fontFamily: "'EB Garamond',Georgia,serif" }}
            >
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 transition-colors"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {message && (
            <p
              id="confirm-message"
              className={`text-sm font-semibold leading-relaxed ${dark ? 'text-emerald-100/80' : 'text-emerald-950/70'}`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 border-t px-5 py-4 ${dark ? 'border-emerald-900/50' : 'border-emerald-950/10'}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-xl border px-4 py-2 text-sm font-black transition-colors ${
              dark
                ? 'border-emerald-800/50 text-emerald-200/70 hover:bg-emerald-900/30'
                : 'border-emerald-950/15 text-emerald-950/60 hover:bg-emerald-50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white transition-opacity hover:opacity-90"
            style={{ background: confirmBg }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
