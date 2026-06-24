import { useMemo, useState } from 'react'
import {
  AlertTriangle, Briefcase, CheckCircle2, ChevronUp,
  Filter, Info, Plus, Search, X, XCircle,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections } from '../../data/programs'
import { canTeachProgram, getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

// ─── Design tokens ────────────────────────────────────────────────────────────
const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'
const ACTIVE_STATUSES = new Set(['pending', 'approved'])
// ─────────────────────────────────────────────────────────────────────────────

function getSectionStatus(sectionAssignments, requiredSubjects) {
  const active = sectionAssignments.filter(a => ACTIVE_STATUSES.has(a.status))
  const rejected = sectionAssignments.filter(a => a.status === 'rejected')
  if (rejected.length > 0) return 'replacement'
  if (active.length === 0) return 'incomplete'
  if (active.some(a => a.status === 'pending')) return 'pending'
  if (active.length === requiredSubjects.length) return 'complete'
  return 'incomplete'
}

function sectionStatusMeta(status) {
  const map = {
    replacement: { label: 'Needs replacement', color: '#991B1B', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.18)' },
    incomplete: { label: 'Incomplete', color: '#B45309', bg: 'rgba(217,180,74,0.14)', border: 'rgba(217,180,74,0.25)' },
    pending: { label: 'Pending review', color: '#92400E', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.24)' },
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
  const unitsTaken = (subject?.lec || 0) + (subject?.lab || 0)
  const rankedFaculty = useMemo(() => {
    const query = facultySearch.trim().toLowerCase()
    return allFaculty
      .map(fac => {
        const check = checkCompat({ facultyId: fac.id, subjectId: subject.id, section })
        const usedUnits = getFacultyUnits(allAssignments, subjectsById, fac.id, subject?.sem)
        const maxUnits = getFacultyMaxUnits(fac)
        const afterUnits = usedUnits + unitsTaken
        const hasBlockers = !check.ok || afterUnits > maxUnits
        const hasWarning = check.notes.some(note => note.toLowerCase().includes('mismatch') || note.toLowerCase().includes('near'))
        const rank = hasBlockers ? 2 : hasWarning ? 1 : 0
        return { faculty: fac, check, usedUnits, maxUnits, afterUnits, hasBlockers, hasWarning, rank }
      })
      .filter(item => {
        if (!query) return true
        const fac = item.faculty
        return `${fac.fn} ${fac.ln} ${fac.spec || ''}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.rank - b.rank || a.afterUnits - b.afterUnits || a.faculty.ln.localeCompare(b.faculty.ln))
  }, [allAssignments, allFaculty, checkCompat, facultySearch, section, subject, subjectsById, unitsTaken])

  const selectedCandidate = rankedFaculty.find(item => item.faculty.id === Number(selectedFacId))
  const canAssign = selectedCandidate && !selectedCandidate.hasBlockers && !finalized
  const borderColor = assignment ? 'rgba(16,185,129,0.25)' : needsReplacement ? 'rgba(220,38,38,0.25)' : 'rgba(3,56,38,0.12)'
  const bgColor = assignment ? 'rgba(16,185,129,0.04)' : needsReplacement ? 'rgba(220,38,38,0.035)' : 'rgba(3,56,38,0.01)'
  const recommendations = rankedFaculty.filter(item => !item.hasBlockers).slice(0, 3)

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
        </div>

        {assignment ? (
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

      {!assignment && expanded && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(3,56,38,0.03)', border: `1.5px solid ${needsReplacement ? 'rgba(220,38,38,0.20)' : `${GOLD}30`}`, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    {item.faculty.ln}, {item.faculty.fn} - {item.hasBlockers ? 'Blocked' : item.hasWarning ? 'Review notes' : 'Recommended'} ({item.afterUnits}/{item.maxUnits} units)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recommendations.map(item => (
                <button key={item.faculty.id} type="button" onClick={() => setSelectedFacId(String(item.faculty.id))} style={{ border: `1px solid ${item.hasWarning ? 'rgba(217,180,74,0.35)' : 'rgba(16,185,129,0.24)'}`, background: item.hasWarning ? 'rgba(217,180,74,0.10)' : 'rgba(16,185,129,0.07)', color: item.hasWarning ? '#92400E' : MID_GREEN, borderRadius: 99, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  {item.faculty.ln}, {item.faculty.fn} - {item.afterUnits}/{item.maxUnits}
                </button>
              ))}
            </div>
          )}

          {selectedCandidate && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(3,56,38,0.06)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: FOREST }}>Workload Check</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: selectedCandidate.hasBlockers ? '#DC2626' : MID_GREEN }}>{selectedCandidate.afterUnits}/{selectedCandidate.maxUnits} units</span>
              </div>

              {(selectedCandidate.check.blockers.length > 0 || selectedCandidate.check.notes.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedCandidate.check.blockers.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                      <AlertTriangle size={12} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11, color: '#991B1B' }}>{b}</p>
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
}) {
  const { section, requiredSubjects, assignments, activeAssignments, rejectedAssignments, status, assignedCount, rejectedCount, requiredCount } = row
  const completionPct = requiredCount > 0 ? (assignedCount / requiredCount) * 100 : 0
  const hasRejected = rejectedCount > 0
  const pendingCount = activeAssignments.filter(a => a.status === 'pending').length
  const approvedCount = activeAssignments.filter(a => a.status === 'approved').length

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${hasRejected ? 'rgba(220,38,38,0.24)' : status === 'complete' ? 'rgba(16,185,129,0.25)' : 'rgba(3,56,38,0.12)'}`, background: hasRejected ? 'rgba(220,38,38,0.02)' : status === 'complete' ? 'rgba(16,185,129,0.03)' : '#fff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(3,56,38,0.06)' }}>
      <div style={{ borderLeft: `3px solid ${hasRejected ? '#DC2626' : status === 'complete' ? MID_GREEN : GOLD}`, padding: '16px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>{section}</h3>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)', marginTop: 4 }}>{assignedCount}/{requiredCount} subjects assigned</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <SectionStatusBadge status={status} />
          {pendingCount > 0 && <StatusBadge status="pending" />}
          {approvedCount > 0 && <StatusBadge status="approved" />}
          <span style={{ minWidth: 24, height: 24, borderRadius: 99, background: hasRejected ? 'rgba(220,38,38,0.10)' : completionPct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(217,180,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: hasRejected ? '#991B1B' : completionPct === 100 ? MID_GREEN : '#92620A' }}>{Math.round(completionPct)}%</span>
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
    faculty, subjects, assignments,
    subjectsById, facultyById,
    createAssignment, withdrawAssignment, checkCompatibility,
  } = useData()

  const finalized = isTermFinalized(term.ay, term.sem)
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0].code)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [viewMode, setViewMode] = useState('all')
  const [toast, setToast] = useState(null)

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
    pending: sectionRows.filter(row => row.status === 'pending').length,
    complete: sectionRows.filter(row => row.status === 'complete').length,
  }), [sectionRows])

  const visibleRows = sectionRows.filter(row => {
    if (viewMode === 'needsWork' && (row.status === 'pending' || row.status === 'complete')) return false
    if (filterStatus !== 'ALL' && row.status !== filterStatus) return false
    return true
  })

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
      notify('success', 'Replacement assigned and sent back for Program Head review.')
    } else if (result.ok) {
      notify('success', 'Assignment created and sent for Program Head review.')
    } else {
      notify('error', result.blockers?.[0] || 'Assignment could not be created.')
    }
    return result
  }

  function handleWithdrawAssignment(id) {
    if (finalized) return
    withdrawAssignment(id)
    notify('success', 'Assignment withdrawn.')
  }

  function focusStatus(status) {
    setViewMode('all')
    setFilterStatus(status)
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <Filter size={12} style={{ color: 'rgba(3,56,38,0.35)' }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', fontSize: 12, fontWeight: 700, color: FOREST, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.13)', borderRadius: 7, padding: '7px 28px 7px 10px', cursor: 'pointer', outline: 'none' }}>
                <option value="ALL">All statuses</option>
                <option value="replacement">Needs replacement</option>
                <option value="incomplete">Incomplete</option>
                <option value="pending">Pending review</option>
                <option value="complete">Complete</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <ActionRequiredPanel rows={sectionRows} onFocusStatus={focusStatus} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleRows.length === 0 ? (
          <div style={{ padding: '34px 18px', borderRadius: 14, background: '#fff', border: '1px solid rgba(3,56,38,0.10)', textAlign: 'center' }}>
            <CheckCircle2 size={22} style={{ color: MID_GREEN, opacity: 0.55 }} />
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(3,56,38,0.45)', fontWeight: 700 }}>No sections match the current filters.</p>
          </div>
        ) : (
          visibleRows.map(row => (
            <SectionCard
              key={row.section}
              row={row}
              allAssignments={assignments}
              allFaculty={facultyOptions}
              onAssign={handleAssignSubject}
              onWithdraw={handleWithdrawAssignment}
              checkCompat={checkCompatibility}
              subjectsById={subjectsById}
              facultyById={facultyById}
              finalized={finalized}
            />
          ))
        )}
      </div>
    </div>
  )
}
