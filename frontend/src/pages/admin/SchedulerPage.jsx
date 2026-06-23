import { useMemo, useState } from 'react'
import {
  AlertTriangle, CalendarDays, CheckCircle2, Download,
  Filter, Play, RefreshCw, Search, XCircle,
} from 'lucide-react'
import { useData } from '../../data/DataContext'
import { programLabel, SEM_LABELS } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SLOTS = [
  { label: '7:30-9:00', start: 7.5, end: 9 },
  { label: '9:00-10:30', start: 9, end: 10.5 },
  { label: '10:30-12:00', start: 10.5, end: 12 },
  { label: '1:00-2:30', start: 13, end: 14.5 },
  { label: '2:30-4:00', start: 14.5, end: 16 },
  { label: '4:00-5:00', start: 16, end: 17 },
  { label: '5:00-6:30', start: 17, end: 18.5 },
  { label: '6:30-8:00', start: 18.5, end: 20 },
  { label: '8:00-9:30', start: 20, end: 21.5 },
]

const YEAR_SLOT_RULES = {
  1: { label: 'Morning', detail: '7:30 AM-12:00 PM', slots: [0, 1, 2] },
  2: { label: 'Afternoon', detail: '1:00 PM-5:00 PM', slots: [3, 4, 5] },
  3: { label: 'Afternoon to evening', detail: '1:00 PM-9:30 PM', slots: [3, 4, 5, 6, 7, 8] },
  4: { label: 'Flexible', detail: '2:30 PM-9:30 PM', slots: [4, 5, 6, 7, 8] },
}

const ROOMS = [
  { id: 1, name: 'B1-C1', type: 'Classroom', prog: '' },
  { id: 2, name: 'B1-C3', type: 'Classroom', prog: '' },
  { id: 3, name: 'B1-C4', type: 'Classroom', prog: '' },
  { id: 4, name: 'B4-C3', type: 'Classroom', prog: '' },
  { id: 5, name: 'B4-C4', type: 'Classroom', prog: '' },
  { id: 6, name: 'B4-C5', type: 'Classroom', prog: '' },
  { id: 7, name: 'B4-C6', type: 'Classroom', prog: '' },
  { id: 8, name: 'B4-C7', type: 'Classroom', prog: '' },
  { id: 9, name: 'B1-C2 HVACRT LAB', type: 'HVAC Lab', prog: 'BTVTED-HVACRT' },
  { id: 10, name: 'WELDING LABORATORY', type: 'Welding Lab', prog: 'BTVTED-HVACRT' },
  { id: 11, name: 'B4-C1 COMPUTER LAB', type: 'Computer Lab', prog: 'BTVTED-CP' },
  { id: 12, name: 'B4-C2 SPEECH LAB', type: 'Speech Lab', prog: '' },
  { id: 13, name: 'SCIENCE LABORATORY', type: 'Science Lab', prog: '' },
]

function slotDuration(slotIndex) {
  const slot = SLOTS[slotIndex]
  return slot.end - slot.start
}

function formatHour(value) {
  const hour24 = Math.floor(value)
  const mins = Math.round((value - hour24) * 60)
  const hour12 = ((hour24 - 1) % 12) + 1
  return `${hour12}:${String(mins).padStart(2, '0')}`
}

function entryTimeRange(entry) {
  const first = SLOTS[entry.slotIndexes[0]]
  const last = SLOTS[entry.slotIndexes[entry.slotIndexes.length - 1]]
  return `${formatHour(first.start)}-${formatHour(last.end)}`
}

function parseSection(section) {
  const match = section.match(/(.+)\s+(\d)([A-Z])$/)
  return {
    prog: match?.[1] || '',
    yr: Number(match?.[2] || 1),
    lbl: match?.[3] || '',
  }
}

function slotsNeededForHours(startSlot, allowedSlots, requiredHours) {
  const startPos = allowedSlots.indexOf(startSlot)
  if (startPos < 0) return null

  let hours = 0
  const picked = []
  for (let i = startPos; i < allowedSlots.length && hours < requiredHours; i += 1) {
    const slotIndex = allowedSlots[i]
    if (picked.length > 0 && slotIndex !== picked[picked.length - 1] + 1) return null
    picked.push(slotIndex)
    hours += slotDuration(slotIndex)
  }

  return hours >= requiredHours ? picked : null
}

function roomMatches(room, roomType, prog) {
  return room.type === roomType && (!room.prog || room.prog === prog)
}

function buildTasks(approvedAssignments, subjectsById, facultyById) {
  return approvedAssignments.flatMap(assignment => {
    const subject = subjectsById[assignment.subjectId]
    const faculty = facultyById[assignment.facultyId]
    if (!subject || !faculty) return []

    const sectionMeta = parseSection(assignment.section)
    const common = { assignment, subject, faculty, sectionMeta }
    const tasks = []

    if (subject.lec > 0) {
      tasks.push({
        ...common,
        id: `${assignment.id}-lec`,
        component: 'Lecture',
        code: subject.code,
        hours: subject.lec,
        roomType: subject.lecRoomType || 'Classroom',
      })
    }

    if (subject.lab > 0) {
      tasks.push({
        ...common,
        id: `${assignment.id}-lab`,
        component: 'Lab',
        code: `${subject.code}-L`,
        hours: subject.lab * 3,
        roomType: subject.labRoomType || subject.lecRoomType || 'Classroom',
      })
    }

    return tasks
  }).sort((a, b) => {
    const roomScore = Number(a.roomType === 'Classroom') - Number(b.roomType === 'Classroom')
    return roomScore || b.hours - a.hours || a.sectionMeta.yr - b.sectionMeta.yr || a.code.localeCompare(b.code)
  })
}

function makeKey(...parts) {
  return parts.join('|')
}

function findRoom({ rooms, roomType, prog, day, slotIndexes, roomSlots }) {
  return rooms.find(room => {
    if (!roomMatches(room, roomType, prog)) return false
    return slotIndexes.every(slot => !roomSlots.has(makeKey(room.name, day, slot)))
  })
}

function generateSchedule({ approvedAssignments, subjectsById, facultyById }) {
  const tasks = buildTasks(approvedAssignments, subjectsById, facultyById)
  const teacherSlots = new Set()
  const sectionSlots = new Set()
  const roomSlots = new Set()
  const entries = []
  const unscheduled = []

  for (const task of tasks) {
    const allowedSlots = YEAR_SLOT_RULES[task.sectionMeta.yr]?.slots || SLOTS.map((_, i) => i)
    let placed = null

    for (const day of DAYS) {
      if (placed) break

      for (const startSlot of allowedSlots) {
        const slotIndexes = slotsNeededForHours(startSlot, allowedSlots, task.hours)
        if (!slotIndexes) continue

        const teacherBusy = slotIndexes.some(slot => teacherSlots.has(makeKey(task.faculty.id, day, slot)))
        const sectionBusy = slotIndexes.some(slot => sectionSlots.has(makeKey(task.assignment.section, day, slot)))
        if (teacherBusy || sectionBusy) continue

        const room = findRoom({
          rooms: ROOMS,
          roomType: task.roomType,
          prog: task.subject.prog,
          day,
          slotIndexes,
          roomSlots,
        })
        if (!room) continue

        placed = {
          id: task.id,
          assignmentId: task.assignment.id,
          day,
          slotIndexes,
          section: task.assignment.section,
          prog: task.subject.prog,
          code: task.code,
          title: task.subject.title,
          component: task.component,
          room: room.name,
          roomType: room.type,
          facultyId: task.faculty.id,
          facultyName: `${task.faculty.ln}, ${task.faculty.fn}`,
          hours: task.hours,
        }
        break
      }
    }

    if (placed) {
      entries.push(placed)
      placed.slotIndexes.forEach(slot => {
        teacherSlots.add(makeKey(placed.facultyId, placed.day, slot))
        sectionSlots.add(makeKey(placed.section, placed.day, slot))
        roomSlots.add(makeKey(placed.room, placed.day, slot))
      })
    } else {
      unscheduled.push({
        id: task.id,
        section: task.assignment.section,
        code: task.code,
        title: task.subject.title,
        component: task.component,
        facultyName: `${task.faculty.ln}, ${task.faculty.fn}`,
        roomType: task.roomType,
        hours: task.hours,
        reason: `No available ${task.roomType} slot for ${task.hours} hour(s) without teacher, section, or room conflict.`,
      })
    }
  }

  return { entries, unscheduled, generatedAt: new Date().toISOString() }
}

function detectConflicts(entries) {
  const conflicts = []
  const seen = {
    teacher: new Map(),
    section: new Map(),
    room: new Map(),
  }

  entries.forEach(entry => {
    entry.slotIndexes.forEach(slot => {
      const teacherKey = makeKey(entry.facultyId, entry.day, slot)
      const sectionKey = makeKey(entry.section, entry.day, slot)
      const roomKey = makeKey(entry.room, entry.day, slot)

      if (seen.teacher.has(teacherKey)) conflicts.push({ type: 'Teacher conflict', message: `${entry.facultyName} is double-booked on ${entry.day} ${SLOTS[slot].label}.` })
      if (seen.section.has(sectionKey)) conflicts.push({ type: 'Section conflict', message: `${entry.section} has overlapping classes on ${entry.day} ${SLOTS[slot].label}.` })
      if (seen.room.has(roomKey)) conflicts.push({ type: 'Room conflict', message: `${entry.room} is double-booked on ${entry.day} ${SLOTS[slot].label}.` })

      seen.teacher.set(teacherKey, entry.id)
      seen.section.set(sectionKey, entry.id)
      seen.room.set(roomKey, entry.id)
    })
  })

  return conflicts
}

function StatCard({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: { color: FOREST, bg: '#fff', border: 'rgba(3,56,38,0.10)' },
    warning: { color: '#92400E', bg: 'rgba(217,180,74,0.10)', border: 'rgba(217,180,74,0.28)' },
    danger: { color: '#991B1B', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.20)' },
    success: { color: MID_GREEN, bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.22)' },
  }
  const t = tones[tone]

  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, minWidth: 130, flex: '1 1 130px' }}>
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.48)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '5px 0 0', fontSize: 24, lineHeight: 1, color: t.color, fontWeight: 900, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </div>
  )
}

function ReadinessPanel({ finalized, blockers, pendingCount, rejectedCount }) {
  const ready = finalized && blockers.length === 0
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 12,
      border: `1.5px solid ${ready ? 'rgba(16,185,129,0.24)' : 'rgba(217,180,74,0.30)'}`,
      background: ready ? 'rgba(16,185,129,0.06)' : 'rgba(217,180,74,0.10)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      {ready ? <CheckCircle2 size={16} style={{ color: MID_GREEN, marginTop: 1 }} /> : <AlertTriangle size={16} style={{ color: '#B45309', marginTop: 1 }} />}
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: ready ? MID_GREEN : '#92400E' }}>
          {ready ? 'Ready to generate from finalized approved loads' : 'Schedule can be previewed, but load finalization is not clean yet'}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(3,56,38,0.58)', fontWeight: 600 }}>
          {ready
            ? 'The generator will use approved assignments for this term.'
            : `${pendingCount} pending and ${rejectedCount} rejected assignment(s) remain. Registrar finalization should happen before publishing.`}
        </p>
      </div>
    </div>
  )
}

function ScheduleGrid({ entries, selectedProgram, search }) {
  const filtered = entries.filter(entry => {
    const matchesProgram = selectedProgram === 'ALL' || entry.prog === selectedProgram
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${entry.code} ${entry.title} ${entry.section} ${entry.facultyName} ${entry.room}`.toLowerCase().includes(query)
    return matchesProgram && matchesSearch
  })

  return (
    <div style={{ borderRadius: 14, border: '1px solid rgba(3,56,38,0.10)', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 4px rgba(3,56,38,0.05)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'rgba(3,56,38,0.045)' }}>
              <th style={{ width: 96, padding: '10px 8px', textAlign: 'left', color: 'rgba(3,56,38,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
              {DAYS.map(day => (
                <th key={day} style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(3,56,38,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, slotIndex) => (
              <tr key={slot.label} style={{ borderTop: '1px solid rgba(3,56,38,0.07)' }}>
                <td style={{ padding: '8px', verticalAlign: 'top', fontWeight: 800, color: FOREST, whiteSpace: 'nowrap', background: 'rgba(3,56,38,0.018)' }}>{slot.label}</td>
                {DAYS.map(day => {
                  const cellEntries = filtered.filter(entry => entry.day === day && entry.slotIndexes.includes(slotIndex))
                  return (
                    <td key={day} style={{ padding: 6, verticalAlign: 'top', minWidth: 150 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {cellEntries.map(entry => {
                          const startsHere = entry.slotIndexes[0] === slotIndex
                          return (
                            <div key={`${entry.id}-${slotIndex}`} style={{
                              padding: startsHere ? '7px 8px' : '4px 8px',
                              borderRadius: 8,
                              background: startsHere ? 'rgba(15,107,60,0.08)' : 'rgba(15,107,60,0.035)',
                              border: startsHere ? '1px solid rgba(15,107,60,0.18)' : '1px dashed rgba(15,107,60,0.15)',
                              color: FOREST,
                            }}>
                              {startsHere ? (
                                <>
                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 900 }}>{entry.code} <span style={{ color: 'rgba(3,56,38,0.45)' }}>{entry.component}</span></p>
                                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(3,56,38,0.60)' }}>{entry.section} - {entryTimeRange(entry)}</p>
                                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(3,56,38,0.45)' }}>{entry.room}</p>
                                </>
                              ) : (
                                <p style={{ margin: 0, fontSize: 10, color: 'rgba(3,56,38,0.48)', fontWeight: 700 }}>{entry.code} continues</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailPanel({ title, items, empty, tone = 'warning' }) {
  const danger = tone === 'danger'
  return (
    <div style={{ borderRadius: 14, background: '#fff', border: '1px solid rgba(3,56,38,0.10)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(3,56,38,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {danger ? <XCircle size={14} style={{ color: '#DC2626' }} /> : <AlertTriangle size={14} style={{ color: '#B45309' }} />}
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: FOREST }}>{title}</p>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: danger ? '#991B1B' : '#92400E' }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p style={{ margin: 0, padding: 16, fontSize: 12, color: 'rgba(3,56,38,0.42)', fontWeight: 600 }}>{empty}</p>
      ) : (
        <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, idx) => (
            <div key={`${item.id || item.type}-${idx}`} style={{ padding: '9px 10px', borderRadius: 10, background: danger ? 'rgba(220,38,38,0.045)' : 'rgba(217,180,74,0.08)', border: `1px solid ${danger ? 'rgba(220,38,38,0.14)' : 'rgba(217,180,74,0.18)'}` }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: danger ? '#991B1B' : FOREST }}>{item.code || item.type} {item.component ? `- ${item.component}` : ''}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.58)', fontWeight: 600 }}>{item.section || item.message}</p>
              {item.reason && <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(3,56,38,0.45)' }}>{item.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SchedulerPage() {
  const {
    term,
    termAssignments,
    subjectsById,
    facultyById,
    isTermFinalized,
    getFinalizeBlockers,
  } = useData()

  const [schedule, setSchedule] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState('ALL')
  const [search, setSearch] = useState('')

  const termLoads = termAssignments(term.ay, term.sem).filter(a => a.status !== 'withdrawn')
  const approvedLoads = termLoads.filter(a => a.status === 'approved')
  const pendingCount = termLoads.filter(a => a.status === 'pending').length
  const rejectedCount = termLoads.filter(a => a.status === 'rejected').length
  const finalized = isTermFinalized(term.ay, term.sem)
  const blockers = getFinalizeBlockers(term.ay, term.sem)

  const programOptions = useMemo(() => {
    const codes = new Set(approvedLoads.map(a => subjectsById[a.subjectId]?.prog).filter(Boolean))
    return ['ALL', ...Array.from(codes).sort()]
  }, [approvedLoads, subjectsById])

  const generated = schedule || { entries: [], unscheduled: [] }
  const conflicts = useMemo(() => detectConflicts(generated.entries), [generated.entries])
  const totalMeetings = generated.entries.length + generated.unscheduled.length
  const scheduledHours = generated.entries.reduce((sum, entry) => sum + entry.hours, 0)

  function runGenerate() {
    setSchedule(generateSchedule({ approvedAssignments: approvedLoads, subjectsById, facultyById }))
  }

  function clearSchedule() {
    setSchedule(null)
    setSearch('')
    setSelectedProgram('ALL')
  }

  function downloadCsv() {
    const rows = [
      ['Code', 'Component', 'Title', 'Program', 'Section', 'Faculty', 'Day', 'Time', 'Room', 'Hours'],
      ...generated.entries.map(entry => [
        entry.code,
        entry.component,
        entry.title,
        entry.prog,
        entry.section,
        entry.facultyName,
        entry.day,
        entryTimeRange(entry),
        entry.room,
        entry.hours,
      ]),
    ]
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ccd-schedule-${term.ay}-${term.sem}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#ebe9e3' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(3,56,38,0.10)', background: '#fff', boxShadow: '0 1px 4px rgba(3,56,38,0.06)' }}>
          <div style={{ background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={18} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: "'EB Garamond',Georgia,serif" }}>Schedule Generator</p>
              <p style={{ margin: '2px 0 0', color: 'rgba(220,252,231,0.70)', fontSize: 12 }}>AY {term.ay} - {SEM_LABELS[term.sem] || term.sem}</p>
            </div>
            <button type="button" onClick={runGenerate} disabled={approvedLoads.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', borderRadius: 9, padding: '9px 13px', fontSize: 12, fontWeight: 900, color: FOREST, background: approvedLoads.length === 0 ? 'rgba(255,255,255,0.32)' : GOLD, cursor: approvedLoads.length === 0 ? 'not-allowed' : 'pointer' }}>
              <Play size={14} /> Generate
            </button>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ReadinessPanel finalized={finalized} blockers={blockers} pendingCount={pendingCount} rejectedCount={rejectedCount} />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatCard label="Approved Loads" value={approvedLoads.length} tone="success" />
              <StatCard label="Meetings" value={totalMeetings || '-'} />
              <StatCard label="Scheduled" value={generated.entries.length} tone={generated.entries.length ? 'success' : 'neutral'} />
              <StatCard label="Unscheduled" value={generated.unscheduled.length} tone={generated.unscheduled.length ? 'danger' : 'success'} />
              <StatCard label="Conflicts" value={conflicts.length} tone={conflicts.length ? 'danger' : 'success'} />
              <StatCard label="Hours" value={scheduledHours || '-'} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: 240, flex: '1 1 260px' }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: 10, color: 'rgba(3,56,38,0.35)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject, section, faculty, room" style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid rgba(3,56,38,0.13)', borderRadius: 10, padding: '8px 11px 8px 32px', fontSize: 13, outline: 'none', color: FOREST, background: 'rgba(3,56,38,0.035)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Filter size={13} style={{ color: 'rgba(3,56,38,0.38)' }} />
                <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ border: '1.5px solid rgba(3,56,38,0.13)', borderRadius: 10, padding: '8px 30px 8px 11px', fontSize: 13, fontWeight: 700, color: FOREST, background: 'rgba(3,56,38,0.035)', outline: 'none' }}>
                  {programOptions.map(code => <option key={code} value={code}>{code === 'ALL' ? 'All programs' : programLabel(code)}</option>)}
                </select>
              </div>
              <button type="button" onClick={clearSchedule} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid rgba(3,56,38,0.13)', borderRadius: 9, padding: '8px 11px', fontSize: 12, fontWeight: 800, color: FOREST, background: '#fff', cursor: 'pointer' }}>
                <RefreshCw size={13} /> Reset
              </button>
              <button type="button" onClick={downloadCsv} disabled={generated.entries.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', borderRadius: 9, padding: '8px 11px', fontSize: 12, fontWeight: 900, color: '#fff', background: generated.entries.length ? MID_GREEN : 'rgba(3,56,38,0.20)', cursor: generated.entries.length ? 'pointer' : 'not-allowed' }}>
                <Download size={13} /> CSV
              </button>
            </div>
          </div>
        </div>

        {schedule ? (
          <>
            <ScheduleGrid entries={generated.entries} selectedProgram={selectedProgram} search={search} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <DetailPanel title="Unscheduled Meetings" items={generated.unscheduled} empty="Everything found a room and time." tone="danger" />
              <DetailPanel title="Detected Conflicts" items={conflicts} empty="No teacher, room, or section conflicts detected." tone="warning" />
            </div>
          </>
        ) : (
          <div style={{ borderRadius: 16, background: '#fff', border: '1px solid rgba(3,56,38,0.10)', padding: '46px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(3,56,38,0.04)' }}>
            <CalendarDays size={34} style={{ color: MID_GREEN, opacity: 0.45 }} />
            <p style={{ margin: '10px 0 0', fontSize: 15, fontWeight: 900, color: FOREST }}>No generated schedule yet</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(3,56,38,0.48)', fontWeight: 600 }}>Generate a preview from approved loads, then review unscheduled meetings and conflicts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
