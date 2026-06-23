import { useMemo, useState } from 'react'
import {
  Briefcase, ChevronDown, AlertTriangle, CheckCircle2,
  Info, Send, Trash2, BookOpen, Users, Filter,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'
import { canTeachProgram, getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

// ─── Design tokens ────────────────────────────────────────────────────────────
const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'
// ─────────────────────────────────────────────────────────────────────────────

// ── Styled select ─────────────────────────────────────────────────────────────
function GreenSelect({ label, value, onChange, children, disabled }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            padding: '8px 32px 8px 11px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            color: FOREST,
            background: focused ? 'rgba(217,180,74,0.06)' : 'rgba(3,56,38,0.04)',
            border: `1.5px solid ${focused ? GOLD : 'rgba(3,56,38,0.14)'}`,
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {children}
        </select>
        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: FOREST, opacity: 0.4 }} />
      </div>
    </div>
  )
}

// ── Load bar ──────────────────────────────────────────────────────────────────
function LoadBar({ used, max }) {
  const pct  = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const over  = used > max
  const warn  = pct >= 80 && !over
  const color = over ? '#DC2626' : warn ? '#D97706' : MID_GREEN
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(3,56,38,0.55)' }}>Current load</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{used}/{max} units</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(3,56,38,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: MID_GREEN }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function LoadAssignmentPage() {
  const { account }  = useAuth()
  const {
    term, isTermFinalized,
    faculty, subjects, assignments,
    subjectsById, facultyById,
    createAssignment, withdrawAssignment, checkCompatibility,
  } = useData()

  const allSections = useMemo(() => getSections(), [])
  const [progCode,    setProgCode]    = useState(PROGRAMS[0].code)
  const [yr,          setYr]          = useState(1)
  const [sectionLbl,  setSectionLbl]  = useState('A')
  const [subjectId,   setSubjectId]   = useState('')
  const [facultyId,   setFacultyId]   = useState('')
  const [feedback,    setFeedback]    = useState(null)
  const [filterProg,  setFilterProg]  = useState('ALL')
  const [filterStatus,setFilterStatus]= useState('ALL')

  const finalized        = isTermFinalized(term.ay, term.sem)
  const sectionsForProg  = allSections.filter(s => s.prog === progCode && s.yr === yr)
  const section          = `${progCode} ${yr}${sectionLbl}`
  const subjectOptions   = subjects.filter(s => s.prog === progCode && s.yr === yr && s.sem === term.sem)
  const facultyOptions   = faculty.filter(f => canTeachProgram(f, progCode))
  const check            = subjectId && facultyId
    ? checkCompatibility({ facultyId: Number(facultyId), subjectId: Number(subjectId), section })
    : null
  const selectedFaculty  = facultyId ? facultyById[Number(facultyId)] : null
  const usedUnits        = selectedFaculty
    ? getFacultyUnits(assignments.filter(a => a.ay === term.ay), subjectsById, selectedFaculty.id, term.sem)
    : 0
  const maxUnits         = selectedFaculty ? getFacultyMaxUnits(selectedFaculty) : 0

  const termAssignments = assignments.filter(a => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem)
  const filteredAssignments = termAssignments.filter(a => {
    const subj = subjectsById[a.subjectId]
    if (filterProg   !== 'ALL' && subj?.prog !== filterProg)   return false
    if (filterStatus !== 'ALL' && a.status   !== filterStatus) return false
    return true
  })

  function handleSubmit() {
    if (!subjectId || !facultyId) return
    setFeedback(null)
    const result = createAssignment({ facultyId: Number(facultyId), subjectId: Number(subjectId), section }, account)
    if (result.ok) {
      setFeedback({ type: 'success', text: `Sent for review — ${subjectsById[Number(subjectId)].code} assigned to ${facultyById[Number(facultyId)].ln}.` })
      setSubjectId('')
      setFacultyId('')
    } else {
      setFeedback({ type: 'error', text: result.blockers.join(' ') })
    }
  }

  const canSubmit = subjectId && facultyId && !finalized && !(check && !check.ok)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Assignment form card ─────────────────────────────────────────── */}
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
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.05, pointerEvents: 'none' }} />
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={16} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>
              Assign a Subject Load
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(220,252,231,0.65)', marginTop: 1 }}>
              AY {term.ay} · {term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} Semester
            </p>
          </div>
          {finalized && (
            <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 99, background: 'rgba(217,180,74,0.18)', border: `1px solid ${GOLD}50` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>Term Finalized</span>
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          {/* Finalized warning */}
          {finalized && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16 }}>
              <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                {term.ay} {term.sem} semester is finalized. New assignments are disabled until the Registrar reopens it.
              </p>
            </div>
          )}

          {/* 5-column filter grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
            <GreenSelect label="Program" value={progCode} onChange={e => { setProgCode(e.target.value); setSubjectId(''); setFacultyId(''); setSectionLbl('A') }} disabled={finalized}>
              {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </GreenSelect>
            <GreenSelect label="Year Level" value={yr} onChange={e => { setYr(Number(e.target.value)); setSubjectId('') }} disabled={finalized}>
              {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </GreenSelect>
            <GreenSelect label="Section" value={sectionLbl} onChange={e => setSectionLbl(e.target.value)} disabled={finalized}>
              {sectionsForProg.map(s => <option key={s.lbl} value={s.lbl}>{s.full}</option>)}
            </GreenSelect>
            <GreenSelect label="Subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={finalized}>
              <option value="">— Select subject —</option>
              {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.code} – {s.title}</option>)}
            </GreenSelect>
            <GreenSelect label="Faculty" value={facultyId} onChange={e => setFacultyId(e.target.value)} disabled={finalized}>
              <option value="">— Select faculty —</option>
              {facultyOptions.map(f => <option key={f.id} value={f.id}>{f.ln}, {f.fn}</option>)}
            </GreenSelect>
          </div>

          {/* Faculty load bar */}
          {selectedFaculty && (
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(3,56,38,0.04)', border: '1px solid rgba(3,56,38,0.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: FOREST }}>{selectedFaculty.fn} {selectedFaculty.ln}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)', marginTop: 2 }}>{selectedFaculty.spec || 'No specialization on file'} · {selectedFaculty.type}</p>
                </div>
              </div>
              <LoadBar used={usedUnits} max={maxUnits} />
            </div>
          )}

          {/* Compatibility notes */}
          {check && (check.blockers.length > 0 || check.notes.length > 0) && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {check.blockers.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 9, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}>
                  <AlertTriangle size={13} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: '#991B1B' }}>{b}</p>
                </div>
              ))}
              {check.notes.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 9, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.12)' }}>
                  <Info size={13} style={{ color: MID_GREEN, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: FOREST }}>{n}</p>
                </div>
              ))}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 9,
              background: feedback.type === 'success' ? 'rgba(16,185,129,0.07)' : 'rgba(220,38,38,0.06)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.22)' : 'rgba(220,38,38,0.18)'}`,
            }}>
              {feedback.type === 'success'
                ? <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0, marginTop: 1 }} />
                : <AlertTriangle size={13} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />}
              <p style={{ margin: 0, fontSize: 12, color: feedback.type === 'success' ? '#065F46' : '#991B1B' }}>{feedback.text}</p>
            </div>
          )}

          {/* Submit button */}
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                border: 'none',
                background: canSubmit
                  ? `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`
                  : 'rgba(3,56,38,0.12)',
                color: canSubmit ? '#fff' : 'rgba(3,56,38,0.35)',
                boxShadow: canSubmit ? '0 2px 8px rgba(3,56,38,0.25)' : 'none',
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              <Send size={13} />
              Send to Program Head for review
            </button>
          </div>
        </div>
      </div>

      {/* ── Assignments table card ───────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <SectionHeader
            icon={BookOpen}
            title={`Assignments — ${term.ay} · ${term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} Semester`}
            sub={`${termAssignments.length} total · ${termAssignments.filter(a => a.status === 'approved').length} approved`}
          />

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Filter size={12} style={{ color: 'rgba(3,56,38,0.35)' }} />
            <select
              value={filterProg}
              onChange={e => setFilterProg(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none', fontSize: 12, fontWeight: 600, color: FOREST, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.13)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">All programs</option>
              {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none', fontSize: 12, fontWeight: 600, color: FOREST, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.13)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 8 }}>
            <Users size={28} style={{ color: 'rgba(3,56,38,0.15)' }} />
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(3,56,38,0.35)', fontWeight: 500 }}>
              {termAssignments.length === 0 ? 'No assignments submitted yet this term.' : 'No assignments match your filters.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(3,56,38,0.03)', borderBottom: '1px solid rgba(3,56,38,0.08)' }}>
                  {['Subject', 'Section', 'Faculty', 'Status', 'Comment', ''].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a, idx) => {
                  const subj = subjectsById[a.subjectId]
                  const fac  = facultyById[a.facultyId]
                  const canWithdraw = (a.status === 'pending' || a.status === 'rejected') && !finalized
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: idx < filteredAssignments.length - 1 ? '1px solid rgba(3,56,38,0.06)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,180,74,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: FOREST }}>{subj?.code}</span>
                        <span style={{ color: 'rgba(3,56,38,0.5)', marginLeft: 5, fontSize: 12 }}>{subj?.title}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'rgba(3,56,38,0.7)', whiteSpace: 'nowrap' }}>
                        {a.section}
                        <span style={{ color: 'rgba(3,56,38,0.35)', fontSize: 11, marginLeft: 4 }}>({programLabel(subj?.prog)})</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: FOREST, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {fac?.ln}, {fac?.fn}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={a.status} />
                      </td>
                      <td style={{ padding: '10px 14px', color: 'rgba(3,56,38,0.45)', fontSize: 12, maxWidth: 200 }}>
                        {a.comment || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        {canWithdraw && (
                          <button
                            onClick={() => withdrawAssignment(a.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px',
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: 'rgba(220,38,38,0.06)',
                              border: '1px solid rgba(220,38,38,0.18)',
                              color: '#991B1B',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(220,38,38,0.12)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.3)' }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.18)' }}
                          >
                            <Trash2 size={11} /> Withdraw
                          </button>
                        )}
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