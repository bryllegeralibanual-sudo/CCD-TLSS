import { useMemo, useState, useEffect } from 'react'
import {
  AlertTriangle, Briefcase, CheckCircle2, ChevronUp,
  Filter, Info, Plus, Search, Users, Wand2, X, XCircle,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections } from '../../data/programs'
import { canTeachProgram, getFacultyMaxUnits, getFacultyUnits, specMatchScore, specMatchLabel } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const ACTIVE_STATUSES = new Set(['draft', 'pending', 'approved', 'tba'])

function preferredYears(facultyRecord) {
  const years = facultyRecord?.preferredYearLevels || facultyRecord?.preferredYears || []
  if (Array.isArray(years)) return years.map(Number).filter(Boolean)
  if (years) return [Number(years)].filter(Boolean)
  return []
}

function yearPriorityScore(facultyRecord, subject) {
  const years = preferredYears(facultyRecord)
  if (years.length === 0 || !subject?.yr) return 0
  return years.includes(Number(subject.yr)) ? 25 : -8
}

function getSectionStatus(sectionAssignments, requiredSubjects) {
  const active = sectionAssignments.filter(a => ACTIVE_STATUSES.has(a.status))
  const rejected = sectionAssignments.filter(a => a.status === 'rejected')
  const tbaCount = sectionAssignments.filter(a => a.status === 'tba').length
  
  if (rejected.length > 0) return 'replacement'
  if (active.length === 0) return 'incomplete'
  if (tbaCount > 0) return 'incomplete' // TBA means not fully assigned yet
  if (active.some(a => a.status === 'draft')) return 'draft'
  if (active.some(a => a.status === 'pending')) return 'pending'
  if (active.length === requiredSubjects.length) return 'complete'
  return 'incomplete'
}

function sectionStatusMeta(status) {
  const map = {
    replacement: { label: 'Needs replacement', color: '#991B1B', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.18)' },
    incomplete: { label: 'Incomplete', color: '#B45309', bg: 'rgba(217,180,74,0.14)', border: 'rgba(217,180,74,0.25)' },
    draft: { label: 'Ready for review', color: '#2563EB', bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.22)' },
    pending: { label: 'Pending program head', color: '#92400E', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.24)' },
    complete: { label: 'Complete', color: MID_GREEN, bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)' },
  }
  return map[status] || map.incomplete
}

function SectionStatusBadge({ status }) {
  const meta = sectionStatusMeta(status)
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 800,
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.border}`,
      padding: '4px 9px',
      borderRadius: 99,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  )
}

function StatTile({ label, value, tone = 'neutral', active, onClick }) {
  const tones = {
    neutral: { color: FOREST, bg: 'rgba(3,56,38,0.045)', border: 'rgba(3,56,38,0.10)' },
    warning: { color: '#92400E', bg: 'rgba(217,180,74,0.13)', border: 'rgba(217,180,74,0.28)' },
    danger: { color: '#991B1B', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.20)' },
    success: { color: MID_GREEN, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' },
  }
  const toneStyle = tones[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: 122,
        flex: '1 1 122px',
        padding: '10px 12px',
        borderRadius: 10,
        border: `1.5px solid ${active ? toneStyle.color : toneStyle.border}`,
        background: active ? toneStyle.bg : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, lineHeight: 1, color: toneStyle.color, fontWeight: 900, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </button>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) return null
  const danger = toast.type === 'error'
  return (
    <div style={{
      position: 'fixed',
      right: 20,
      bottom: 20,
      zIndex: 50,
      maxWidth: 360,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 12,
      background: '#fff',
      border: `1.5px solid ${danger ? 'rgba(220,38,38,0.25)' : 'rgba(16,185,129,0.25)'}`,
      boxShadow: '0 12px 28px rgba(3,56,38,0.16)',
    }}>
      {danger ? <AlertTriangle size={15} style={{ color: '#DC2626', marginTop: 1 }} /> : <CheckCircle2 size={15} style={{ color: MID_GREEN, marginTop: 1 }} />}
      <p style={{ margin: 0, flex: 1, fontSize: 12, color: danger ? '#991B1B' : FOREST, fontWeight: 700 }}>{toast.message}</p>
      <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(3,56,38,0.45)', padding: 0 }}>
        <X size={14} />
      </button>
    </div>
  )
}

function ProgressBar({ assigned, total, hasRejected }) {
  const pct = total > 0 ? Math.min((assigned / total) * 100, 100) : 0
  const color = hasRejected ? '#DC2626' : pct === 100 ? MID_GREEN : pct >= 50 ? GOLD : '#F97316'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: FOREST }}>Assignment Progress</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{assigned}/{total} subjects assigned</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}

function FacultyLoadSidebar({ facultyOptions, assignments, subjectsById, term }) {
  const rows = useMemo(() => {
    const termAssignments = assignments.filter(a => a.ay === term.ay && a.status !== 'rejected' && a.status !== 'withdrawn')
    return facultyOptions.map(fac => {
      const used = getFacultyUnits(termAssignments, subjectsById, fac.id, term.sem)
      const max = getFacultyMaxUnits(fac)
      const pct = max > 0 ? Math.min((used / max) * 100, 140) : 0
      const status = used > max ? 'Overload' : used >= max * 0.85 ? 'Near max' : used < max * 0.5 ? 'Underload' : 'Balanced'
      const color = used > max ? '#DC2626' : used >= max * 0.85 ? '#B45309' : used < max * 0.5 ? '#2563EB' : MID_GREEN
      return { fac, used, max, pct, status, color }
    }).sort((a, b) => a.used - b.used || a.fac.ln.localeCompare(b.fac.ln))
  }, [assignments, facultyOptions, subjectsById, term.ay, term.sem])

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ borderRadius: 14, background: '#fff', border: '1px solid rgba(3,56,38,0.10)', boxShadow: '0 1px 4px rgba(3,56,38,0.06)', overflow: 'hidden', position: 'sticky', top: 16 }}>
        <div style={{ padding: '13px 14px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={15} style={{ color: MID_GREEN }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: FOREST }}>Program Faculty</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.5)', fontWeight: 600 }}>Current {term.sem} semester load</p>
          </div>
        </div>
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 190px)', overflow: 'auto' }}>
          {rows.map(row => (
            <div key={row.fac.id} style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(3,56,38,0.09)', background: row.used > row.max ? 'rgba(220,38,38,0.035)' : 'rgba(3,56,38,0.018)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: FOREST, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.fac.ln}, {row.fac.fn}</p>
                <span style={{ fontSize: 11, fontWeight: 900, color: row.color, whiteSpace: 'nowrap' }}>{row.used}/{row.max}</span>
              </div>
              <p style={{ margin: '3px 0 7px', fontSize: 10.5, color: 'rgba(3,56,38,0.48)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.fac.spec || 'No specialization'}</p>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(row.pct, 100)}%`, background: row.color, borderRadius: 99 }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 10.5, fontWeight: 800, color: row.color }}>{row.status}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

function ActionRequiredPanel({ rows, onFocusStatus }) {
  const needsAction = rows.filter(row => row.status === 'replacement' || row.status === 'incomplete')
  if (needsAction.length === 0) return null

  return (
    <div style={{
      borderRadius: 14,
      background: '#fff',
      border: '1.5px solid rgba(217,180,74,0.30)',
      boxShadow: '0 1px 4px rgba(3,56,38,0.05)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(3,56,38,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <AlertTriangle size={15} style={{ color: '#B45309' }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: FOREST }}>Action Required</p>
        </div>
        <button type="button" onClick={() => onFocusStatus('replacement')} style={{ border: '1px solid rgba(220,38,38,0.18)', background: 'rgba(220,38,38,0.06)', color: '#991B1B', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          Show replacements
        </button>
      </div>
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        {needsAction.slice(0, 6).map(row => (
          <button
            type="button"
            key={row.section}
            onClick={() => onFocusStatus(row.status)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(3,56,38,0.10)',
              background: row.status === 'replacement' ? 'rgba(220,38,38,0.035)' : 'rgba(217,180,74,0.06)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: FOREST }}>{row.section}</span>
              <SectionStatusBadge status={row.status} />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.55)', fontWeight: 600 }}>
              {row.assignedCount}/{row.requiredCount} assigned
              {row.rejectedCount > 0 ? ` - ${row.rejectedCount} rejected` : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function SubjectAssignmentRow({
  section,
  subject,
  assignment,
  rejectedAssignment,
  allAssignments,
  allFaculty,
  onAssign,
  onWithdraw,
  checkCompat,
  subjectsById,
  facultyById,
  finalized,
}) {
  const [expanded, setExpanded] = useState(false)
  const [selectedFacId, setSelectedFacId] = useState('')
  const [facultySearch, setFacultySearch] = useState('')

  const needsReplacement = !assignment && rejectedAssignment
  const isTBA = assignment?.status === 'tba' // TBA = To Be Assigned
  const unitsTaken = (subject?.lec || 0) + (subject?.lab || 0)
  const rankedFaculty = useMemo(() => {
    const query = facultySearch.trim().toLowerCase()
    return allFaculty
      .map(fac => {
        const check = checkCompat({ facultyId: fac.id, subjectId: subject.id, section })
        const usedUnits = getFacultyUnits(allAssignments, subjectsById, fac.id, subject?.sem)
        const maxUnits = getFacultyMaxUnits(fac)
        const afterUnits = usedUnits + unitsTaken
        const needsOverload = afterUnits > maxUnits
        const hasBlockers = !check.ok
        const hasWarning = check.notes.some(note => note.toLowerCase().includes('mismatch') || note.toLowerCase().includes('near'))
        const priorityScore = yearPriorityScore(fac, subject)
        const rank = hasBlockers ? 3 : needsOverload ? 2 : hasWarning ? 1 : 0
        return { faculty: fac, check, usedUnits, maxUnits, afterUnits, needsOverload, hasBlockers, hasWarning, priorityScore, rank }
      })
      .filter(item => {
        if (!query) return true
        const fac = item.faculty
        return `${fac.fn} ${fac.ln} ${fac.spec || ''}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.rank - b.rank || b.priorityScore - a.priorityScore || a.afterUnits - b.afterUnits || a.faculty.ln.localeCompare(b.faculty.ln))
  }, [allAssignments, allFaculty, checkCompat, facultySearch, section, subject, subjectsById, unitsTaken])

  const selectedCandidate = rankedFaculty.find(item => item.faculty.id === Number(selectedFacId))
  const canAssign = selectedCandidate && !selectedCandidate.hasBlockers && !selectedCandidate.needsOverload && !finalized
  const borderColor = assignment && !isTBA ? 'rgba(16,185,129,0.25)' : isTBA ? 'rgba(217,180,74,0.30)' : needsReplacement ? 'rgba(220,38,38,0.25)' : 'rgba(3,56,38,0.12)'
  const bgColor = assignment && !isTBA ? 'rgba(16,185,129,0.04)' : isTBA ? 'rgba(217,180,74,0.06)' : needsReplacement ? 'rgba(220,38,38,0.035)' : 'rgba(3,56,38,0.01)'
  const recommendations = rankedFaculty.filter(item => !item.hasBlockers && !item.needsOverload).slice(0, 3)

  function submitAssignment() {
    if (!canAssign) return
    const result = onAssign(section, subject.id, Number(selectedFacId), rejectedAssignment?.id)
    if (result?.ok) {
      setExpanded(false)
      setSelectedFacId('')
      setFacultySearch('')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${borderColor}`, background: bgColor, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: FOREST }}>{subject?.code}</span>
            <span style={{ fontSize: 12, color: 'rgba(3,56,38,0.6)' }}>{unitsTaken} units - {subject?.roomType}</span>
            {assignment && <StatusBadge status={assignment.status} />}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)' }}>{subject?.title}</p>

          {needsReplacement && (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <XCircle size={12} style={{ color: '#B91C1C', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#991B1B' }}>Rejected load needs replacement</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#991B1B' }}>
                {facultyById[rejectedAssignment.facultyId]?.ln}, {facultyById[rejectedAssignment.facultyId]?.fn}
                {rejectedAssignment.comment ? ` - ${rejectedAssignment.comment}` : ''}
              </p>
            </div>
          )}

          {isTBA && (
            <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(217,180,74,0.08)', border: '1.5px solid rgba(217,180,74,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <AlertTriangle size={12} style={{ color: '#92400E', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#92400E' }}>Not enough available teachers</span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400E' }}>
                {assignment?.comment || 'No available faculty can take this subject within the maximum unit limit.'}
              </p>
            </div>
          )}
        </div>

        {assignment && !isTBA ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              <p style={{ margin: 0, fontWeight: 700, color: FOREST }}>{facultyById[assignment.facultyId]?.ln}, {facultyById[assignment.facultyId]?.fn}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)', marginTop: 1 }}>{facultyById[assignment.facultyId]?.spec || 'No specialization'}</p>
            </div>
            <CheckCircle2 size={20} style={{ color: MID_GREEN, flexShrink: 0 }} />
            <button type="button" onClick={() => onWithdraw(assignment.id)} disabled={finalized} aria-label="Withdraw assignment" style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#991B1B', cursor: finalized ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: finalized ? 0.5 : 1 }}>
              <X size={14} />
            </button>
          </div>
        ) : isTBA ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#92400E' }}>TBA</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(146,64,14,0.7)', marginTop: 1 }}>Needs reassignment</p>
            </div>
            <AlertTriangle size={20} style={{ color: '#FCD34D', flexShrink: 0 }} />
            <button type="button" onClick={() => onWithdraw(assignment.id)} disabled={finalized} aria-label="Withdraw TBA" style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#991B1B', cursor: finalized ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: finalized ? 0.5 : 1 }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {needsReplacement && (
              <button type="button" onClick={() => onWithdraw(rejectedAssignment.id)} disabled={finalized} style={{ height: 28, padding: '0 10px', borderRadius: 7, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#991B1B', cursor: finalized ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, opacity: finalized ? 0.5 : 1 }}>
                <X size={13} /> Withdraw
              </button>
            )}
            <button type="button" onClick={() => setExpanded(!expanded)} disabled={finalized} aria-label={needsReplacement ? 'Assign replacement' : 'Assign faculty'} style={{ width: 28, height: 28, borderRadius: 7, background: needsReplacement ? 'rgba(220,38,38,0.10)' : 'rgba(3,56,38,0.08)', border: `1px solid ${needsReplacement ? 'rgba(220,38,38,0.22)' : 'rgba(3,56,38,0.15)'}`, color: needsReplacement ? '#B91C1C' : MID_GREEN, cursor: finalized ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: finalized ? 0.5 : 1 }}>
              {expanded ? <ChevronUp size={14} /> : <Plus size={14} />}
            </button>
          </div>
        )}
      </div>

      {isTBA && expanded && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(217,180,74,0.03)', border: `1.5px solid rgba(217,180,74,0.20)`, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(217,180,74,0.10)', border: '1.5px solid rgba(217,180,74,0.25)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#92400E' }}>No Teachers Available</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#92400E' }}>
              All faculty who can teach this subject have reached their maximum unit capacity.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#92400E', fontWeight: 600 }}>
              Adjust existing teaching loads or choose another qualified faculty before assigning this subject.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setExpanded(false)
              }}
              disabled={finalized}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 7,
                border: '1px solid rgba(3,56,38,0.15)',
                background: '#fff',
                color: FOREST,
                fontWeight: 700,
                fontSize: 11,
                cursor: finalized ? 'not-allowed' : 'pointer',
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(false)
                // Withdraw the TBA assignment to clear it
                if (assignment?.id) {
                  onWithdraw(assignment.id)
                }
              }}
              disabled={finalized}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 7,
                border: '1px solid rgba(220,38,38,0.20)',
                background: 'rgba(220,38,38,0.08)',
                color: '#991B1B',
                fontWeight: 700,
                fontSize: 11,
                cursor: finalized ? 'not-allowed' : 'pointer',
              }}
            >
              Clear TBA
            </button>
          </div>
        </div>
      )}

      {!assignment && !isTBA && expanded && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(3,56,38,0.03)', border: `1.5px solid ${needsReplacement ? 'rgba(220,38,38,0.20)' : `${GOLD}30`}`, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* RECOMMENDATIONS SECTION - HIGHLIGHTED */}
          {recommendations.length > 0 && (
            <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.18)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 11, fontWeight: 900, color: MID_GREEN, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🥇 Recommended Faculty</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {recommendations.map((item, idx) => (
                  <button 
                    key={item.faculty.id} 
                    type="button" 
                    onClick={() => setSelectedFacId(String(item.faculty.id))} 
                    style={{ 
                      border: `1.5px solid ${MID_GREEN}`, 
                      background: selectedFacId === String(item.faculty.id) ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)', 
                      color: MID_GREEN, 
                      borderRadius: 8, 
                      padding: '8px 10px', 
                      fontSize: 11, 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {item.faculty.ln}</div>
                    <div style={{ fontSize: 10, opacity: 0.9 }}>{item.afterUnits}/{item.maxUnits} units</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Search Faculty</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: 10, color: 'rgba(3,56,38,0.35)' }} />
                <input value={facultySearch} onChange={e => setFacultySearch(e.target.value)} placeholder="Name or specialization" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 30px', borderRadius: 10, fontSize: 13, color: FOREST, background: '#fff', border: '1.5px solid rgba(3,56,38,0.15)', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Select Faculty</label>
              <select value={selectedFacId} onChange={e => setSelectedFacId(e.target.value)} style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', padding: '8px 32px 8px 11px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: FOREST, background: '#fff', border: '1.5px solid rgba(3,56,38,0.15)', outline: 'none', cursor: 'pointer' }}>
                <option value="">Choose faculty</option>
                {rankedFaculty.map(item => (
                  <option key={item.faculty.id} value={item.faculty.id} disabled={item.hasBlockers}>
                    {item.faculty.ln}, {item.faculty.fn} - {item.hasBlockers ? 'Blocked' : item.needsOverload ? 'Over capacity' : item.hasWarning ? 'Review notes' : 'Recommended'} ({item.afterUnits}/{item.maxUnits} units)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCandidate && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(3,56,38,0.06)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: FOREST }}>Workload Check</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: selectedCandidate.hasBlockers || selectedCandidate.needsOverload ? '#DC2626' : MID_GREEN }}>{selectedCandidate.afterUnits}/{selectedCandidate.maxUnits} units</span>
              </div>

              {(selectedCandidate.check.blockers.length > 0 || selectedCandidate.check.notes.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedCandidate.check.blockers.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                      <AlertTriangle size={12} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11, color: '#991B1B', fontWeight: 600 }}>{b}</p>
                    </div>
                  ))}
                  {selectedCandidate.check.notes.map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.1)' }}>
                      <Info size={12} style={{ color: MID_GREEN, flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11, color: FOREST }}>{n}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedCandidate.afterUnits > selectedCandidate.maxUnits && (
                <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(217,180,74,0.10)', border: '1.5px solid rgba(217,180,74,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#92400E' }}>Exceeds maximum capacity by {selectedCandidate.afterUnits - selectedCandidate.maxUnits} units</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(146,64,14,0.7)' }}>This faculty cannot be assigned unless existing loads are adjusted.</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={submitAssignment} disabled={!canAssign} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: canAssign ? 'pointer' : 'not-allowed', background: canAssign ? `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` : 'rgba(3,56,38,0.12)', color: canAssign ? '#fff' : 'rgba(3,56,38,0.35)', border: 'none' }}>
                  {needsReplacement ? 'Assign Replacement' : 'Assign'}
                </button>
                <button type="button" onClick={() => { setExpanded(false); setSelectedFacId(''); setFacultySearch('') }} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent', color: 'rgba(3,56,38,0.55)', border: '1px solid rgba(3,56,38,0.15)' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

function SectionCard({
  row,
  allAssignments,
  allFaculty,
  onAssign,
  onWithdraw,
  checkCompat,
  subjectsById,
  facultyById,
  finalized,
  onSubmit,
  isSubmitted,
}) {
  const { section, requiredSubjects, assignments, activeAssignments, rejectedAssignments, status, assignedCount, rejectedCount, requiredCount } = row
  const completionPct = requiredCount > 0 ? (assignedCount / requiredCount) * 100 : 0
  const hasRejected = rejectedCount > 0
  const draftCount = activeAssignments.filter(a => a.status === 'draft').length
  const pendingCount = activeAssignments.filter(a => a.status === 'pending').length
  const approvedCount = activeAssignments.filter(a => a.status === 'approved').length
  // Button is ONLY enabled when ALL subjects assigned, NO rejections, has DRAFT assignments, NOT already submitted, and term NOT finalized
  const allComplete = assignedCount === requiredCount
  const hasDrafts = draftCount > 0
  const canSubmit = allComplete && !hasRejected && hasDrafts && !isSubmitted && !finalized

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${hasRejected ? 'rgba(220,38,38,0.24)' : status === 'draft' ? 'rgba(37,99,235,0.25)' : status === 'complete' ? 'rgba(16,185,129,0.25)' : 'rgba(3,56,38,0.12)'}`, background: hasRejected ? 'rgba(220,38,38,0.02)' : status === 'draft' ? 'rgba(37,99,235,0.03)' : status === 'complete' ? 'rgba(16,185,129,0.03)' : '#fff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(3,56,38,0.06)' }}>
      <div style={{ borderLeft: `3px solid ${hasRejected ? '#DC2626' : status === 'draft' ? '#2563EB' : status === 'complete' ? MID_GREEN : GOLD}`, padding: '16px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>{section}</h3>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)', marginTop: 4 }}>{assignedCount}/{requiredCount} subjects assigned</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <SectionStatusBadge status={status} />
          {draftCount > 0 && <StatusBadge status="draft" />}
          {pendingCount > 0 && <StatusBadge status="pending" />}
          {approvedCount > 0 && <StatusBadge status="approved" />}
          <span style={{ minWidth: 24, height: 24, borderRadius: 99, background: hasRejected ? 'rgba(220,38,38,0.10)' : completionPct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(217,180,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: hasRejected ? '#991B1B' : completionPct === 100 ? MID_GREEN : '#92620A' }}>{Math.round(completionPct)}%</span>
          
          {isSubmitted ? (
            <span style={{ fontSize: 11, fontWeight: 800, color: MID_GREEN, background: 'rgba(16,185,129,0.10)', border: `1px solid rgba(16,185,129,0.25)`, padding: '6px 10px', borderRadius: 7, whiteSpace: 'nowrap' }}>✓ Submitted</span>
          ) : (
            <button
              type="button"
              onClick={() => onSubmit(section)}
              disabled={!canSubmit}
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '7px 12px',
                borderRadius: 7,
                border: canSubmit ? 'none' : '1px solid rgba(3,56,38,0.15)',
                background: canSubmit ? `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` : 'rgba(3,56,38,0.08)',
                color: canSubmit ? '#fff' : 'rgba(3,56,38,0.35)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              Submit for Review
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <ProgressBar assigned={assignedCount} total={requiredCount} hasRejected={hasRejected} />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {requiredSubjects.map(subject => {
            const activeAssignment = activeAssignments.find(a => a.subjectId === subject.id)
            const rejectedAssignment = rejectedAssignments.find(a => a.subjectId === subject.id)

            return (
              <SubjectAssignmentRow
                key={subject.id}
                section={section}
                subject={subject}
                assignment={activeAssignment}
                rejectedAssignment={rejectedAssignment}
                allAssignments={allAssignments}
                allFaculty={allFaculty}
                onAssign={onAssign}
                onWithdraw={onWithdraw}
                checkCompat={checkCompat}
                subjectsById={subjectsById}
                facultyById={facultyById}
                finalized={finalized}
              />
            )
          })}
        </div>
        {assignments.length === 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.42)', fontWeight: 600 }}>
            Start by assigning faculty to each subject in this section.
          </p>
        )}
      </div>
    </div>
  )
}

export default function LoadAssignmentPage() {
  const { account } = useAuth()
  const {
    term, isTermFinalized,
    faculty, subjects, assignments, setAssignments,
    subjectsById, facultyById,
    createAssignment, createBulkAssignments, withdrawAssignment, checkCompatibility, submitToProgramHead,
  } = useData()

  const finalized = isTermFinalized(term.ay, term.sem)
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0].code)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [viewMode, setViewMode] = useState('all')
  const [toast, setToast] = useState(null)
  const [submittedSections, setSubmittedSections] = useState(() => {
    try {
      const saved = localStorage.getItem(`ccd-tlss.submitted-sections`)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Persist submitted sections and reset when program changes
  useEffect(() => {
    localStorage.setItem(`ccd-tlss.submitted-sections`, JSON.stringify([...submittedSections]))
  }, [submittedSections])

  useEffect(() => {
    setSubmittedSections(new Set())
  }, [selectedProgram])

  const allSections = useMemo(() => getSections(), [])
  const sectionsForProgram = useMemo(
    () => allSections.filter(s => s.prog === selectedProgram),
    [allSections, selectedProgram],
  )

  const sectionRequirements = useMemo(() => {
    const result = {}
    for (const section of sectionsForProgram) {
      const sectionKey = `${section.prog} ${section.yr}${section.lbl}`
      result[sectionKey] = subjects.filter(
        s => s.prog === selectedProgram && s.yr === section.yr && s.sem === term.sem,
      )
    }
    return result
  }, [sectionsForProgram, selectedProgram, subjects, term.sem])

  const programAssignments = useMemo(
    () => assignments.filter(a => {
      const subj = subjectsById[a.subjectId]
      return subj?.prog === selectedProgram && a.ay === term.ay && a.status !== 'withdrawn'
    }),
    [assignments, selectedProgram, term.ay, subjectsById],
  )

  const sectionRows = useMemo(() => {
    return Object.entries(sectionRequirements).map(([section, requiredSubjects]) => {
      const sectionAssignments = programAssignments.filter(a =>
        a.section === section && requiredSubjects.some(s => s.id === a.subjectId),
      )
      const activeAssignments = sectionAssignments.filter(a => ACTIVE_STATUSES.has(a.status))
      const rejectedAssignments = sectionAssignments.filter(a => a.status === 'rejected')
      const status = getSectionStatus(sectionAssignments, requiredSubjects)
      return {
        section,
        requiredSubjects,
        assignments: sectionAssignments,
        activeAssignments,
        rejectedAssignments,
        status,
        requiredCount: requiredSubjects.length,
        assignedCount: activeAssignments.filter(a => requiredSubjects.some(s => s.id === a.subjectId)).length,
        rejectedCount: rejectedAssignments.length,
      }
    })
  }, [programAssignments, sectionRequirements])

  const summary = useMemo(() => ({
    total: sectionRows.length,
    replacement: sectionRows.filter(row => row.status === 'replacement').length,
    incomplete: sectionRows.filter(row => row.status === 'incomplete').length,
    draft: sectionRows.filter(row => row.status === 'draft').length,
    pending: sectionRows.filter(row => row.status === 'pending').length,
    complete: sectionRows.filter(row => row.status === 'complete').length,
  }), [sectionRows])

  const visibleRows = useMemo(() => {
    function isSubmittedRow(row) {
      return submittedSections.has(row.section) || row.activeAssignments.some(a => a.status === 'pending' || a.status === 'approved')
    }

    return sectionRows
      .filter(row => {
        if (viewMode === 'needsWork' && (row.status === 'pending' || row.status === 'complete' || row.status === 'approved')) return false
        if (filterStatus !== 'ALL' && row.status !== filterStatus) return false
        return true
      })
      .sort((a, b) => {
        const aSubmitted = isSubmittedRow(a)
        const bSubmitted = isSubmittedRow(b)
        if (aSubmitted !== bSubmitted) return aSubmitted ? 1 : -1
        const statusOrder = { replacement: 0, incomplete: 1, draft: 2, pending: 3, complete: 4 }
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || a.section.localeCompare(b.section)
      })
  }, [filterStatus, sectionRows, submittedSections, viewMode])

  const firstSubmittedIndex = visibleRows.findIndex(row =>
    submittedSections.has(row.section) || row.activeAssignments.some(a => a.status === 'pending' || a.status === 'approved'),
  )

  const facultyOptions = useMemo(
    () => faculty.filter(f => canTeachProgram(f, selectedProgram)),
    [faculty, selectedProgram],
  )

  function notify(type, message) {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3200)
  }

  function handleAssignSubject(section, subjectId, facultyId, rejectedId = null) {
    if (finalized) return { ok: false }
    const result = createAssignment({ facultyId, subjectId, section }, account)
    if (result.ok && rejectedId) {
      withdrawAssignment(rejectedId)
      notify('success', 'Replacement assigned. Review the section before submitting to program head.')
    } else if (result.ok) {
      notify('success', 'Assignment created. Complete the section, then submit for program head review.')
    } else {
      notify('error', result.blockers?.[0] || 'Assignment could not be created.')
    }
    return result
  }

  function subjectUnits(subject) {
    return (subject?.lec || 0) + (subject?.lab || 0)
  }

  // Uses the canonical specMatchScore from specCategories.js via validation.js
  // (replaces the old coarse 2-letter code prefix heuristic)
  function specScore(facultyRecord, subject) {
    return specMatchScore(facultyRecord, subject)
  }

  function handleAutoAssignProgram() {
    if (finalized) return

    const termAssignments = assignments.filter(a => a.ay === term.ay)
    const simulated = termAssignments.filter(a => a.status !== 'rejected' && a.status !== 'withdrawn').map(a => ({ ...a }))
    const loads = new Map(facultyOptions.map(fac => [fac.id, getFacultyUnits(simulated, subjectsById, fac.id, term.sem)]))
    const created = []
    const tba = [] // Subjects that can't be assigned (TBA = To Be Assigned)
    const tasks = sectionRows.flatMap(row =>
      row.requiredSubjects
        .filter(subject => !row.activeAssignments.some(a => a.subjectId === subject.id))
        .map(subject => ({ section: row.section, subject, units: subjectUnits(subject) })),
    ).sort((a, b) => b.units - a.units || a.subject.code.localeCompare(b.subject.code))

    function hasExactAssignment(facultyId, subjectId, section) {
      return simulated.some(a => a.facultyId === facultyId && a.subjectId === subjectId && a.section === section && a.status !== 'rejected' && a.status !== 'withdrawn')
    }

    function chooseCandidate(task) {
      // STRICT: Only assign teachers who don't exceed their 18-unit limit (NO OVERLOAD)
      const candidates = facultyOptions
        .filter(fac => canTeachProgram(fac, task.subject.prog) && !hasExactAssignment(fac.id, task.subject.id, task.section))
        .map(fac => {
          const current = loads.get(fac.id) || 0
          const max = getFacultyMaxUnits(fac)
          const after = current + task.units
          const canFit = after <= max // STRICT: Can only assign if it fits within max
          const specScoreVal = specScore(fac, task.subject)
          const yearScoreVal = yearPriorityScore(fac, task.subject)
          const reusableCode = simulated.some(a => a.facultyId === fac.id && subjectsById[a.subjectId]?.code === task.subject.code)
          
          // Overall score: prioritizes specialization heavily
          const score = (specScoreVal * 2) + yearScoreVal + (reusableCode ? 15 : 0) - (current / Math.max(max, 1)) * 8
          
          return { 
            fac, 
            current, 
            max, 
            after, 
            score,
            specScoreVal,
            yearScoreVal,
            canFit,
            hasSpecMatch: specScoreVal >= 100, // strong match only (specMatchScore: strong=100, acceptable=45, mismatch=5)
          }
        })
        .filter(c => c.canFit) // STRICT: Only candidates that fit within max limit
      
      if (candidates.length === 0) return null
      
      // Multi-pass selection strategy (WITHOUT overload):
      
      // Pass 1: Specialization match (highest priority)
      const pass1 = candidates.filter(c => c.hasSpecMatch)
        .sort((a, b) => b.specScoreVal - a.specScoreVal || b.yearScoreVal - a.yearScoreVal || b.score - a.score || a.fac.ln.localeCompare(b.fac.ln))
      if (pass1.length > 0) return pass1[0]
      
      // Pass 2: ANY candidate available
      const pass2 = candidates
        .sort((a, b) => b.yearScoreVal - a.yearScoreVal || b.score - a.score || a.fac.ln.localeCompare(b.fac.ln))
      return pass2[0] || null
    }

    for (const task of tasks) {
      const picked = chooseCandidate(task)
      if (!picked) {
        // Can't assign this subject - mark as TBA (To Be Assigned)
        tba.push({
          subjectId: task.subject.id,
          section: task.section,
          reason: 'Not enough available teachers within capacity - load adjustment required',
        })
        continue
      }

      const nextAssignment = {
        id: `auto-${created.length}`,
        ay: term.ay,
        facultyId: picked.fac.id,
        subjectId: task.subject.id,
        section: task.section,
        status: 'draft',
      }
      simulated.push(nextAssignment)
      loads.set(picked.fac.id, picked.after)
      created.push({
        facultyId: picked.fac.id,
        subjectId: task.subject.id,
        section: task.section,
      })
    }

    if (created.length === 0 && tba.length === 0) {
      notify('error', 'All visible program subjects are already assigned.')
      return
    }

    // Create the assignments
    if (created.length > 0) {
      const result = createBulkAssignments(created, account)
      if (!result.ok) {
        notify('error', result.blockers?.[0] || 'Auto assignment could not be saved.')
        return
      }
    }

    // Create TBA placeholder assignments (facultyId = null, status = 'tba')
    if (tba.length > 0) {
      const createdAt = new Date().toISOString()
      setAssignments((prev) => {
        const nextStartId = prev.reduce((max, a) => Math.max(max, a.id), 0) + 1
        const tbaRecords = tba.map((item, index) => ({
          id: nextStartId + index,
          ay: term.ay,
          facultyId: null, // TBA - no faculty assigned
          subjectId: item.subjectId,
          section: item.section,
          status: 'tba', // Special status for TBA
          createdBy: account?.id || 'system-auto',
          createdAt,
          submittedBy: null,
          submittedAt: null,
          reviewedBy: null,
          reviewedAt: null,
          comment: item.reason,
        }))
        return [...prev, ...tbaRecords]
      })
    }

    const summary = []
    if (created.length > 0) summary.push(`${created.length} auto-assigned`)
    if (tba.length > 0) summary.push(`${tba.length} marked as TBA (load adjustment needed)`)
    const message = summary.length > 0 
      ? `Done: ${summary.join(', ')}. Review assignments, then click "Submit for Review" on each section.`
      : 'Auto-assignment complete.'
    notify('success', message)
  }

  function handleWithdrawAssignment(id) {
    if (finalized) return
    withdrawAssignment(id)
    notify('success', 'Assignment withdrawn.')
  }

  function handleSubmitSection(sectionName) {
    // Get all draft assignments for this section
    const sectionAssignments = programAssignments.filter(a => a.section === sectionName && a.status === 'draft')
    
    if (sectionAssignments.length === 0) {
      notify('error', 'No draft assignments to submit.')
      return
    }

    // Submit draft assignments to program head for review
    const assignmentIds = sectionAssignments.map(a => a.id)
    submitToProgramHead(assignmentIds, account)
    setSubmittedSections(prev => new Set([...prev, sectionName]))
    notify('success', `${sectionName} submitted to program head for review. ${sectionAssignments.length} assignment(s) pending.`)
  }

  function focusStatus(status) {
    setViewMode('all')
    setFilterStatus(status)
  }

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(3,56,38,0.10)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(3,56,38,0.06)' }}>
        <div style={{ background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={18} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif" }}>Assign Teaching Loads by Section</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(220,252,231,0.65)', marginTop: 2 }}>AY {term.ay} - {term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} Semester</p>
          </div>
          {finalized && (
            <div style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(217,180,74,0.18)', border: `1px solid ${GOLD}50` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: GOLD }}>Term Finalized</span>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {finalized && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>This term is finalized. New assignments are disabled.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatTile label="Sections" value={summary.total} active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')} />
            <StatTile label="Needs Replacement" value={summary.replacement} tone="danger" active={filterStatus === 'replacement'} onClick={() => focusStatus('replacement')} />
            <StatTile label="Incomplete" value={summary.incomplete} tone="warning" active={filterStatus === 'incomplete'} onClick={() => focusStatus('incomplete')} />
            <StatTile label="Ready for Review" value={summary.draft} tone="neutral" active={filterStatus === 'draft'} onClick={() => setFilterStatus('draft')} />
            <StatTile label="Pending" value={summary.pending} tone="warning" active={filterStatus === 'pending'} onClick={() => focusStatus('pending')} />
            <StatTile label="Complete" value={summary.complete} tone="success" active={filterStatus === 'complete'} onClick={() => focusStatus('complete')} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Program</label>
              <select value={selectedProgram} onChange={e => { setSelectedProgram(e.target.value); setFilterStatus('ALL') }} disabled={finalized} style={{ appearance: 'none', WebkitAppearance: 'none', padding: '8px 32px 8px 11px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: FOREST, background: 'rgba(3,56,38,0.05)', border: '1.5px solid rgba(3,56,38,0.14)', outline: 'none', cursor: finalized ? 'not-allowed' : 'pointer', opacity: finalized ? 0.5 : 1 }}>
                {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>View</label>
              <div style={{ display: 'flex', border: '1px solid rgba(3,56,38,0.12)', borderRadius: 10, overflow: 'hidden', background: 'rgba(3,56,38,0.04)' }}>
                {[
                  ['all', 'All Sections'],
                  ['needsWork', 'Needs Work'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setViewMode(value)} style={{ border: 'none', padding: '8px 11px', fontSize: 12, fontWeight: 800, color: viewMode === value ? '#fff' : FOREST, background: viewMode === value ? MID_GREEN : 'transparent', cursor: 'pointer' }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', alignSelf: 'end' }}>
              <button type="button" onClick={handleAutoAssignProgram} disabled={finalized} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 9, border: 'none', background: finalized ? 'rgba(3,56,38,0.12)' : `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`, color: finalized ? 'rgba(3,56,38,0.35)' : '#fff', fontSize: 12, fontWeight: 900, cursor: finalized ? 'not-allowed' : 'pointer', boxShadow: finalized ? 'none' : '0 8px 18px rgba(3,56,38,0.16)' }}>
                <Wand2 size={13} />
                Auto Assign
              </button>
              <Filter size={12} style={{ color: 'rgba(3,56,38,0.35)' }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', fontSize: 12, fontWeight: 700, color: FOREST, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.13)', borderRadius: 7, padding: '7px 28px 7px 10px', cursor: 'pointer', outline: 'none' }}>
                <option value="ALL">All statuses</option>
                <option value="replacement">Needs replacement</option>
                <option value="incomplete">Incomplete</option>
                <option value="draft">Ready for review</option>
                <option value="pending">Pending program head</option>
                <option value="complete">Complete</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <ActionRequiredPanel rows={sectionRows} onFocusStatus={focusStatus} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 300px)', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {visibleRows.length === 0 ? (
            <div style={{ padding: '34px 18px', borderRadius: 14, background: '#fff', border: '1px solid rgba(3,56,38,0.10)', textAlign: 'center' }}>
              <CheckCircle2 size={22} style={{ color: MID_GREEN, opacity: 0.55 }} />
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(3,56,38,0.45)', fontWeight: 700 }}>No sections match the current filters.</p>
            </div>
          ) : (
            visibleRows.map((row, index) => (
              <div key={row.section} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {index === firstSubmittedIndex && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: index === 0 ? 0 : 4 }}>
                    <div style={{ height: 1, flex: 1, background: 'rgba(3,56,38,0.10)' }} />
                    <span style={{ borderRadius: 99, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)', color: MID_GREEN, padding: '5px 10px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
                      Submitted for review
                    </span>
                    <div style={{ height: 1, flex: 1, background: 'rgba(3,56,38,0.10)' }} />
                  </div>
                )}
                <SectionCard
                  row={row}
                  allAssignments={assignments}
                  allFaculty={facultyOptions}
                  onAssign={handleAssignSubject}
                  onWithdraw={handleWithdrawAssignment}
                  checkCompat={checkCompatibility}
                  subjectsById={subjectsById}
                  facultyById={facultyById}
                  finalized={finalized}
                  onSubmit={handleSubmitSection}
                  isSubmitted={submittedSections.has(row.section) || row.activeAssignments.some(a => a.status === 'pending' || a.status === 'approved')}
              />
              </div>
            ))
          )}
        </div>
        <FacultyLoadSidebar
          facultyOptions={facultyOptions}
          assignments={assignments}
          subjectsById={subjectsById}
          term={term}
        />
      </div>
    </div>
  )
}
