import { useMemo, useState } from 'react'
import {
  Briefcase, ChevronDown, AlertTriangle, CheckCircle2,
  Info, Send, Trash2, BookOpen, Users, Filter, ChevronUp, MoreVertical,
  Plus, X,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'
import { canTeachProgram, getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

<<<<<<< HEAD
export default function LoadAssignmentPage() {
  const { account } = useAuth()
  const { term, isTermFinalized, faculty, subjects, assignments, subjectsById, facultyById, createAssignment, withdrawAssignment, checkCompatibility } = useData()

  const allSections = useMemo(() => getSections(), [])
  const [progCode, setProgCode] = useState(PROGRAMS[0].code)
  const [yr, setYr] = useState(1)
  const [sectionLbl, setSectionLbl] = useState('A')
  const [subjectId, setSubjectId] = useState('')
  const [facultyId, setFacultyId] = useState('')

  const finalized = isTermFinalized(term.ay, term.sem)
  const sectionsForProg = allSections.filter((s) => s.prog === progCode && s.yr === yr)
  const section = `${progCode} ${yr}${sectionLbl}`

  const subjectOptions = subjects.filter((s) => s.prog === progCode && s.yr === yr && s.sem === term.sem)
  const facultyOptions = faculty.filter((f) => canTeachProgram(f, progCode))

  const check = subjectId && facultyId ? checkCompatibility({ facultyId: Number(facultyId), subjectId: Number(subjectId), section }) : null
  const selectedFaculty = facultyId ? facultyById[Number(facultyId)] : null
  const [feedback, setFeedback] = useState(null)

  async function handleSubmit() {
    if (!subjectId || !facultyId) return
    const result = await createAssignment({ facultyId: Number(facultyId), subjectId: Number(subjectId), section }, account)
    if (result.ok) {
      setFeedback({ type: 'success', text: `Submitted for Program Head review: ${subjectsById[Number(subjectId)].code} → ${facultyById[Number(facultyId)].ln}.` })
      setSubjectId('')
      setFacultyId('')
    } else {
      setFeedback({ type: 'error', text: result.blockers.join(' ') })
    }
  }

  const termAssignments = assignments.filter((a) => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem)
=======
// ─── Design tokens ────────────────────────────────────────────────────────────
const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'
// ─────────────────────────────────────────────────────────────────────────────
>>>>>>> 61534261fa6fd18f6bee8d37f5ccb155ca5202a6

// ── Progress Bar Component ────────────────────────────────────────────────────
function ProgressBar({ assigned, total }) {
  const pct = total > 0 ? Math.min((assigned / total) * 100, 100) : 0
  const color = pct === 100 ? MID_GREEN : pct >= 50 ? GOLD : '#F97316'
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: FOREST }}>Assignment Progress</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {assigned}/{total} subjects assigned
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', 
          width: `${pct}%`, 
          borderRadius: 99, 
          background: color, 
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

// ── Subject Assignment Row ────────────────────────────────────────────────────
function SubjectAssignmentRow({ section, subject, assignment, allFaculty, selectedFaculty, onAssign, onRemove, onSelectChange, checkCompat, subjectsById, facultyById, isComplete }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedFacId, setSelectedFacId] = useState(assignment?.facultyId || '')
  
  const faculty = selectedFacId ? allFaculty.find(f => f.id === Number(selectedFacId)) : null
  const usedUnits = faculty 
    ? getFacultyUnits([assignment || { facultyId: faculty.id }], subjectsById, faculty.id)
    : 0
  const maxUnits = faculty ? getFacultyMaxUnits(faculty) : 0
  const compat = faculty && subject ? checkCompat({ facultyId: faculty.id, subjectId: subject.id, section: '' }) : null
  const unitsTaken = subject?.units || 0
  const wouldExceed = (usedUnits + unitsTaken) > maxUnits
  const canAssign = faculty && !wouldExceed && compat?.ok
  
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        border: `1.5px solid ${assignment ? 'rgba(16,185,129,0.25)' : 'rgba(3,56,38,0.12)'}`,
        background: assignment ? 'rgba(16,185,129,0.04)' : 'rgba(3,56,38,0.01)',
        marginBottom: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: FOREST }}>
              {subject?.code}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(3,56,38,0.6)' }}>
              {subject?.units} units · {subject?.roomType}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)' }}>
            {subject?.title}
          </p>
        </div>

        {assignment ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              <p style={{ margin: 0, fontWeight: 600, color: FOREST }}>
                {facultyById[assignment.facultyId]?.ln}, {facultyById[assignment.facultyId]?.fn}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)', marginTop: 1 }}>
                {facultyById[assignment.facultyId]?.spec || 'No specialization'}
              </p>
            </div>
            <CheckCircle2 size={20} style={{ color: MID_GREEN, flexShrink: 0 }} />
            <button
              onClick={() => onRemove(subject.id)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#991B1B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)' }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(3,56,38,0.08)',
              border: '1px solid rgba(3,56,38,0.15)',
              color: MID_GREEN,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <Plus size={14} />}
          </button>
        )}
      </div>

      {/* Assignment input row */}
      {!assignment && expanded && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(3,56,38,0.03)',
          border: `1.5px solid ${GOLD}30`,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Select Faculty
            </label>
            <select
              value={selectedFacId}
              onChange={e => setSelectedFacId(e.target.value)}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                padding: '8px 32px 8px 11px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: FOREST,
                background: 'rgba(3,56,38,0.05)',
                border: `1.5px solid rgba(3,56,38,0.15)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">— Choose faculty —</option>
              {allFaculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.ln}, {f.fn} ({f.spec || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {faculty && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(3,56,38,0.06)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: FOREST }}>Workload Check</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: wouldExceed ? '#DC2626' : MID_GREEN }}>
                  {usedUnits + unitsTaken}/{maxUnits} units
                </span>
              </div>
              
              {compat && (compat.blockers.length > 0 || compat.notes.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {compat.blockers.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                      <AlertTriangle size={12} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11, color: '#991B1B' }}>{b}</p>
                    </div>
                  ))}
                  {compat.notes.map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.1)' }}>
                      <Info size={12} style={{ color: MID_GREEN, flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 11, color: FOREST }}>{n}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    onAssign(section, subject.id, Number(selectedFacId))
                    setExpanded(false)
                    setSelectedFacId('')
                  }}
                  disabled={!canAssign}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: canAssign ? 'pointer' : 'not-allowed',
                    background: canAssign ? `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` : 'rgba(3,56,38,0.12)',
                    color: canAssign ? '#fff' : 'rgba(3,56,38,0.35)',
                    border: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setExpanded(false)
                    setSelectedFacId('')
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'rgba(3,56,38,0.55)',
                    border: '1px solid rgba(3,56,38,0.15)',
                    transition: 'all 0.15s',
                  }}
                >
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

// ── Section Assignment Card ──────────────────────────────────────────────────
function SectionCard({ section, requiredSubjects, assignments, allFaculty, onAssign, onRemove, checkCompat, subjectsById, facultyById, term, onSubmit, isSubmitting, finalized }) {
  const assignedSubjects = assignments.filter(a => requiredSubjects.some(s => s.id === a.subjectId))
  const completionPct = requiredSubjects.length > 0 ? (assignedSubjects.length / requiredSubjects.length) * 100 : 0
  const isComplete = assignedSubjects.length === requiredSubjects.length
  const isPending = assignments.length > 0 && assignments[0].status === 'pending_review'

  return (
    <div style={{
      borderRadius: 12,
      border: `1.5px solid ${isComplete ? 'rgba(16,185,129,0.25)' : 'rgba(3,56,38,0.12)'}`,
      background: isComplete ? 'rgba(16,185,129,0.03)' : '#fff',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(3,56,38,0.06)',
      transition: 'all 0.15s',
    }}>
      {/* Header */}
      <div style={{
        borderLeft: `3px solid ${isComplete ? MID_GREEN : GOLD}`,
        padding: '16px',
        borderBottom: '1px solid rgba(3,56,38,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>
            {section}
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.5)', marginTop: 4 }}>
            {assignedSubjects.length}/{requiredSubjects.length} subjects assigned
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isPending && <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `rgba(${parseInt(GOLD.slice(1,3),16)},${parseInt(GOLD.slice(3,5),16)},${parseInt(GOLD.slice(5,7),16)},0.15)`, padding: '4px 10px', borderRadius: 6 }}>Pending Review</span>}
          {isComplete && !isPending && <CheckCircle2 size={18} style={{ color: MID_GREEN }} />}
          <span style={{
            minWidth: 24, height: 24, borderRadius: 99,
            background: completionPct === 100 ? `rgba(16,185,129,0.15)` : `rgba(${parseInt(GOLD.slice(1,3),16)},${parseInt(GOLD.slice(3,5),16)},${parseInt(GOLD.slice(5,7),16)},0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: completionPct === 100 ? MID_GREEN : GOLD,
          }}>
            {Math.round(completionPct)}%
          </span>
        </div>
      </div>

      {/* Progress bar and subjects */}
      <div style={{ padding: '16px' }}>
        <ProgressBar assigned={assignedSubjects.length} total={requiredSubjects.length} />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {requiredSubjects.map((subj, idx) => {
            const assignment = assignments.find(a => a.subjectId === subj.id)
            return (
              <SubjectAssignmentRow
                key={subj.id}
                section={section}
                subject={subj}
                assignment={assignment}
                allFaculty={allFaculty}
                onAssign={onAssign}
                onRemove={onRemove}
                checkCompat={checkCompat}
                subjectsById={subjectsById}
                facultyById={facultyById}
                isComplete={isComplete}
              />
            )
          })}
        </div>

        {/* Submit button */}
        {!isPending && isComplete && (
          <button
            onClick={() => onSubmit(section)}
            disabled={isSubmitting}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(3,56,38,0.2)',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all 0.15s',
            }}
          >
            <Send size={14} />
            Submit Section for Review
          </button>
        )}

        {isPending && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.25)` }}>
            <p style={{ margin: 0, fontSize: 12, color: '#065F46', fontWeight: 500 }}>
              ✓ Submitted to Program Head for approval
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get all sections for selected program
  const allSections = useMemo(() => getSections(), [])
  const sectionsForProgram = useMemo(
    () => allSections.filter(s => s.prog === selectedProgram),
    [selectedProgram]
  )

  // Get required subjects for each section
  const sectionRequirements = useMemo(() => {
    const result = {}
    for (const section of sectionsForProgram) {
      const sectionKey = `${section.prog} ${section.yr}${section.lbl}`
      const reqs = subjects.filter(
        s => s.prog === selectedProgram && 
             s.yr === section.yr && 
             s.sem === term.sem
      )
      result[sectionKey] = reqs
    }
    return result
  }, [sectionsForProgram, selectedProgram, term.sem])

  // Get assignments for selected program
  const programAssignments = useMemo(
    () => assignments.filter(a => {
      const subj = subjectsById[a.subjectId]
      return subj?.prog === selectedProgram && a.ay === term.ay
    }),
    [assignments, selectedProgram, term.ay, subjectsById]
  )

  // Get assignments grouped by section
  const assignmentsBySection = useMemo(() => {
    const result = {}
    for (const section of Object.keys(sectionRequirements)) {
      result[section] = programAssignments.filter(a => {
        const assignment = assignments.find(x => x.id === a.id)
        const subj = subjectsById[a.subjectId]
        return assignment && a.section === section || subj?.yr === parseInt(section[section.length - 2])
      })
    }
    return result
  }, [programAssignments, sectionRequirements, assignments, subjectsById])

  const facultyOptions = faculty.filter(f => canTeachProgram(f, selectedProgram))

  function handleAssignSubject(sectionKey, subjectId, facultyId) {
    if (finalized) return
    const section = sectionKey
    const result = createAssignment({ facultyId, subjectId, section }, account)
    if (!result.ok) {
      console.error('Assignment failed:', result.blockers)
    }
  }

  function handleRemoveAssignment(subjectId) {
    if (finalized) return
    const assignment = programAssignments.find(a => a.subjectId === subjectId)
    if (assignment) {
      withdrawAssignment(assignment.id)
    }
  }

  function handleSubmitSection(sectionKey) {
    setIsSubmitting(true)
    // Get all assignments for this section
    const sectionAssignments = programAssignments.filter(a => {
      const reqs = sectionRequirements[sectionKey] || []
      return reqs.some(r => r.id === a.subjectId)
    })
    
    // Mark as pending_review
    sectionAssignments.forEach(a => {
      a.status = 'pending_review'
    })
    
    setTimeout(() => setIsSubmitting(false), 600)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{
          background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={18} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif" }}>
              Assign Teaching Loads by Section
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(220,252,231,0.65)', marginTop: 2 }}>
              AY {term.ay} · {term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} Semester
            </p>
          </div>
          {finalized && (
            <div style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(217,180,74,0.18)', border: `1px solid ${GOLD}50` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>Term Finalized</span>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px' }}>
          {finalized && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 12 }}>
              <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                This term is finalized. New assignments are disabled.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Program
              </label>
              <select
                value={selectedProgram}
                onChange={e => setSelectedProgram(e.target.value)}
                disabled={finalized}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '8px 32px 8px 11px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  color: FOREST,
                  background: 'rgba(3,56,38,0.05)',
                  border: `1.5px solid rgba(3,56,38,0.14)`,
                  outline: 'none',
                  cursor: finalized ? 'not-allowed' : 'pointer',
                  opacity: finalized ? 0.5 : 1,
                  position: 'relative',
                }}
              >
                {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <Filter size={12} style={{ color: 'rgba(3,56,38,0.35)' }} />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  color: FOREST,
                  background: 'rgba(3,56,38,0.05)',
                  border: '1px solid rgba(3,56,38,0.13)',
                  borderRadius: 7,
                  padding: '6px 28px 6px 10px',
                  cursor: 'pointer',
                  outline: 'none',
                  position: 'relative',
                }}
              >
                <option value="ALL">All sections</option>
                <option value="incomplete">Incomplete</option>
                <option value="complete">Complete</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(sectionRequirements).map(([sectionKey, requiredSubjs]) => {
          const sectionAssignments = programAssignments.filter(a => 
            requiredSubjs.some(s => s.id === a.subjectId)
          )
          
          const status = sectionAssignments.length === 0 
            ? 'incomplete'
            : sectionAssignments[0].status === 'pending_review'
            ? 'pending'
            : 'complete'

          if (filterStatus !== 'ALL' && filterStatus !== status) return null

          return (
            <SectionCard
              key={sectionKey}
              section={sectionKey}
              requiredSubjects={requiredSubjs}
              assignments={sectionAssignments}
              allFaculty={facultyOptions}
              onAssign={handleAssignSubject}
              onRemove={handleRemoveAssignment}
              checkCompat={checkCompatibility}
              subjectsById={subjectsById}
              facultyById={facultyById}
              term={term}
              onSubmit={handleSubmitSection}
              isSubmitting={isSubmitting}
              finalized={finalized}
            />
          )
        })}
      </div>
    </div>
  )
}
