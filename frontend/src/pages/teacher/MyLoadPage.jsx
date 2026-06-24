import { useState, useMemo } from 'react'
import { GraduationCap, BookOpen, CheckCircle2, Clock, XCircle, AlertTriangle, Plus, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import { getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

// ─── Design tokens ────────────────────────────────────────────────────────────
const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'
// ─────────────────────────────────────────────────────────────────────────────

function LoadBar({ used, max }) {
  const pct  = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const over  = used > max
  const warn  = pct >= 80 && !over
  const color = over ? '#DC2626' : warn ? '#D97706' : MID_GREEN
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(3,56,38,0.5)' }}>Teaching load this term</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{used} / {max} units</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: over ? '#DC2626' : warn ? '#D97706' : `linear-gradient(90deg,${FOREST},${MID_GREEN})`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 10,
      background: `${color}0D`, border: `1px solid ${color}28`,
      flex: 1, minWidth: 100,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: FOREST, lineHeight: 1, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'rgba(3,56,38,0.45)', marginTop: 2 }}>{label}</p>
      </div>
    </div>
  )
}

export default function MyLoadPage() {
  const { account }   = useAuth()
  const { term, facultyById, subjectsById, assignmentsForFaculty, requestOverload, getPendingOverloadOffersForTeacher, respondToTeacherOverloadOffer } = useData()
  const [showOverloadRequest, setShowOverloadRequest] = useState(false)
  const [requestedUnits, setRequestedUnits] = useState('')
  const [requestReason, setRequestReason] = useState('')

  const fac       = facultyById[account.facultyId]
  const semLabel  = term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'
  const mine      = assignmentsForFaculty(account.facultyId)
    .filter(a => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem)

  const approved  = mine.filter(a => a.status === 'approved')
  const pending   = mine.filter(a => a.status === 'pending')
  const rejected  = mine.filter(a => a.status === 'rejected')

  const approvedUnits = approved.reduce((sum, a) => {
    const s = subjectsById[a.subjectId]
    return sum + (s ? s.lec + s.lab : 0)
  }, 0)
  const maxUnits = fac ? getFacultyMaxUnits(fac) : 18
  const pendingOffers = useMemo(() => getPendingOverloadOffersForTeacher(account.facultyId), [account.facultyId, getPendingOverloadOffersForTeacher])

  function handleRequestOverload() {
    if (!requestedUnits || requestedUnits <= 0) return
    requestOverload({ facultyId: account.facultyId, requestedUnits: Number(requestedUnits), reason: requestReason, requestType: 'teacher-self' }, account)
    setRequestedUnits('')
    setRequestReason('')
    setShowOverloadRequest(false)
  }

  function handleOfferResponse(offerId, response, reason) {
    respondToTeacherOverloadOffer(offerId, response, reason, account)
  }

  if (!fac) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: 'rgba(3,56,38,0.4)', fontSize: 13 }}>Faculty record not found.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Profile + load summary card ─────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        {/* Green header band */}
        <div style={{
          background: `linear-gradient(105deg,${FOREST} 0%,${MID_GREEN} 100%)`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.05, pointerEvents: 'none' }} />

          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)',
            boxShadow: `0 0 0 2.5px ${GOLD}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '0.05em',
          }}>
            {[fac.fn?.[0], fac.ln?.[0]].filter(Boolean).join('').toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>
              {fac.fn} {fac.ln}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(220,252,231,0.65)' }}>
              {fac.spec || 'No specialization on file'} · {fac.type}
            </p>
          </div>

          <div style={{ padding: '6px 12px', borderRadius: 9, background: 'rgba(217,180,74,0.15)', border: `1px solid ${GOLD}45`, flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Faculty</p>
            <p style={{ margin: '1px 0 0', fontSize: 11, color: 'rgba(220,252,231,0.7)', textAlign: 'right' }}>AY {term.ay} · {semLabel}</p>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Load bar */}
          <LoadBar used={approvedUnits} max={maxUnits} />

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatPill icon={CheckCircle2} label="Approved"       value={approved.length} color="#059669" />
            <StatPill icon={Clock}        label="Pending review" value={pending.length}  color="#D97706" />
            <StatPill icon={XCircle}      label="Rejected"       value={rejected.length} color="#DC2626" />
            <StatPill icon={BookOpen}     label="Total subjects" value={mine.length}     color={MID_GREEN} />
          </div>
        </div>
      </div>

      {/* ── Overload Request Section ───────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Request overload card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid rgba(217,180,74,0.25)',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(217,180,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={15} style={{ color: '#B45309' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>Request Overload</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>Ask program head to accept extra units</p>
            </div>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {approvedUnits >= maxUnits && !showOverloadRequest ? (
              <>
                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(217,180,74,0.08)', border: '1px solid rgba(217,180,74,0.18)' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#B45309', fontWeight: 600 }}>You're at maximum capacity ({approvedUnits}/{maxUnits} units). Request overload to take more subjects.</p>
                </div>
                <button
                  onClick={() => setShowOverloadRequest(true)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Request Overload
                </button>
              </>
            ) : approvedUnits >= maxUnits && showOverloadRequest ? (
              <>
                <input
                  type="number"
                  value={requestedUnits}
                  onChange={e => setRequestedUnits(e.target.value)}
                  placeholder="How many extra units?"
                  min="1"
                  max="6"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(3,56,38,0.15)',
                    fontSize: 12,
                  }}
                />
                <textarea
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  placeholder="Optional: Reason for request..."
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(3,56,38,0.15)',
                    fontSize: 12,
                    fontFamily: 'system-ui',
                    minHeight: 50,
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowOverloadRequest(false)
                      setRequestedUnits('')
                      setRequestReason('')
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
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
                    onClick={handleRequestOverload}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#FEF3C7',
                      color: '#92400E',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Submit Request
                  </button>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(3,56,38,0.4)' }}>You still have capacity ({approvedUnits}/{maxUnits} units)</p>
            )}
          </div>
        </div>

        {/* Pending offers card */}
        {pendingOffers.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid rgba(16,185,129,0.25)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={15} style={{ color: MID_GREEN }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>Overload Offers</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>{pendingOffers.length} offer(s) awaiting your response</p>
              </div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingOffers.map(offer => {
                const [responding, setResponding] = useState(false)
                const [reason, setReason] = useState('')
                return (
                  <div key={offer.id} style={{ padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: FOREST }}>+{offer.requestedUnits} units offered</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(3,56,38,0.45)' }}>From program head</p>
                      </div>
                    </div>
                    {offer.reason && (
                      <div style={{ padding: 8, borderRadius: 6, background: 'rgba(3,56,38,0.03)', marginBottom: 10 }}>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.6)', fontStyle: 'italic' }}>{offer.reason}</p>
                      </div>
                    )}
                    {!responding ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setResponding(true)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#D1FAE5',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          <ThumbsUp size={12} style={{ display: 'inline', marginRight: 4 }} /> Accept
                        </button>
                        <button
                          onClick={() => setResponding(true)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          <ThumbsDown size={12} style={{ display: 'inline', marginRight: 4 }} /> Decline
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          placeholder="Optional: Reason for your decision..."
                          style={{
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(3,56,38,0.15)',
                            fontSize: 11,
                            fontFamily: 'system-ui',
                            minHeight: 40,
                            resize: 'vertical',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              setResponding(false)
                              setReason('')
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(3,56,38,0.15)',
                              background: '#fff',
                              color: FOREST,
                              fontWeight: 700,
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              handleOfferResponse(offer.id, 'rejected', reason)
                              setResponding(false)
                              setReason('')
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              fontWeight: 700,
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => {
                              handleOfferResponse(offer.id, 'accepted', reason)
                              setResponding(false)
                              setReason('')
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#D1FAE5',
                              color: '#059669',
                              fontWeight: 700,
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: mine.length > 0 ? '1px solid rgba(3,56,38,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(3,56,38,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={15} style={{ color: MID_GREEN }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>My Subjects This Term</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>AY {term.ay} · {semLabel} Semester</p>
          </div>
        </div>

        {mine.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(3,56,38,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} style={{ color: 'rgba(3,56,38,0.2)' }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(3,56,38,0.35)' }}>
              No subjects assigned to you yet this term.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.25)' }}>
              The Admin-in-Charge will assign your load and submit it for Program Head approval.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(3,56,38,0.03)', borderBottom: '1px solid rgba(3,56,38,0.08)' }}>
                  {['Subject', 'Section', 'Units', 'Status', 'Note'].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mine.map((a, idx) => {
                  const subj = subjectsById[a.subjectId]
                  const units = subj ? subj.lec + subj.lab : 0
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: idx < mine.length - 1 ? '1px solid rgba(3,56,38,0.06)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,180,74,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)'}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontWeight: 700, color: FOREST }}>{subj?.code}</span>
                        <span style={{ color: 'rgba(3,56,38,0.5)', marginLeft: 6, fontSize: 12 }}>{subj?.title}</span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: FOREST }}>{a.section}</span>
                        <span style={{ fontSize: 11, color: 'rgba(3,56,38,0.38)', marginLeft: 4 }}>({programLabel(subj?.prog)})</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: MID_GREEN,
                          background: 'rgba(15,107,60,0.08)',
                          border: '1px solid rgba(15,107,60,0.18)',
                          borderRadius: 6, padding: '2px 8px',
                        }}>
                          {units} {units === 1 ? 'unit' : 'units'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <StatusBadge status={a.status} />
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(3,56,38,0.4)', maxWidth: 200 }}>
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
