import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Search, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import { useTheme } from '../../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'rgba(217,180,74,0.12)', color: '#B45309', icon: Clock, label: 'Pending' },
    approved: { bg: 'rgba(16,185,129,0.12)', color: MID_GREEN, icon: CheckCircle2, label: 'Approved' },
    rejected: { bg: 'rgba(220,38,38,0.12)', color: '#DC2626', icon: XCircle, label: 'Rejected' },
  }
  const cfg = config[status] || config.pending
  const Icon = cfg.icon
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: cfg.bg }}>
      <Icon size={12} style={{ color: cfg.color }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}

function RequestCard({ request, faculty, onPhRespond }) {
  const [phReason, setPhReason] = useState('')
  const [responding, setResponding] = useState(false)

  function handleApprove() {
    onPhRespond(request.id, 'approved', phReason)
    setPhReason('')
    setResponding(false)
  }

  function handleReject() {
    onPhRespond(request.id, 'rejected', phReason)
    setPhReason('')
    setResponding(false)
  }

  return (
    <div style={{ borderRadius: 12, border: '1.5px solid rgba(3,56,38,0.12)', background: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: FOREST }}>{faculty?.fn} {faculty?.ln}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.5)' }}>{request.requestType === 'admin-to-ph' ? 'Admin requested' : 'Teacher self-requested'}</p>
        </div>
        <StatusBadge status={request.phStatus} />
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Request details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(3,56,38,0.04)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(3,56,38,0.5)', textTransform: 'uppercase' }}>Requested Units</p>
            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 900, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>{request.requestedUnits}</p>
          </div>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(3,56,38,0.04)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(3,56,38,0.5)', textTransform: 'uppercase' }}>Current Load</p>
            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 900, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>
              {faculty?.id ? `${getFacultyUnits([...JSON.parse(localStorage.getItem('ccd-tlss.assignments') || '[]')], 
                JSON.parse(localStorage.getItem('ccd-tlss.subjects') || '[]'),
                faculty.id,
                request.sem)} / {getFacultyMaxUnits(faculty)}` : '0 / 18'}
            </p>
          </div>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(3,56,38,0.04)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(3,56,38,0.5)', textTransform: 'uppercase' }}>Requested On</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: FOREST }}>
              {new Date(request.requestedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Reason */}
        {request.reason && (
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MessageSquare size={13} style={{ color: '#2563EB', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>Reason</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#1E40AF', lineHeight: 1.4 }}>{request.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Existing decision (if already responded) */}
        {request.phStatus !== 'pending' && (
          <div style={{
            padding: 12,
            borderRadius: 10,
            background: request.phStatus === 'approved' ? 'rgba(16,185,129,0.08)' : 'rgba(220,38,38,0.08)',
            border: request.phStatus === 'approved' ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(220,38,38,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {request.phStatus === 'approved' ? (
                <CheckCircle2 size={13} style={{ color: MID_GREEN, marginTop: 2, flexShrink: 0 }} />
              ) : (
                <XCircle size={13} style={{ color: '#DC2626', marginTop: 2, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: request.phStatus === 'approved' ? MID_GREEN : '#DC2626', textTransform: 'uppercase' }}>
                  {request.phStatus === 'approved' ? 'Approved' : 'Rejected'}
                </p>
                {request.phReason && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: request.phStatus === 'approved' ? '#047857' : '#991B1B', lineHeight: 1.4 }}>
                    {request.phReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teacher response (if PH approved) */}
        {request.phStatus === 'approved' && request.teacherStatus && (
          <div style={{
            padding: 12,
            borderRadius: 10,
            background: request.teacherStatus === 'accepted' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: request.teacherStatus === 'accepted' ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {request.teacherStatus === 'accepted' ? (
                <ThumbsUp size={13} style={{ color: '#22C55E', marginTop: 2, flexShrink: 0 }} />
              ) : (
                <ThumbsDown size={13} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: request.teacherStatus === 'accepted' ? '#22C55E' : '#EF4444', textTransform: 'uppercase' }}>
                  Teacher {request.teacherStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                </p>
                {request.teacherReason && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: request.teacherStatus === 'accepted' ? '#15803D' : '#DC2626', lineHeight: 1.4 }}>
                    {request.teacherReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Response form (if pending) */}
        {request.phStatus === 'pending' && !responding && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setResponding(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 9,
                border: 'none',
                background: 'rgba(3,56,38,0.08)',
                color: FOREST,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Respond
            </button>
          </div>
        )}

        {responding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, borderRadius: 10, background: 'rgba(3,56,38,0.03)' }}>
            <textarea
              value={phReason}
              onChange={e => setPhReason(e.target.value)}
              placeholder="Optional: Reason for your decision..."
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid rgba(3,56,38,0.15)',
                fontSize: 12,
                fontFamily: 'system-ui',
                resize: 'vertical',
                minHeight: 60,
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setResponding(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: '1px solid rgba(3,56,38,0.15)',
                  background: '#fff',
                  color: FOREST,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#D1FAE5',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OverloadRequestsPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const { term, facultyById, getPendingOverloadRequestsForPH, getPendingTeacherOverloadRequests, respondToOverloadRequest } = useData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('pending') // 'pending' | 'approved' | 'rejected' | 'all'

  const adminRequests = useMemo(() => getPendingOverloadRequestsForPH(account), [account, getPendingOverloadRequestsForPH])
  const teacherRequests = useMemo(() => getPendingTeacherOverloadRequests(account), [account, getPendingTeacherOverloadRequests])
  const allRequests = [...adminRequests, ...teacherRequests]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRequests
      .filter(r => filter === 'all' || r.phStatus === filter)
      .filter(r => !q || `${facultyById[r.facultyId]?.fn} ${facultyById[r.facultyId]?.ln}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
  }, [allRequests, filter, query, facultyById])

  const summary = useMemo(() => ({
    total: allRequests.length,
    pending: allRequests.filter(r => r.phStatus === 'pending').length,
    approved: allRequests.filter(r => r.phStatus === 'approved').length,
    rejected: allRequests.filter(r => r.phStatus === 'rejected').length,
  }), [allRequests])

  function handlePhRespond(requestId, response, reason) {
    respondToOverloadRequest(requestId, response, reason, account)
  }

  if (!account) return null

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ borderRadius: 16, border: '1px solid rgba(3,56,38,0.10)', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 4px rgba(3,56,38,0.06)' }}>
        <div style={{ padding: '16px 20px', background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif" }}>Overload Requests</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(220,252,231,0.7)' }}>Manage faculty overload requests from admins and teachers</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, padding: 16 }}>
          <div style={{ textAlign: 'center', padding: '12px 10px', borderRadius: 10, background: 'rgba(3,56,38,0.04)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.5)', textTransform: 'uppercase' }}>Total</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>{summary.total}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 10px', borderRadius: 10, background: 'rgba(217,180,74,0.12)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Pending</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: '#B45309', fontFamily: "'EB Garamond',Georgia,serif" }}>{summary.pending}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 10px', borderRadius: 10, background: 'rgba(16,185,129,0.12)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: MID_GREEN, textTransform: 'uppercase' }}>Approved</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: MID_GREEN, fontFamily: "'EB Garamond',Georgia,serif" }}>{summary.approved}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 10px', borderRadius: 10, background: 'rgba(220,38,38,0.12)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Rejected</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: '#DC2626', fontFamily: "'EB Garamond',Georgia,serif" }}>{summary.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px', borderTop: '1px solid rgba(3,56,38,0.08)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: filter === f ? 'none' : '1px solid rgba(3,56,38,0.15)',
                  background: filter === f ? FOREST : '#fff',
                  color: filter === f ? '#fff' : FOREST,
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'rgba(3,56,38,0.35)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search faculty name..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: 8,
                border: '1px solid rgba(3,56,38,0.15)',
                fontSize: 12,
              }}
            />
          </div>
        </div>
      </div>

      {/* Requests list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 12, background: 'rgba(3,56,38,0.03)' }}>
            <AlertTriangle size={32} style={{ color: 'rgba(3,56,38,0.2)', margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(3,56,38,0.4)' }}>No overload requests found</p>
          </div>
        ) : (
          filtered.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              faculty={facultyById[request.facultyId]}
              onPhRespond={handlePhRespond}
            />
          ))
        )}
      </div>
    </div>
  )
}
