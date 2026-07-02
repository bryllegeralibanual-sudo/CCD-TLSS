import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

/**
 * Unified Toast notification component matching ConfirmDialog design.
 *
 * Props:
 *   toast          – null | { type, message } where type is 'success' | 'error' | 'warning' | 'info'
 *   onClose        – () => void, called when toast closes (manual or auto-dismiss)
 *   autoDismiss    – number (ms, default 3500)
 *   position       – 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' (default 'top-right')
 */
export default function Toast({ toast, onClose, autoDismiss = 3500, position = 'top-right' }) {
  const { dark } = useTheme()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (!toast) return
    setIsExiting(false)

    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onClose?.(), 200)
    }, autoDismiss)

    return () => clearTimeout(timer)
  }, [toast, autoDismiss, onClose])

  if (!toast) return null

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: '#10b981',
      bgColor: dark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
      borderColor: dark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
      textColor: dark ? '#86efac' : '#10b981',
    },
    error: {
      icon: AlertCircle,
      iconColor: '#ef4444',
      bgColor: dark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      borderColor: dark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
      textColor: dark ? '#fca5a5' : '#ef4444',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: '#f59e0b',
      bgColor: dark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
      borderColor: dark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)',
      textColor: dark ? '#fcd34d' : '#f59e0b',
    },
    info: {
      icon: Info,
      iconColor: '#3b82f6',
      bgColor: dark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
      borderColor: dark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
      textColor: dark ? '#93c5fd' : '#3b82f6',
    },
  }

  const config = typeConfig[toast.type] || typeConfig.info
  const Icon = config.icon

  const positionStyles = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
  }

  return (
    <div
      className={`fixed z-50 transform transition-all duration-200 ease-out ${
        isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
      style={positionStyles[position]}
    >
      <div
        className={`rounded-xl border backdrop-blur-sm shadow-lg flex items-start gap-3 px-4 py-3 max-w-sm ${
          dark ? 'bg-[#101F18]/95' : 'bg-white/95'
        }`}
        style={{ borderColor: config.borderColor }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 rounded-lg p-2 mt-0.5"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon size={18} color={config.iconColor} />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p
            className={`text-sm font-semibold leading-tight ${
              dark ? 'text-emerald-50' : 'text-emerald-950'
            }`}
          >
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            setIsExiting(true)
            setTimeout(() => onClose?.(), 200)
          }}
          className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-emerald-950/10"
          style={{
            color: dark ? 'rgba(209, 250, 229, 0.5)' : 'rgba(3, 56, 38, 0.4)',
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
