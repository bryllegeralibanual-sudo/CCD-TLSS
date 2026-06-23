import { useState } from 'react'
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle,
  Info, Clock, ChevronDown, ChevronUp, History,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

// ─── Design tokens ────────────────────────────────────────────────────────────
const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, sub, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(3,56,38,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: MID_GREEN }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>{title}</p>
          {sub && <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>{sub}</p>}
        </div>
      </div>
      {count !== undefined && (
        <span style={{
          minWidth: 24, height: 24, borderRadius: 99,
          background: count > 0 ? `rgba(217,180,74,0.15)` : 'rgba(3,56,38,0.07)',
          border: `1px solid ${count > 0 ? `rgba(217,180,74,0.35)` : 'rgba(3,56,38,0.12)'}`,
          color: count > 0 ? '#92620A' : 'rgba(3,56,38,0.4)',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 8px',
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

// Single pending card
function PendingCard({ a, subj, fac, check, finalized, onApprove, onReject }) {
  const [rejecting, setRejecting]   = useState(false)
  const [comment,   setComment]     = useState('')
  const [expanded,  setExpanded]    = useState(false)

  const hasNotes    = check?.notes?.length > 0
  const hasBlockers = check?.blockers?.length > 0

  function confirmReject() {
    if (!comment.trim()) return
    onReject(a.id, comment.trim())
    setRejecting(false)
    setComment('')
  }

  return (
    <div style={{
      borderRadius: 12,
      border: '1.5px solid rgba(3,56,38,0.11)',
      background: '#fff',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(3,56,38,0.05)',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Card top strip — gold left border accent */}
      <div style={{
        borderLeft: `3px solid ${GOLD}`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          {/* Subject */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>
              {subj?.code}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(3,56,38,0.6)', fontWeight: 500 }}>
              {subj?.title}
            </span>
          </div>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(3,56,38,0.5)', background: 'rgba(3,56,38,0.06)', borderRadius: 5, padding: '2px 7px' }}>
              {a.section}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(3,56,38,0.5)' }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: FOREST }}>
              {fac?.fn} {fac?.ln}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(3,56,38,0.38)' }}>
              {fac?.spec || 'No specialization on file'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusBadge status={a.status} />
          {(hasNotes || hasBlockers) && (
            <button
              onClick={() => setExpanded(v => !v)}
              aria-label="Toggle compatibility notes"
              style={{
                width: 28, height: 28, borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(3,56,38,0.05)',
                border: '1px solid rgba(3,56,38,0.10)',
                cursor: 'pointer', color: MID_GREEN,
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable compatibility notes */}
      {expanded && (hasNotes || hasBlockers) && (
        <div style={{ padding: '0 16px 14px 19px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {check.blockers?.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 11px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.16)' }}>
              <AlertTriangle size={12} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#991B1B' }}>{b}</p>
            </div>
          ))}
          {check.notes?.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 11px', borderRadius: 8, background: 'rgba(3,56,38,0.04)', border: '1px solid rgba(3,56,38,0.10)' }}>
              <Info size={12} style={{ color: MID_GREEN, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: FOREST }}>{n}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action zone */}
      {!finalized && (
        <div style={{ borderTop: '1px solid rgba(3,56,38,0.07)', padding: '12px 16px', background: 'rgba(3,56,38,0.015)' }}>
          {rejecting ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Reason for rejecting — the Admin-in-Charge will see this"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px', borderRadius: 9,
                  fontSize: 12, color: FOREST,
                  border: '1.5px solid rgba(220,38,38,0.3)',
                  outline: 'none', resize: 'vertical',
                  background: 'rgba(220,38,38,0.03)',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#DC2626'}
                onBlur={e  => e.target.style.borderColor = 'rgba(220,38,38,0.3)'}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={confirmReject}
                  disabled={!comment.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: comment.trim() ? 'pointer' : 'not-allowed',
                    background: comment.trim() ? '#DC2626' : 'rgba(220,38,38,0.15)',
                    color: comment.trim() ? '#fff' : 'rgba(220,38,38,0.4)',
                    border: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <XCircle size={13} /> Confirm rejection
                </button>
                <button
                  onClick={() => { setRejecting(false); setComment('') }}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'rgba(3,56,38,0.55)',
                    border: '1px solid rgba(3,56,38,0.15)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onApprove(a.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(3,56,38,0.2)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <CheckCircle2 size={13} /> Approve
              </button>
              <button
                onClick={() => setRejecting(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  background: 'rgba(220,38,38,0.07)',
                  color: '#B91C1C',
                  border: '1.5px solid rgba(220,38,38,0.22)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(220,38,38,0.13)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(220,38,38,0.07)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.22)' }}
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApprovalsPage() {
  const { account } = useAuth()
  const {
    term, isTermFinalized,
    subjectsById, facultyById,
    pendingForProgramHead, decidedForProgramHead,
    approveAssignment, rejectAssignment, checkCompatibility,
  } = useData()

  const finalized = isTermFinalized(term.ay, term.sem)
  const pending   = pendingForProgramHead(account)
  const decided   = decidedForProgramHead(account)

  function handleApprove(id) { approveAssignment(id, account) }
  function handleReject(id, comment) { rejectAssignment(id, account, comment) }

  const semLabel = term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Pending card ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        {/* Green header band */}
        <div style={{
          background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.05, pointerEvents: 'none' }} />
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardCheck size={16} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>
              Pending Your Review
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(220,252,231,0.65)', marginTop: 1 }}>
              {account.programs?.map(programLabel).join(', ')} · AY {term.ay} · {semLabel} Semester
            </p>
          </div>
          {pending.length > 0 && (
            <div style={{
              minWidth: 28, height: 28, borderRadius: 99,
              background: `rgba(217,180,74,0.22)`, border: `1px solid ${GOLD}60`,
              color: GOLD, fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 8px',
            }}>
              {pending.length}
            </div>
          )}
          {finalized && (
            <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(217,180,74,0.18)', border: `1px solid ${GOLD}50` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>Term Finalized</span>
            </div>
          )}
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {finalized && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                This term is already finalized by the Registrar — no further decisions are needed.
              </p>
            </div>
          )}

          {pending.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(3,56,38,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} style={{ color: MID_GREEN, opacity: 0.5 }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(3,56,38,0.4)' }}>
                All caught up — nothing waiting for your review.
              </p>
            </div>
          ) : (
            pending.map(a => {
              const subj  = subjectsById[a.subjectId]
              const fac   = facultyById[a.facultyId]
              const check = checkCompatibility({ facultyId: a.facultyId, subjectId: a.subjectId, section: a.section, excludeId: a.id })
              return (
                <PendingCard
                  key={a.id}
                  a={a} subj={subj} fac={fac} check={check}
                  finalized={finalized}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )
            })
          )}
        </div>
      </div>

      {/* ── Past decisions card ──────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: decided.length > 0 ? '1px solid rgba(3,56,38,0.08)' : 'none' }}>
          <SectionHeader
            icon={History}
            title="Your Past Decisions"
            sub={`${term.ay} · ${semLabel} Semester`}
            count={decided.length}
          />
        </div>

        {decided.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 20px' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(3,56,38,0.35)', fontWeight: 500 }}>
              No decisions recorded yet this term.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(3,56,38,0.03)', borderBottom: '1px solid rgba(3,56,38,0.08)' }}>
                  {['Subject', 'Section', 'Faculty', 'Decision', 'Comment'].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {decided.map((a, idx) => {
                  const subj = subjectsById[a.subjectId]
                  const fac  = facultyById[a.facultyId]
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: idx < decided.length - 1 ? '1px solid rgba(3,56,38,0.06)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)',
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: FOREST }}>{subj?.code}</span>
                        <span style={{ color: 'rgba(3,56,38,0.5)', marginLeft: 5, fontSize: 12 }}>{subj?.title}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(3,56,38,0.6)', whiteSpace: 'nowrap' }}>
                        {a.section}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: FOREST, whiteSpace: 'nowrap' }}>
                        {fac?.fn} {fac?.ln}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={a.status} />
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(3,56,38,0.45)', maxWidth: 220 }}>
                        {a.comment || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}