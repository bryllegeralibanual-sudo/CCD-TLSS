import { useMemo, useState } from 'react'
import {
  AlertTriangle, BookOpen, CalendarDays, CheckCircle2, Clock3, DoorOpen, Download,
  FlaskConical, Lock, Pencil, Play, Printer, RefreshCw, Save, Settings2, Unlock,
  UserRound, Users, X,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ALL_DAYS = [...CLASS_DAYS, 'Saturday']
const OPEN = 450
const CLOSE = 1290
const SLOT = 30
const OFF_CAMPUS = /(field study|internship|practicum|supervised industrial|work-based learning)/i
const DEFAULT_YEAR_BLOCKS = {
  1: { label: 'Morning', start: 450, end: 720 },
  2: { label: 'Afternoon', start: 720, end: 1020 },
  3: { label: 'Evening', start: 1020, end: 1290 },
  4: { label: 'Flexible', start: 450, end: 1290 },
}
const BLOCK_LABEL_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Flexible']
const TIME_OPTIONS = Array.from({ length: ((CLOSE - OPEN) / SLOT) + 1 }, (_, index) => OPEN + (index * SLOT))
const VIEW_OPTIONS = [
  { value: 'master', label: 'Master', icon: CalendarDays },
  { value: 'section', label: 'Section', icon: BookOpen },
  { value: 'faculty', label: 'Faculty', icon: UserRound },
  { value: 'room', label: 'Room', icon: DoorOpen },
]

function normalizeBlocks(blocks) {
  const source = blocks || {}
  return Object.fromEntries(Object.entries(DEFAULT_YEAR_BLOCKS).map(([year, defaults]) => {
    const block = source[year] || {}
    return [year, {
      label: block.label || defaults.label,
      start: Number(block.start ?? defaults.start),
      end: Number(block.end ?? defaults.end),
    }]
  }))
}

function timeLabel(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function minutesToInput(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function inputToMinutes(value) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function overlaps(a, b) {
  return a.day === b.day && a.start < b.end && b.start < a.end
}

function makeRowId(row) {
  return `${row.assignment.id}-${row.kind}-${row.day}-${row.start}-${row.room?.id || 'room'}`
}

function needsRoom(subject) {
  return !OFF_CAMPUS.test(`${subject?.title || ''} ${subject?.code || ''}`) && ((subject?.lec || 0) > 0 || (subject?.lab || 0) > 0)
}

function isPESubject(subject) {
  return /^PE\b/i.test(subject?.code || '') || /PATH Fit|Physical Education/i.test(subject?.title || '')
}

function isNSTPSubject(subject) {
  return /^NSTP\b/i.test(subject?.code || '') || /National Service Training Program/i.test(subject?.title || '')
}

function isActivityVenue(room) {
  return /gym|social hall/i.test(`${room?.name || ''} ${room?.type || ''}`)
}

function roomMatches(room, roomType, program, subject) {
  if (!roomType || room.status === 'Inactive') return false
  if (isActivityVenue(room) && !isPESubject(subject)) return false
  if (isPESubject(subject) && isActivityVenue(room)) return true
  const typeOk = room.type === roomType || (roomType === 'Classroom' && !/lab/i.test(room.type))
  const ownerOk = !room.prog || room.prog === program
  return typeOk && ownerOk
}

function addUsage(map, key, item) {
  if (!key) return
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(item)
}

function isFree(map, key, candidate) {
  return !(map.get(key) || []).some(item => overlaps(item, candidate))
}

function meetingPatterns(hours) {
  if (hours === 1) return [{ days: ['Monday'], minutes: 60 }]
  if (hours === 2) return [{ days: ['Tuesday', 'Thursday'], minutes: 60 }, { days: ['Monday'], minutes: 120 }]
  if (hours === 3) return [{ days: ['Monday', 'Wednesday', 'Friday'], minutes: 60 }, { days: ['Tuesday', 'Thursday'], minutes: 90 }]
  return [{ days: ['Monday', 'Wednesday', 'Friday'], minutes: Math.ceil((hours * 60) / 3) }]
}

function buildTasks(approved, subjectsById) {
  return approved.flatMap(assignment => {
    const subject = subjectsById[assignment.subjectId]
    if (!subject) return []
    if (!needsRoom(subject)) return [{ kind: 'offcampus', assignment, subject, roomType: '', duration: 0, days: [] }]
    const meetingDays = isNSTPSubject(subject) ? ['Saturday'] : CLASS_DAYS
    const tasks = []
    if (subject.lab > 0) {
      const sessions = subject.lab > 1 ? subject.lab : 1
      for (let i = 0; i < sessions; i += 1) {
        tasks.push({ kind: 'Laboratory', assignment, subject, roomType: subject.labRoomType || 'Classroom', duration: 180, days: meetingDays })
      }
    }
    if (subject.lec > 0 && isNSTPSubject(subject)) {
      tasks.push({ kind: 'Lecture', assignment, subject, roomType: subject.lecRoomType || 'Classroom', duration: subject.lec * 60, days: meetingDays })
    } else if (subject.lec > 0) {
      meetingPatterns(subject.lec).forEach(pattern => {
        pattern.days.forEach(day => tasks.push({ kind: 'Lecture', assignment, subject, roomType: subject.lecRoomType || 'Classroom', duration: pattern.minutes, days: [day] }))
      })
    }
    return tasks
  }).sort((a, b) => b.duration - a.duration || (a.subject.yr || 0) - (b.subject.yr || 0))
}

function unavailableForFaculty(settings, facultyId) {
  return (settings.facultyUnavailable || []).filter(item => String(item.facultyId) === String(facultyId))
}

function preferredWindowForFaculty(faculty) {
  const start = Number(faculty?.preferredTimeStart || 0)
  const end = Number(faculty?.preferredTimeEnd || 0)
  return start && end && start < end ? { start, end } : null
}

function violatesBreaks(settings, candidate) {
  return (settings.scheduleBreaks || []).some(item => overlaps(candidate, item))
}

function roomScore(room, task, settings) {
  const priority = settings.roomPriority || {}
  let score = 0
  if (priority[task.subject.prog] === room.id) score -= 60
  if (room.prog === task.subject.prog) score -= 25
  score += Number(room.capacity || 0) / 10
  return score
}

function makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks, settings }) {
  const roomUse = new Map()
  const facultyUse = new Map()
  const sectionUse = new Map()
  const scheduled = []
  const unscheduled = []
  const offCampus = []
  const tasks = buildTasks(approved, subjectsById)
  const activeRooms = rooms.filter(room => room.status !== 'Inactive')

  for (const task of tasks) {
    if (task.kind === 'offcampus') {
      offCampus.push(task)
      continue
    }

    const block = yearBlocks[task.subject.yr] || yearBlocks[4]
    const fallback = { start: OPEN, end: CLOSE }
    const candidateRooms = activeRooms
      .filter(room => roomMatches(room, task.roomType, task.subject.prog, task.subject))
      .sort((a, b) => roomScore(a, task, settings) - roomScore(b, task, settings) || a.name.localeCompare(b.name))

    if (candidateRooms.length === 0) {
      unscheduled.push({ task, type: /lab/i.test(task.roomType) ? 'missing-lab' : 'missing-room', reason: `No active ${task.roomType} available` })
      continue
    }

    let placed = null
    const facultyWindow = preferredWindowForFaculty(facultyById[task.assignment.facultyId])
    const windows = facultyWindow ? [
      { start: Math.max(block.start, facultyWindow.start), end: Math.min(block.end, facultyWindow.end) },
      block,
      facultyWindow,
      fallback,
    ].filter(window => window.start < window.end) : [block, fallback]

    for (const window of windows) {
      for (const day of task.days) {
        for (let start = window.start; start + task.duration <= window.end; start += SLOT) {
          const candidate = { day, start, end: start + task.duration }
          if (violatesBreaks(settings, candidate)) continue
          if (unavailableForFaculty(settings, task.assignment.facultyId).some(item => overlaps(candidate, item))) continue
          if (!isFree(facultyUse, task.assignment.facultyId, candidate)) continue
          if (!isFree(sectionUse, task.assignment.section, candidate)) continue
          const room = candidateRooms.find(item => isFree(roomUse, item.id, candidate))
          if (room) {
            placed = { ...task, ...candidate, room, faculty: facultyById[task.assignment.facultyId] }
            break
          }
        }
        if (placed) break
      }
      if (placed) break
    }

    if (!placed) {
      unscheduled.push({ task, type: 'no-slot', reason: `No conflict-free slot within ${timeLabel(OPEN)}-${timeLabel(CLOSE)}` })
      continue
    }

    addUsage(roomUse, placed.room.id, placed)
    addUsage(facultyUse, placed.assignment.facultyId, placed)
    addUsage(sectionUse, placed.assignment.section, placed)
    scheduled.push(placed)
  }

  return { scheduled, unscheduled, offCampus }
}

function validateMove(rows, rowId, patch, rooms, settings) {
  const original = rows.find(row => makeRowId(row) === rowId)
  if (!original) return ['Schedule row was not found.']
  const room = rooms.find(item => String(item.id) === String(patch.roomId)) || original.room
  const moved = { ...original, day: patch.day, start: patch.start, end: patch.start + original.duration, room }
  const errors = []
  if (moved.start < OPEN || moved.end > CLOSE) errors.push('Class must stay within operating hours.')
  if (!roomMatches(room, original.roomType, original.subject.prog, original.subject)) errors.push(`${room.name} does not match ${original.roomType}.`)
  if (isNSTPSubject(original.subject) && moved.day !== 'Saturday') errors.push('NSTP classes must be scheduled on Saturday.')
  if (violatesBreaks(settings, moved)) errors.push('Class overlaps a blocked break period.')
  if (unavailableForFaculty(settings, original.assignment.facultyId).some(item => overlaps(moved, item))) errors.push('Faculty is unavailable at that time.')
  rows.filter(row => makeRowId(row) !== rowId).forEach(row => {
    if (!overlaps(row, moved)) return
    if (row.room.id === moved.room.id) errors.push(`${room.name} is already booked.`)
    if (row.assignment.facultyId === moved.assignment.facultyId) errors.push('Faculty has another class at that time.')
    if (row.assignment.section === moved.assignment.section) errors.push('Section has another class at that time.')
  })
  return Array.from(new Set(errors))
}

function groupConflicts(unscheduled = []) {
  const labels = {
    'missing-lab': 'Missing Laboratory',
    'missing-room': 'Missing Classroom',
    'no-slot': 'No Available Slot',
  }
  return Object.entries(unscheduled.reduce((acc, item) => {
    const key = item.type || 'no-slot'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})).map(([key, items]) => ({ key, label: labels[key] || 'Needs Review', items }))
}

function Metric({ icon: Icon, label, value, tone = FOREST }) {
  return (
    <div className="rounded-lg border border-emerald-950/10 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase text-emerald-950/45"><Icon size={14} /> {label}</div>
      <p className="mt-1 text-2xl font-black" style={{ color: tone, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </div>
  )
}

function ScheduleGrid({ rows, onEdit, locked }) {
  const hours = TIME_OPTIONS.filter(value => value < CLOSE)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-emerald-950/10 bg-emerald-950/[0.04] text-[11px] font-black uppercase text-emerald-950/45">
          <div className="px-3 py-2">Time</div>
          {ALL_DAYS.map(day => <div key={day} className="border-l border-emerald-950/10 px-3 py-2">{day}</div>)}
        </div>
        {hours.map(start => (
          <div key={start} className="grid min-h-[68px] grid-cols-[80px_repeat(6,1fr)] border-b border-emerald-950/10">
            <div className="px-3 py-2 text-[11px] font-bold text-emerald-950/55">{timeLabel(start)}</div>
            {ALL_DAYS.map(day => {
              const cellRows = rows.filter(row => row.day === day && row.start === start)
              return (
                <div key={day} className="border-l border-emerald-950/10 p-1.5">
                  {cellRows.map(row => (
                    <button key={makeRowId(row)} type="button" onClick={() => onEdit(row)} disabled={locked} className="mb-1 w-full rounded-md border border-emerald-900/15 bg-emerald-50 px-2 py-1.5 text-left disabled:cursor-default">
                      <p className="truncate text-[11px] font-black text-emerald-950">{row.assignment.section} - {row.subject.code}</p>
                      <p className="text-[10px] font-semibold text-emerald-950/55">{timeLabel(row.start)}-{timeLabel(row.end)} · {row.room.name}</p>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SchedulerPage() {
  const { account } = useAuth()
  const {
    term, assignments, subjectsById, facultyById, faculty, rooms, isTermFinalized,
    settings, setSettings, savedScheduleForTerm, saveScheduleForTerm,
    finalizeScheduleForTerm, reopenScheduleForTerm,
  } = useData()
  const [result, setResult] = useState(null)
  const [program, setProgram] = useState('ALL')
  const [query, setQuery] = useState('')
  const [showAllRows, setShowAllRows] = useState(false)
  const [view, setView] = useState('master')
  const [focusValue, setFocusValue] = useState('ALL')
  const [displayMode, setDisplayMode] = useState('table')
  const [editingRules, setEditingRules] = useState(false)
  const [draftBlocks, setDraftBlocks] = useState(() => normalizeBlocks(settings.scheduleYearBlocks))
  const [editingRow, setEditingRow] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [editErrors, setEditErrors] = useState([])

  const yearBlocks = useMemo(() => normalizeBlocks(settings.scheduleYearBlocks), [settings.scheduleYearBlocks])
  const editableByAdmin = account?.role === 'admin'
  const savedSchedule = savedScheduleForTerm(term.ay, term.sem)
  const scheduleLocked = Boolean(savedSchedule?.finalized)
  const ruleErrors = useMemo(() => Object.entries(draftBlocks).flatMap(([year, block]) => {
    const errors = []
    if (!block.label.trim()) errors.push(`Year ${year} needs a block label.`)
    if (block.start < OPEN || block.end > CLOSE) errors.push(`Year ${year} must stay within ${timeLabel(OPEN)}-${timeLabel(CLOSE)}.`)
    if (block.start >= block.end) errors.push(`Year ${year} start time must be earlier than end time.`)
    return errors
  }), [draftBlocks])

  const approved = useMemo(
    () => assignments.filter(a => a.ay === term.ay && a.status === 'approved' && subjectsById[a.subjectId]?.sem === term.sem),
    [assignments, subjectsById, term.ay, term.sem],
  )
  const termLoads = useMemo(
    () => assignments.filter(a => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem && a.status !== 'withdrawn'),
    [assignments, subjectsById, term.ay, term.sem],
  )
  const blockers = useMemo(() => {
    const out = []
    const notApproved = termLoads.filter(a => !['approved', 'withdrawn'].includes(a.status))
    if (notApproved.length) out.push(`${notApproved.length} teaching load(s) are not approved yet.`)
    if (!isTermFinalized(term.ay, term.sem)) out.push('Registrar has not finalized this term yet.')
    if (!rooms.some(r => r.status !== 'Inactive')) out.push('No active rooms are available.')
    if (scheduleLocked) out.push('Saved schedule is finalized. Reopen it before regenerating.')
    return out
  }, [isTermFinalized, rooms, scheduleLocked, term.ay, term.sem, termLoads])

  const visible = useMemo(() => {
    const rows = result?.scheduled || []
    const q = query.trim().toLowerCase()
    return rows
      .filter(row => program === 'ALL' || row.subject.prog === program)
      .filter(row => view !== 'section' || focusValue === 'ALL' || row.assignment.section === focusValue)
      .filter(row => view !== 'faculty' || focusValue === 'ALL' || String(row.assignment.facultyId) === focusValue)
      .filter(row => view !== 'room' || focusValue === 'ALL' || String(row.room.id) === focusValue)
      .filter(row => !q || `${row.assignment.section} ${row.subject.code} ${row.subject.title} ${row.room.name}`.toLowerCase().includes(q))
      .sort((a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day) || a.start - b.start || a.assignment.section.localeCompare(b.assignment.section))
  }, [focusValue, program, query, result, view])
  const displayRows = showAllRows ? visible : visible.slice(0, 120)
  const sectionOptions = useMemo(() => Array.from(new Set((result?.scheduled || []).map(row => row.assignment.section))).sort(), [result])
  const facultyOptions = useMemo(() => {
    const ids = Array.from(new Set((result?.scheduled || []).map(row => row.assignment.facultyId).filter(Boolean)))
    return ids.map(id => facultyById[id]).filter(Boolean).sort((a, b) => a.ln.localeCompare(b.ln))
  }, [facultyById, result])
  const roomOptions = useMemo(() => {
    const ids = Array.from(new Set((result?.scheduled || []).map(row => row.room.id)))
    return ids.map(id => rooms.find(room => room.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  }, [result, rooms])
  const conflictGroups = useMemo(() => groupConflicts(result?.unscheduled), [result])
  const requiredSections = getSections().filter(section => subjectsById && section)
  const scheduledSections = new Set((result?.scheduled || []).map(row => row.assignment.section))
  const roomMinutes = (result?.scheduled || []).reduce((sum, row) => sum + row.duration, 0)
  const activeRooms = rooms.filter(r => r.status !== 'Inactive').length
  const utilization = activeRooms ? Math.round((roomMinutes / (activeRooms * ALL_DAYS.length * (CLOSE - OPEN))) * 100) : 0

  function generate() {
    setResult(makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks, settings }))
    setShowAllRows(false)
    setFocusValue('ALL')
  }

  function saveCurrentSchedule() {
    if (!result || scheduleLocked) return
    const saved = saveScheduleForTerm({ ...result, yearBlocks, generatedAt: new Date().toISOString() }, account)
    setResult(saved)
  }

  function loadSavedSchedule() {
    if (!savedSchedule) return
    setResult(savedSchedule)
    setShowAllRows(false)
    setFocusValue('ALL')
  }

  function finalizeCurrentSchedule() {
    finalizeScheduleForTerm(term.ay, term.sem, account)
    setResult(prev => prev ? { ...prev, finalized: true, finalizedBy: account?.id || 'system', finalizedAt: new Date().toISOString() } : prev)
  }

  function reopenCurrentSchedule() {
    reopenScheduleForTerm(term.ay, term.sem, account)
    setResult(prev => prev ? { ...prev, finalized: false, finalizedBy: null, finalizedAt: null } : prev)
  }

  function updateDraftBlock(year, field, value) {
    setDraftBlocks(prev => ({ ...prev, [year]: { ...prev[year], [field]: field === 'label' ? value : inputToMinutes(value) } }))
  }

  function saveRules() {
    if (ruleErrors.length) return
    setSettings(prev => ({ ...prev, scheduleYearBlocks: normalizeBlocks(draftBlocks) }))
    setEditingRules(false)
    setResult(null)
  }

  function updateRuleSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setResult(null)
  }

  function addBreak() {
    const next = [...(settings.scheduleBreaks || []), { day: 'Monday', start: 720, end: 780 }]
    updateRuleSetting('scheduleBreaks', next)
  }

  function updateBreak(index, patch) {
    updateRuleSetting('scheduleBreaks', (settings.scheduleBreaks || []).map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function addFacultyUnavailable() {
    const first = faculty[0]
    if (!first) return
    updateRuleSetting('facultyUnavailable', [...(settings.facultyUnavailable || []), { facultyId: first.id, day: 'Monday', start: 450, end: 510 }])
  }

  function updateFacultyUnavailable(index, patch) {
    updateRuleSetting('facultyUnavailable', (settings.facultyUnavailable || []).map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function openEdit(row) {
    if (!editableByAdmin || scheduleLocked) return
    const rowId = makeRowId(row)
    const draft = { rowId, day: row.day, start: row.start, roomId: row.room.id }
    setEditingRow(row)
    setEditDraft(draft)
    setEditErrors(validateMove(result.scheduled, rowId, draft, rooms, settings))
  }

  function updateEdit(patch) {
    const next = { ...editDraft, ...patch }
    setEditDraft(next)
    setEditErrors(validateMove(result.scheduled, editDraft.rowId, next, rooms, settings))
  }

  function applyEdit() {
    if (editErrors.length || !editDraft) return
    const room = rooms.find(item => String(item.id) === String(editDraft.roomId))
    setResult(prev => ({
      ...prev,
      scheduled: prev.scheduled.map(row => makeRowId(row) === editDraft.rowId
        ? { ...row, day: editDraft.day, start: editDraft.start, end: editDraft.start + row.duration, room }
        : row),
      savedAt: null,
      finalized: false,
    }))
    setEditingRow(null)
    setEditDraft(null)
  }

  function exportCsv() {
    const headers = ['Day', 'Start', 'End', 'Section', 'Subject', 'Type', 'Faculty', 'Room']
    const lines = visible.map(row => [
      row.day, timeLabel(row.start), timeLabel(row.end), row.assignment.section, row.subject.code,
      row.kind, row.faculty ? `${row.faculty.ln}, ${row.faculty.fn}` : 'TBA', row.room.name,
    ])
    const csv = [headers, ...lines].map(line => line.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schedule-${term.ay}-${term.sem}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function printSchedule() {
    window.print()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <section className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><CalendarDays size={20} className="text-white" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Class Schedule Generator</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">AY {term.ay} - {term.sem} Semester, {timeLabel(OPEN)} to {timeLabel(CLOSE)}</p>
            </div>
            {savedSchedule && <button type="button" onClick={loadSavedSchedule} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white"><Clock3 size={14} /> Load Saved</button>}
            <button type="button" onClick={exportCsv} disabled={!result} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Download size={14} /> CSV</button>
            <button type="button" onClick={printSchedule} disabled={!result} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Printer size={14} /> Print</button>
            {savedSchedule?.finalized ? (
              <button type="button" onClick={reopenCurrentSchedule} disabled={!editableByAdmin} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Unlock size={14} /> Reopen</button>
            ) : (
              <button type="button" onClick={finalizeCurrentSchedule} disabled={!savedSchedule || !editableByAdmin} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Lock size={14} /> Finalize</button>
            )}
            <button type="button" onClick={saveCurrentSchedule} disabled={!result || !editableByAdmin || scheduleLocked} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Save size={14} /> Save</button>
            <button type="button" onClick={generate} disabled={blockers.length > 0} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-emerald-950 disabled:opacity-50" style={{ background: GOLD }}>{result ? <RefreshCw size={14} /> : <Play size={14} />} Generate</button>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Metric icon={CheckCircle2} label="Approved Loads" value={approved.length} tone={MID_GREEN} />
            <Metric icon={DoorOpen} label="Active Rooms" value={activeRooms} />
            <Metric icon={Clock3} label="Scheduled" value={result?.scheduled.length || 0} tone={MID_GREEN} />
            <Metric icon={AlertTriangle} label="Unscheduled" value={result?.unscheduled.length || 0} tone={(result?.unscheduled.length || 0) ? '#B91C1C' : MID_GREEN} />
            <Metric icon={Users} label="Room Use" value={`${utilization}%`} tone={GOLD} />
          </div>

          {blockers.length > 0 && <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-black text-amber-800"><AlertTriangle size={15} /> Scheduler blocked</p><p className="mt-1 text-xs font-semibold text-amber-800/75">{blockers.join(' ')}</p></div>}
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-emerald-950/10 p-4">
              <div className="flex overflow-hidden rounded-lg border border-emerald-950/10 bg-emerald-950/[0.03]">
                {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => { setView(value); setFocusValue('ALL') }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-black" style={{ background: view === value ? MID_GREEN : 'transparent', color: view === value ? '#fff' : FOREST }}><Icon size={13} /> {label}</button>
                ))}
              </div>
              <div className="flex overflow-hidden rounded-lg border border-emerald-950/10 bg-emerald-950/[0.03]">
                {['table', 'grid'].map(mode => <button key={mode} type="button" onClick={() => setDisplayMode(mode)} className="px-3 py-2 text-xs font-black" style={{ background: displayMode === mode ? GOLD : 'transparent', color: FOREST }}>{mode === 'table' ? 'Table' : 'Weekly Grid'}</button>)}
              </div>
              <select value={program} onChange={e => setProgram(e.target.value)} className="rounded-lg border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
                <option value="ALL">All programs</option>
                {PROGRAMS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              {view === 'section' && <select value={focusValue} onChange={e => setFocusValue(e.target.value)} className="rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none"><option value="ALL">All sections</option>{sectionOptions.map(section => <option key={section} value={section}>{section}</option>)}</select>}
              {view === 'faculty' && <select value={focusValue} onChange={e => setFocusValue(e.target.value)} className="rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none"><option value="ALL">All faculty</option>{facultyOptions.map(item => <option key={item.id} value={item.id}>{item.ln}, {item.fn}</option>)}</select>}
              {view === 'room' && <select value={focusValue} onChange={e => setFocusValue(e.target.value)} className="rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none"><option value="ALL">All rooms</option>{roomOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search section, subject, room" className="min-w-64 flex-1 rounded-lg border border-emerald-950/15 px-3 py-2 text-sm outline-none" />
            </div>
            {displayMode === 'grid' ? (
              <ScheduleGrid rows={visible} onEdit={openEdit} locked={!editableByAdmin || scheduleLocked} />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-emerald-950/[0.04] text-[11px] uppercase text-emerald-950/50"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Action</th></tr></thead>
                  <tbody>
                    {displayRows.map((row, index) => (
                      <tr key={`${makeRowId(row)}-${index}`} className="border-t border-emerald-950/10">
                        <td className="whitespace-nowrap px-4 py-3 font-black text-emerald-950">{row.day}<br /><span className="text-xs font-bold text-emerald-950/55">{timeLabel(row.start)} - {timeLabel(row.end)}</span></td>
                        <td className="px-4 py-3 font-bold text-emerald-950">{row.assignment.section}<br /><span className="text-xs text-emerald-950/50">{yearBlocks[row.subject.yr]?.label}</span></td>
                        <td className="px-4 py-3"><span className="font-black text-emerald-950">{row.subject.code}</span><br /><span className="text-xs font-semibold text-emerald-950/55">{row.kind} - {row.duration / 60} hr</span></td>
                        <td className="px-4 py-3 text-xs font-semibold text-emerald-950/65">{row.faculty ? `${row.faculty.ln}, ${row.faculty.fn}` : 'TBA'}</td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-950">{/lab/i.test(row.room.type) ? <FlaskConical size={13} className="mr-1 inline" /> : <DoorOpen size={13} className="mr-1 inline" />}{row.room.name}</td>
                        <td className="px-4 py-3"><button type="button" onClick={() => openEdit(row)} disabled={!editableByAdmin || scheduleLocked} className="rounded-lg border border-emerald-950/15 px-2.5 py-1.5 text-xs font-black text-emerald-950 disabled:opacity-40"><Pencil size={12} /></button></td>
                      </tr>
                    ))}
                    {visible.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-sm font-bold text-emerald-950/45">{result ? 'No schedule rows match the filters.' : 'Generate or load a schedule.'}</td></tr>}
                    {visible.length > displayRows.length && <tr><td colSpan="6" className="border-t border-emerald-950/10 px-4 py-4 text-center"><button type="button" onClick={() => setShowAllRows(true)} className="rounded-lg border border-emerald-950/15 px-4 py-2 text-xs font-black text-emerald-950">Show all {visible.length} schedule rows</button></td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3">
            <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Saved Schedule</p>
              {savedSchedule ? <><p className="mt-2 text-xs font-semibold text-emerald-950/55">Last saved {new Date(savedSchedule.savedAt).toLocaleString()}</p><p className="mt-1 text-xs font-semibold text-emerald-950/55">{savedSchedule.scheduled?.length || 0} row(s), {savedSchedule.unscheduled?.length || 0} exception(s)</p><p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${savedSchedule.finalized ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{savedSchedule.finalized ? 'Finalized' : 'Editable'}</p></> : <p className="mt-2 text-xs font-semibold text-emerald-950/55">No saved schedule yet.</p>}
            </div>

            <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Rules</p>{editableByAdmin && !editingRules && <button type="button" onClick={() => { setDraftBlocks(yearBlocks); setEditingRules(true) }} className="flex items-center gap-1.5 rounded-lg border border-emerald-950/15 px-2.5 py-1.5 text-[11px] font-black text-emerald-950"><Settings2 size={12} /> Edit</button>}</div>
              {editingRules ? (
                <>
                  {Object.entries(draftBlocks).map(([year, block]) => (
                    <div key={year} className="mt-3 rounded-lg border border-emerald-950/10 p-3">
                      <label className="text-[11px] font-black uppercase text-emerald-950/45">Year {year}</label>
                      <select value={block.label} onChange={e => updateDraftBlock(year, 'label', e.target.value)} className="mt-1 w-full rounded-lg border border-emerald-950/15 bg-white px-2.5 py-2 text-xs font-black text-emerald-950 outline-none">{BLOCK_LABEL_OPTIONS.map(label => <option key={label} value={label}>{label}</option>)}</select>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <select value={minutesToInput(block.start)} onChange={e => updateDraftBlock(year, 'start', e.target.value)} className="rounded-lg border border-emerald-950/15 bg-white px-2 py-2 text-xs font-bold text-emerald-950 outline-none">{TIME_OPTIONS.filter(value => value < block.end).map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
                        <select value={minutesToInput(block.end)} onChange={e => updateDraftBlock(year, 'end', e.target.value)} className="rounded-lg border border-emerald-950/15 bg-white px-2 py-2 text-xs font-bold text-emerald-950 outline-none">{TIME_OPTIONS.filter(value => value > block.start).map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditingRules(false)} className="rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">Cancel</button><button type="button" onClick={saveRules} disabled={ruleErrors.length > 0} className="rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-50" style={{ background: MID_GREEN }}>Save</button></div>
                </>
              ) : Object.entries(yearBlocks).map(([year, block]) => <div key={year} className="mt-3 rounded-lg border border-emerald-950/10 p-3"><p className="text-xs font-black text-emerald-950">Year {year} - {block.label}</p><p className="mt-1 text-xs font-semibold text-emerald-950/55">{timeLabel(block.start)} - {timeLabel(block.end)}</p></div>)}
            </div>

            {editableByAdmin && (
              <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
                <p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Advanced Rules</p>
                <button type="button" onClick={addBreak} className="mt-3 rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">Add Break</button>
                {(settings.scheduleBreaks || []).map((item, index) => <div key={index} className="mt-2 grid grid-cols-3 gap-1"><select value={item.day} onChange={e => updateBreak(index, { day: e.target.value })} className="rounded border px-1 text-xs">{ALL_DAYS.map(day => <option key={day}>{day}</option>)}</select><select value={minutesToInput(item.start)} onChange={e => updateBreak(index, { start: inputToMinutes(e.target.value) })} className="rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select><select value={minutesToInput(item.end)} onChange={e => updateBreak(index, { end: inputToMinutes(e.target.value) })} className="rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select></div>)}
                <button type="button" onClick={addFacultyUnavailable} className="mt-4 rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">Add Faculty Unavailable</button>
                {(settings.facultyUnavailable || []).map((item, index) => <div key={index} className="mt-2 grid grid-cols-2 gap-1"><select value={item.facultyId} onChange={e => updateFacultyUnavailable(index, { facultyId: Number(e.target.value) })} className="rounded border px-1 text-xs">{faculty.map(fac => <option key={fac.id} value={fac.id}>{fac.ln}, {fac.fn}</option>)}</select><select value={item.day} onChange={e => updateFacultyUnavailable(index, { day: e.target.value })} className="rounded border px-1 text-xs">{ALL_DAYS.map(day => <option key={day}>{day}</option>)}</select><select value={minutesToInput(item.start)} onChange={e => updateFacultyUnavailable(index, { start: inputToMinutes(e.target.value) })} className="rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select><select value={minutesToInput(item.end)} onChange={e => updateFacultyUnavailable(index, { end: inputToMinutes(e.target.value) })} className="rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select></div>)}
                <p className="mt-4 text-xs font-black text-emerald-950">Room Priority</p>
                {PROGRAMS.map(item => <select key={item.code} value={(settings.roomPriority || {})[item.code] || ''} onChange={e => updateRuleSetting('roomPriority', { ...(settings.roomPriority || {}), [item.code]: e.target.value ? Number(e.target.value) : '' })} className="mt-2 w-full rounded border px-2 py-1 text-xs"><option value="">{item.label}: no preference</option>{rooms.filter(room => room.status !== 'Inactive').map(room => <option key={room.id} value={room.id}>{item.label}: {room.name}</option>)}</select>)}
              </div>
            )}

            {result && <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm"><p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Conflict Report</p><p className="mt-2 text-xs font-semibold text-emerald-950/55">{result.offCampus.length} off-campus load(s) excluded. {scheduledSections.size}/{requiredSections.length} sections scheduled.</p>{conflictGroups.map(group => <div key={group.key} className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-xs font-black text-red-800">{group.label} · {group.items.length}</p>{group.items.slice(0, 4).map((item, index) => <p key={index} className="mt-1 text-xs font-semibold text-red-700/75">{item.task.assignment.section} - {item.task.subject.code}: {item.reason}</p>)}</div>)}</div>}

            <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm"><p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Programs</p>{PROGRAMS.map(item => <p key={item.code} className="mt-2 text-xs font-bold text-emerald-950/60">{programLabel(item.code)}</p>)}</div>
          </aside>
        </section>
      </div>

      {editingRow && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between"><p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Edit Class Slot</p><button type="button" onClick={() => setEditingRow(null)}><X size={16} /></button></div>
            <p className="mt-2 text-xs font-semibold text-emerald-950/55">{editingRow.assignment.section} · {editingRow.subject.code} · {editingRow.duration / 60} hr</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <select value={editDraft.day} onChange={e => updateEdit({ day: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">{ALL_DAYS.map(day => <option key={day}>{day}</option>)}</select>
              <select value={minutesToInput(editDraft.start)} onChange={e => updateEdit({ start: inputToMinutes(e.target.value) })} className="rounded-lg border px-3 py-2 text-sm">{TIME_OPTIONS.filter(value => value + editingRow.duration <= CLOSE).map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
              <select value={editDraft.roomId} onChange={e => updateEdit({ roomId: Number(e.target.value) })} className="col-span-2 rounded-lg border px-3 py-2 text-sm">{rooms.filter(room => roomMatches(room, editingRow.roomType, editingRow.subject.prog, editingRow.subject)).map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select>
            </div>
            {editErrors.length > 0 && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">{editErrors.map(error => <p key={error} className="text-xs font-bold text-red-800">{error}</p>)}</div>}
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditingRow(null)} className="rounded-lg border px-3 py-2 text-xs font-black">Cancel</button><button type="button" onClick={applyEdit} disabled={editErrors.length > 0} className="rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-50" style={{ background: MID_GREEN }}>Apply</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
