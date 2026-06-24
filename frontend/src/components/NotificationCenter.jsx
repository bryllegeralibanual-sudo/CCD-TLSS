import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react'

const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

export default function NotificationCenter({ alerts, approvals, dark, term }) {
  const [isOpen, setIsOpen] = useState(false)
  const [read, setRead] = useState(new Set())
  const ref = useRef(null)

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate notifications from alerts and approvals
  const notifications = [
    // Critical alerts
    ...(alerts?.missing_faculty || []).map(fac => ({
      id: `missing_${fac.id}`,
      type: 'alert',
      title: 'Missing Faculty',
      message: `No faculty assigned for ${fac.code} - ${fac.section}`,
      icon: AlertCircle,
      color: 'red',
      timestamp: new Date(),
    })),
    ...(alerts?.near_capacity || []).map(fac => ({
      id: `near_${fac.id}`,
      type: 'warning',
      title: 'Capacity Warning',
      message: `${fac.name} is near capacity (${fac.current}/${fac.max} units)`,
      icon: Zap,
      color: 'amber',
      timestamp: new Date(),
    })),
    // Pending approvals
    ...(approvals || []).slice(0, 5).map(appr => ({
      id: `approval_${appr.id}`,
      type: 'pending',
      title: 'Pending Approval',
      message: `${appr.subject_code} - ${appr.faculty_name} awaiting review`,
      icon: Clock,
      color: 'blue',
      timestamp: new Date(appr.submitted_at),
    })),
  ]

  const unreadCount = notifications.filter(n => !read.has(n.id)).length

  const getIconColor = (color, dark) => {
    const colorMap = {
      red: dark ? '#f87171' : '#ef4444',
      amber: dark ? '#fbbf24' : '#f59e0b',
      blue: dark ? '#60a5fa' : '#3b82f6',
      green: dark ? '#4ade80' : '#22c55e',
    }
    return colorMap[color] || MID_GREEN
  }

  const getBg = (dark) => dark ? 'bg-[#101F18]' : 'bg-white'
  const getBorder = (dark) => dark ? 'border-emerald-900/30' : 'border-gray-100'
  const getText = (dark) => dark ? 'text-emerald-50' : 'text-gray-900'
  const getSubtext = (dark) => dark ? 'text-emerald-200/60' : 'text-gray-600'

  return (
    <div ref={ref} className="relative" style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(3,56,38,0.14)'}`,
          background: isOpen
            ? (dark ? 'rgba(15,107,60,0.5)' : 'rgba(3,56,38,0.08)')
            : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(3,56,38,0.04)'),
          cursor: 'pointer',
          color: dark ? 'rgba(209,250,229,0.7)' : 'rgba(3,56,38,0.6)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = dark ? 'rgba(15,107,60,0.5)' : 'rgba(3,56,38,0.2)'
          e.target.style.background = dark ? 'rgba(15,107,60,0.3)' : 'rgba(3,56,38,0.06)'
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.target.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(3,56,38,0.14)'
            e.target.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(3,56,38,0.04)'
          }
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${dark ? '#101F18' : '#fff'}`,
            }}
          >
            {Math.min(unreadCount, 9)}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 360,
            maxHeight: 480,
            borderRadius: 12,
            border: `1px solid ${dark ? 'rgba(15,107,60,0.4)' : 'rgba(3,56,38,0.1)'}`,
            background: dark ? '#0f1f18' : '#fff',
            boxShadow: dark
              ? '0 20px 25px -5px rgba(0,0,0,0.5)'
              : '0 20px 25px -5px rgba(3,56,38,0.1)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${dark ? 'rgba(15,107,60,0.2)' : 'rgba(3,56,38,0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: dark ? '#fff' : '#10241A',
                fontFamily: "'EB Garamond', Georgia, serif",
              }}
            >
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: dark ? 'rgba(209,250,229,0.5)' : 'rgba(3,56,38,0.4)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Notifications list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const Icon = notif.icon
                const isRead = read.has(notif.id)
                return (
                  <div
                    key={notif.id}
                    onClick={() => setRead(new Set([...read, notif.id]))}
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${dark ? 'rgba(15,107,60,0.1)' : 'rgba(3,56,38,0.04)'}`,
                      background: isRead
                        ? 'transparent'
                        : dark
                        ? 'rgba(15,107,60,0.15)'
                        : 'rgba(3,56,38,0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = dark
                        ? 'rgba(15,107,60,0.2)'
                        : 'rgba(3,56,38,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isRead
                        ? 'transparent'
                        : dark
                        ? 'rgba(15,107,60,0.15)'
                        : 'rgba(3,56,38,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: getIconColor(notif.color, dark) + '1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={14} color={getIconColor(notif.color, dark)} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: '0 0 2px 0',
                            fontSize: 12,
                            fontWeight: 600,
                            color: dark ? '#fff' : '#10241A',
                          }}
                        >
                          {notif.title}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: getSubtext(dark),
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notif.message}
                        </p>
                      </div>
                      {!isRead && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: MID_GREEN,
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: getSubtext(dark),
                  fontSize: 12,
                }}
              >
                <Bell size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: `1px solid ${dark ? 'rgba(15,107,60,0.2)' : 'rgba(3,56,38,0.06)'}`,
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setRead(new Set(notifications.map(n => n.id)))}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: dark ? 'rgba(15,107,60,0.2)' : 'rgba(3,56,38,0.05)',
                  color: dark ? 'rgba(209,250,229,0.7)' : 'rgba(3,56,38,0.6)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = dark
                    ? 'rgba(15,107,60,0.35)'
                    : 'rgba(3,56,38,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = dark
                    ? 'rgba(15,107,60,0.2)'
                    : 'rgba(3,56,38,0.05)'
                }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
