import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, DoorOpen, FlaskConical, Play, RefreshCw, Save, Search, Settings2, Users } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const OPEN = 450
const CLOSE = 1290
const OFF_CAMPUS = /(field study|internship|practicum|supervised industrial|work-based learning)/i
const DEFAULT_YEAR_BLOCKS = {
  1: { label: 'Morning', start: 450, end: 720 },
  2: { label: 'Afternoon', start: 720, end: 1020 },
  3: { label: 'Evening', start: 1020, end: 1290 },
  4: { label: 'Flexible', start: 450, end: 1290 },
}

function normalizeBlocks(blocks) {
  const source = blocks || {}
  return Object.fromEntries(
    Object.entries(DEFAULT_YEAR_BLOCKS).map(([year, defaults]) => {
      const block = source[year] || {}
      return [year, {
        label: block.label || defaults.label,
        start: Number(block.start ?? defaults.start),
        end: Number(block.end ?? defaults.end),
      }]
    }),
  )
}

function timeLabel(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function minutesToInput(minutes) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function inputToMinutes(value) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function overlaps(a, b) {
  return a.day === b.day && a.start < b.end && b.start < a.end
}

function needsRoom(subject) {
  return !OFF_CAMPUS.test(`${subject?.title || ''} ${subject?.code || ''}`) && ((subject?.lec || 0) > 0 || (subject?.lab || 0) > 0)
}

function roomMatches(room, roomType, program) {
  if (!roomType) return false
  if (room.status === 'Inactive') return false
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
    if (!needsRoom(subject)) {
      return [{ kind: 'offcampus', assignment, subject, roomType: '', duration: 0, days: [] }]
    }
    const tasks = []
    if (subject.lab > 0) {
      const sessions = subject.lab > 1 ? subject.lab : 1
      for (let i = 0; i < sessions; i += 1) {
        tasks.push({ kind: 'Laboratory', assignment, subject, roomType: subject.labRoomType || 'Classroom', duration: 180, days: DAYS })
      }
    }
    if (subject.lec > 0) {
      meetingPatterns(subject.lec).forEach(pattern => {
        pattern.days.forEach(day => tasks.push({ kind: 'Lecture', assignment, subject, roomType: subject.lecRoomType || 'Classroom', duration: pattern.minutes, days: [day] }))
      })
    }
    return tasks
  }).sort((a, b) => b.duration - a.duration || (a.subject.yr || 0) - (b.subject.yr || 0))
}

function makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks }) {
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
      .filter(room => roomMatches(room, task.roomType, task.subject.prog))
      .sort((a, b) => Number(a.capacity || 0) - Number(b.capacity || 0) || a.name.localeCompare(b.name))

    if (candidateRooms.length === 0) {
      unscheduled.push({ task, reason: `No active ${task.roomType} available` })
      continue
    }

    let placed = null
    for (const window of [block, fallback]) {
      for (const day of task.days) {
        for (let start = window.start; start + task.duration <= window.end; start += 30) {
          const candidate = { day, start, end: start + task.duration }
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
      unscheduled.push({ task, reason: `No conflict-free slot within ${timeLabel(OPEN)}-${timeLabel(CLOSE)}` })
      continue
    }

    addUsage(roomUse, placed.room.id, placed)
    addUsage(facultyUse, placed.assignment.facultyId, placed)
    addUsage(sectionUse, placed.assignment.section, placed)
    scheduled.push(placed)
  }

  return { scheduled, unscheduled, offCampus }
}

function Metric({ icon: Icon, label, value, tone = FOREST }) {
  return (
    <div className="rounded-lg border border-emerald-950/10 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase text-emerald-950/45"><Icon size={14} /> {label}</div>
      <p className="mt-1 text-2xl font-black" style={{ color: tone, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </div>
  )
}

export default function SchedulerPage() {
  const { account } = useAuth()
  const { term, assignments, subjectsById, facultyById, rooms, isTermFinalized, settings, setSettings } = useData()
  const [result, setResult] = useState(null)
  const [program, setProgram] = useState('ALL')
  const [query, setQuery] = useState('')
  const [showAllRows, setShowAllRows] = useState(false)
  const [editingRules, setEditingRules] = useState(false)
  const [draftBlocks, setDraftBlocks] = useState(() => normalizeBlocks(settings.scheduleYearBlocks))

  const yearBlocks = useMemo(() => normalizeBlocks(settings.scheduleYearBlocks), [settings.scheduleYearBlocks])
  const editableByAdmin = account?.role === 'admin'
  const ruleErrors = useMemo(() => {
    return Object.entries(draftBlocks).flatMap(([year, block]) => {
      const errors = []
      if (!block.label.trim()) errors.push(`Year ${year} needs a block label.`)
      if (block.start < OPEN || block.end > CLOSE) errors.push(`Year ${year} must stay within ${timeLabel(OPEN)}-${timeLabel(CLOSE)}.`)
      if (block.start >= block.end) errors.push(`Year ${year} start time must be earlier than end time.`)
      return errors
    })
  }, [draftBlocks])

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
    return out
  }, [isTermFinalized, rooms, term.ay, term.sem, termLoads])

  const visible = useMemo(() => {
    const rows = result?.scheduled || []
    const q = query.trim().toLowerCase()
    return rows
      .filter(row => program === 'ALL' || row.subject.prog === program)
      .filter(row => !q || `${row.assignment.section} ${row.subject.code} ${row.subject.title} ${row.room.name}`.toLowerCase().includes(q))
      .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start - b.start || a.assignment.section.localeCompare(b.assignment.section))
  }, [program, query, result])
  const displayRows = showAllRows ? visible : visible.slice(0, 120)

  const requiredSections = getSections().filter(section => subjectsById && section)
  const scheduledSections = new Set((result?.scheduled || []).map(row => row.assignment.section))
  const roomMinutes = (result?.scheduled || []).reduce((sum, row) => sum + row.duration, 0)
  const activeRooms = rooms.filter(r => r.status !== 'Inactive').length
  const utilization = activeRooms ? Math.round((roomMinutes / (activeRooms * DAYS.length * (CLOSE - OPEN))) * 100) : 0

  function generate() {
    setResult(makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks }))
    setShowAllRows(false)
  }

  function updateDraftBlock(year, field, value) {
    setDraftBlocks(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: field === 'label' ? value : inputToMinutes(value),
      },
    }))
  }

  function saveRules() {
    if (ruleErrors.length) return
    const nextBlocks = normalizeBlocks(draftBlocks)
    setSettings(prev => ({ ...prev, scheduleYearBlocks: nextBlocks }))
    setEditingRules(false)
    setResult(null)
  }

  function cancelRules() {
    setDraftBlocks(yearBlocks)
    setEditingRules(false)
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
          <button type="button" onClick={generate} disabled={blockers.length > 0} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50" style={{ background: GOLD }}>
            {result ? <RefreshCw size={14} /> : <Play size={14} />} Generate Schedule
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={CheckCircle2} label="Approved Loads" value={approved.length} tone={MID_GREEN} />
          <Metric icon={DoorOpen} label="Active Rooms" value={activeRooms} />
          <Metric icon={Clock3} label="Scheduled" value={result?.scheduled.length || 0} tone={MID_GREEN} />
          <Metric icon={AlertTriangle} label="Unscheduled" value={result?.unscheduled.length || 0} tone={(result?.unscheduled.length || 0) ? '#B91C1C' : MID_GREEN} />
          <Metric icon={Users} label="Room Use" value={`${utilization}%`} tone={GOLD} />
        </div>

        {blockers.length > 0 && (
          <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-amber-800"><AlertTriangle size={15} /> Scheduler prerequisite not met</p>
            <p className="mt-1 text-xs font-semibold text-amber-800/75">{blockers.join(' ')}</p>
          </div>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-emerald-950/10 p-4">
            <select value={program} onChange={e => setProgram(e.target.value)} className="rounded-lg border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
              <option value="ALL">All programs</option>
              {PROGRAMS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
            <div className="relative min-w-64 flex-1">
              <Search size={14} className="absolute left-3 top-3 text-emerald-950/35" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search section, subject, room" className="w-full rounded-lg border border-emerald-950/15 py-2 pl-9 pr-3 text-sm outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-emerald-950/[0.04] text-[11px] uppercase text-emerald-950/50">
                <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Room</th></tr>
              </thead>
              <tbody>
                {displayRows.map((row, index) => (
                  <tr key={`${row.assignment.id}-${row.kind}-${row.day}-${row.start}-${index}`} className="border-t border-emerald-950/10">
                    <td className="whitespace-nowrap px-4 py-3 font-black text-emerald-950">{row.day}<br /><span className="text-xs font-bold text-emerald-950/55">{timeLabel(row.start)} - {timeLabel(row.end)}</span></td>
                    <td className="px-4 py-3 font-bold text-emerald-950">{row.assignment.section}<br /><span className="text-xs text-emerald-950/50">{yearBlocks[row.subject.yr]?.label}</span></td>
                    <td className="px-4 py-3"><span className="font-black text-emerald-950">{row.subject.code}</span><br /><span className="text-xs font-semibold text-emerald-950/55">{row.kind} - {row.duration / 60} hr</span></td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-950/65">{row.faculty ? `${row.faculty.ln}, ${row.faculty.fn}` : 'TBA'}</td>
                    <td className="px-4 py-3 text-xs font-black text-emerald-950">{/lab/i.test(row.room.type) ? <FlaskConical size={13} className="mr-1 inline" /> : <DoorOpen size={13} className="mr-1 inline" />}{row.room.name}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-sm font-bold text-emerald-950/45">{result ? 'No schedule rows match the filters.' : 'Generate a schedule to preview class placements.'}</td></tr>
                )}
                {visible.length > displayRows.length && (
                  <tr>
                    <td colSpan="5" className="border-t border-emerald-950/10 px-4 py-4 text-center">
                      <button type="button" onClick={() => setShowAllRows(true)} className="rounded-lg border border-emerald-950/15 px-4 py-2 text-xs font-black text-emerald-950">
                        Show all {visible.length} schedule rows
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Framework Rules</p>
              {editableByAdmin && !editingRules && (
                <button type="button" onClick={() => { setDraftBlocks(yearBlocks); setEditingRules(true) }} className="flex items-center gap-1.5 rounded-lg border border-emerald-950/15 px-2.5 py-1.5 text-[11px] font-black text-emerald-950">
                  <Settings2 size={12} /> Edit
                </button>
              )}
            </div>

            {editingRules ? (
              <>
                {Object.entries(draftBlocks).map(([year, block]) => (
                  <div key={year} className="mt-3 rounded-lg border border-emerald-950/10 p-3">
                    <label className="text-[11px] font-black uppercase text-emerald-950/45">Year {year} Label</label>
                    <input value={block.label} onChange={e => updateDraftBlock(year, 'label', e.target.value)} className="mt-1 w-full rounded-lg border border-emerald-950/15 px-2.5 py-2 text-xs font-black text-emerald-950 outline-none" />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-black uppercase text-emerald-950/45">Start</label>
                        <input type="time" min={minutesToInput(OPEN)} max={minutesToInput(CLOSE)} value={minutesToInput(block.start)} onChange={e => updateDraftBlock(year, 'start', e.target.value)} className="mt-1 w-full rounded-lg border border-emerald-950/15 px-2 py-2 text-xs font-bold text-emerald-950 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-emerald-950/45">End</label>
                        <input type="time" min={minutesToInput(OPEN)} max={minutesToInput(CLOSE)} value={minutesToInput(block.end)} onChange={e => updateDraftBlock(year, 'end', e.target.value)} className="mt-1 w-full rounded-lg border border-emerald-950/15 px-2 py-2 text-xs font-bold text-emerald-950 outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
                {ruleErrors.length > 0 && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    {ruleErrors.slice(0, 2).map(error => <p key={error} className="text-xs font-bold text-red-800">{error}</p>)}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={cancelRules} className="rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">Cancel</button>
                  <button type="button" onClick={saveRules} disabled={ruleErrors.length > 0} className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: MID_GREEN }}>
                    <Save size={12} /> Save
                  </button>
                </div>
              </>
            ) : (
              Object.entries(yearBlocks).map(([year, block]) => (
                <div key={year} className="mt-3 rounded-lg border border-emerald-950/10 p-3">
                  <p className="text-xs font-black text-emerald-950">Year {year} - {block.label}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-950/55">{timeLabel(block.start)} - {timeLabel(block.end)}</p>
                </div>
              ))
            )}
          </div>

          {result && (
            <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Exceptions</p>
              <p className="mt-2 text-xs font-semibold text-emerald-950/55">{result.offCampus.length} off-campus course load(s) excluded from classroom allocation.</p>
              <p className="mt-2 text-xs font-semibold text-emerald-950/55">{scheduledSections.size}/{requiredSections.length} sections have at least one scheduled class.</p>
              {result.unscheduled.slice(0, 5).map((item, index) => (
                <div key={`${item.task.assignment.id}-${index}`} className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-black text-red-800">{item.task.assignment.section} - {item.task.subject.code}</p>
                  <p className="mt-1 text-xs font-semibold text-red-700/75">{item.reason}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Programs</p>
            {PROGRAMS.map(item => (
              <p key={item.code} className="mt-2 text-xs font-bold text-emerald-950/60">{programLabel(item.code)}</p>
            ))}
          </div>
        </aside>
      </section>
      </div>
    </div>
  )
}
