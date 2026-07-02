import { useState, useRef, useEffect } from 'react'
import { Bell, X, AlertCircle, Clock, Zap, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import { PROGRAM_BY_CODE } from '../data/programs'

const MID_GREEN = '#0F6B3C'

export default function NotificationCenter({ dark, term }) {
  const { account } = useAuth()
  const { getCriticalAlerts, pendingForProgramHead, subjectsById } = useData()
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

  // Helper to get program display name
  const getProgramName = (programCode) => {
    const prog = PROGRAM_BY_CODE[programCode]
    return prog ? prog.label : programCode
  }

  // Generate notifications based on user role
  const generateNotifications = () => {
    const notifs = []

    if (!account || !term) return notifs

    // ADMIN notifications
    if (account.role === 'admin') {
      const alerts = getCriticalAlerts?.(term.ay, term.sem) || []
      
      // Handle alerts array structure
      if (Array.isArray(alerts)) {
        alerts.forEach((alert, idx) => {
          if (alert.type === 'overloaded') {
            notifs.push({
              id: `alert_overloaded_${idx}`,
              type: 'alert',
              title: '⚠️ Faculty Overloaded',
              message: alert.message,
              icon: AlertTriangle,
              color: 'red',
              timestamp: new Date(),
            })
          } else if (alert.type === 'near-capacity') {
            notifs.push({
              id: `alert_near_${idx}`,
              type: 'warning',
              title: '📊 Capacity Alert',
              message: alert.message,
              icon: Zap,
              color: 'amber',
              timestamp: new Date(),
            })
          } else if (alert.type === 'rejected-assignments') {
            notifs.push({
              id: `alert_rejected_${idx}`,
              type: 'alert',
              title: '❌ Assignments Rejected',
              message: alert.message,
              icon: AlertCircle,
              color: 'red',
              timestamp: new Date(),
            })
          } else if (alert.type === 'faculty-profile-updates') {
            notifs.push({
              id: `alert_updates_${idx}`,
              type: 'info',
              title: '👤 Profile Updates',
              message: alert.message,
              icon: CheckCircle2,
              color: 'green',
              timestamp: new Date(),
            })
          }
        })
      }
    }

    // PROGRAM HEAD notifications
    if (account.role === 'program_head') {
      const pending = pendingForProgramHead?.(account) || []
      
      if (pending.length > 0) {
        // Show summary
        notifs.push({
          id: `summary_pending`,
          type: 'info',
          title: '⏳ Pending Approvals',
          message: `You have ${pending.length} load assignment(s) awaiting your review`,
          icon: Clock,
          color: 'blue',
          timestamp: new Date(),
          isSummary: true,
        })

        // Show individual items with full details from subject
        pending.slice(0, 5).forEach((appr) => {
          const subject = subjectsById[appr.subjectId]
          const subjectCode = subject?.code || `Subject ${appr.subjectId}`
          const section = appr.section || 'Unknown Section'
          const programCode = subject?.prog
          const programName = programCode ? getProgramName(programCode) : 'Program'
          
          notifs.push({
            id: `approval_${appr.id}`,
            type: 'pending',
            title: '📋 Awaiting Approval',
            message: `Load for ${subjectCode}-${section} has been submitted to ${programName}. Waiting for your approval.`,
            icon: Clock,
            color: 'blue',
            timestamp: appr.submittedAt ? new Date(appr.submittedAt) : new Date(),
          })
        })
      }
    }

    // FACULTY/TEACHER notifications
    if (account.role === 'teacher') {
      // Teachers don't see administrative notifications
      // They would see personal assignment status, rejections, etc.
      // For now, teachers get minimal notifications
    }

    // REGISTRAR notifications
    if (account.role === 'registrar') {
      const alerts = getCriticalAlerts?.(term.ay, term.sem) || []
      
      // Registrars see all critical alerts
      if (Array.isArray(alerts)) {
        alerts.forEach((alert, idx) => {
          if (alert.type === 'pending-approvals') {
            notifs.push({
              id: `alert_pending_${idx}`,
              type: 'info',
              title: '⏳ Approvals Pending',
              message: alert.message,
              icon: Clock,
              color: 'blue',
              timestamp: new Date(),
            })
          } else if (alert.type === 'rejected-assignments') {
            notifs.push({
              id: `alert_rejected_${idx}`,
              type: 'alert',
              title: '❌ Assignments Rejected',
              message: alert.message,
              icon: AlertCircle,
              color: 'red',
              timestamp: new Date(),
            })
          }
        })
      }
    }

    return notifs
  }

  const notifications = generateNotifications()

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

  const getSubtext = (dark) => dark ? 'text-emerald-200/60' : 'text-gray-600'

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return 'Just now'
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

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
            width: 380,
            maxHeight: 520,
            borderRadius: 12,
            border: `1px solid ${dark ? 'rgba(15,107,60,0.4)' : 'rgba(3,56,38,0.1)'}`,
            background: dark ? '#0f1f18' : '#fff',
            boxShadow: dark
              ? '0 20px 25px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(15,107,60,0.2)'
              : '0 20px 25px -5px rgba(3,56,38,0.1), 0 0 0 1px rgba(3,56,38,0.05)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header with context */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${dark ? 'rgba(15,107,60,0.2)' : 'rgba(3,56,38,0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: dark ? 'rgba(15,107,60,0.08)' : 'rgba(3,56,38,0.02)',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 2px 0',
                  fontSize: 13,
                  fontWeight: 700,
                  color: dark ? '#fff' : '#10241A',
                  fontFamily: "'EB Garamond', Georgia, serif",
                }}
              >
                Notifications
              </h3>
              {term && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: dark ? 'rgba(209,250,229,0.5)' : 'rgba(3,56,38,0.5)',
                  }}
                >
                  AY {term.ay} · {term.sem} Semester
                </p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
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
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = dark ? '#d1fae5' : '#033826'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = dark ? 'rgba(209,250,229,0.5)' : 'rgba(3,56,38,0.4)'
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
                      padding: '12px 16px',
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 600,
                              color: dark ? '#fff' : '#10241A',
                            }}
                          >
                            {notif.title}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              color: dark ? 'rgba(209,250,229,0.5)' : 'rgba(3,56,38,0.5)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {formatTime(notif.timestamp)}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: getSubtext(dark),
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
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
                <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>No notifications</p>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>All caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: `1px solid ${dark ? 'rgba(15,107,60,0.2)' : 'rgba(3,56,38,0.06)'}`,
                background: dark ? 'rgba(15,107,60,0.05)' : 'rgba(3,56,38,0.02)',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setRead(new Set(notifications.map(n => n.id)))}
                title={`Mark ${unreadCount} as read`}
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
                  opacity: unreadCount === 0 ? 0.5 : 1,
                }}
                disabled={unreadCount === 0}
                onMouseEnter={(e) => {
                  if (unreadCount > 0) {
                    e.target.style.background = dark ? 'rgba(15,107,60,0.35)' : 'rgba(3,56,38,0.08)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = dark ? 'rgba(15,107,60,0.2)' : 'rgba(3,56,38,0.05)'
                }}
              >
                {unreadCount > 0 ? `Mark all as read (${unreadCount})` : 'All read'}
              </button>
              <button
                onClick={() => {
                  setRead(new Set())
                  setIsOpen(false)
                }}
                title="Close notifications"
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${dark ? 'rgba(15,107,60,0.3)' : 'rgba(3,56,38,0.1)'}`,
                  background: 'transparent',
                  color: dark ? 'rgba(209,250,229,0.5)' : 'rgba(3,56,38,0.5)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = dark ? 'rgba(15,107,60,0.15)' : 'rgba(3,56,38,0.04)'
                  e.target.style.color = dark ? 'rgba(209,250,229,0.8)' : 'rgba(3,56,38,0.7)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = dark ? 'rgba(209,250,229,0.5)' : 'rgba(3,56,38,0.5)'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
