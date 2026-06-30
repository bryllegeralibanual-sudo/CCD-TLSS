import { useMemo, useState } from 'react'
import {
  AlertTriangle, BookOpen, CalendarDays, CheckCircle2, Clock3, DoorOpen, Download,
  FlaskConical, Lock, Pencil, Play, Printer, RefreshCw, Save, Settings2, Unlock,
  Trash2, UserRound, Users, X, LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'
import ScheduleViewByProgram from '../../components/ScheduleViewByProgram'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ALL_DAYS = [...CLASS_DAYS, 'Saturday']
const RULE_DAYS = ['Everyday', ...ALL_DAYS]
const OPEN = 450
const CLOSE = 1290
const SLOT = 30
const LUNCH_BREAK = { label: 'Lunch Break', start: 720, end: 780 }
const REQUIRED_BREAKS = ALL_DAYS.map(day => ({ ...LUNCH_BREAK, day }))
const OFF_CAMPUS = /(field study|internship|practicum|supervised industrial|work-based learning)/i
const DEFAULT_YEAR_BLOCKS = {
  1: { label: 'Flexible', start: 450, end: 1290 },
  2: { label: 'Afternoon', start: 720, end: 1020 },
  3: { label: 'Evening', start: 1020, end: 1290 },
  4: { label: 'Flexible', start: 450, end: 1290 },
}
const BLOCK_LABEL_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Flexible']
const TIME_OPTIONS = Array.from({ length: ((CLOSE - OPEN) / SLOT) + 1 }, (_, index) => OPEN + (index * SLOT))
const VIEW_OPTIONS = [
  { value: 'master', label: 'Master', icon: CalendarDays },
  { value: 'program', label: 'Program', icon: LayoutGrid },
  { value: 'section', label: 'Section', icon: BookOpen },
  { value: 'faculty', label: 'Faculty', icon: UserRound },
]

function createTbaRoom() {
  return { id: null, name: 'TBA', type: 'TBA', status: 'Active', capacity: 0 }
}

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

const FULL_DAY_YEAR_BLOCKS = {
  1: { label: 'Flexible', start: OPEN, end: CLOSE },
  2: { label: 'Flexible', start: OPEN, end: CLOSE },
  3: { label: 'Flexible', start: OPEN, end: CLOSE },
  4: { label: 'Flexible', start: OPEN, end: CLOSE },
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

function ruleOverlaps(rule, candidate) {
  return (rule.day === 'Everyday' || rule.day === candidate.day) && rule.start < candidate.end && candidate.start < rule.end
}

function makeRowId(row) {
  return `${row.assignment.id}-${row.kind}-${row.day}-${row.start}-${row.room?.id || 'room'}`
}

function needsRoom(subject) {
  return !OFF_CAMPUS.test(`${subject?.title || ''} ${subject?.code || ''}`) && ((subject?.lec || 0) > 0 || (subject?.lab || 0) > 0)
}

function getSubjectUnitRequirements(subject) {
  const lectureUnits = subject?.lec || 0
  const labUnits = subject?.lab || 0
  return {
    lectureUnits,
    labUnits,
    lectureHours: lectureUnits * 1,
    labHours: labUnits * 3,
    totalHours: lectureUnits * 1 + labUnits * 3,
  }
}

function getScheduledUnitsForAssignment(scheduled, assignmentId, subjectsById) {
  const rows = scheduled.filter(row => row.assignment.id === assignmentId)
  const lectureHours = rows.filter(row => row.kind === 'Lecture').reduce((sum, row) => sum + row.duration / 60, 0)
  const labHours = rows.filter(row => row.kind === 'Laboratory').reduce((sum, row) => sum + row.duration / 60, 0)
  return {
    lectureHours: Math.round(lectureHours * 10) / 10,
    labHours: Math.round(labHours * 10) / 10,
    totalHours: Math.round((lectureHours + labHours) * 10) / 10,
    sessions: rows.map(row => ({ day: row.day, start: timeLabel(row.start), end: timeLabel(row.end), duration: row.duration / 60, kind: row.kind, room: row.room.name })),
  }
}

function validateSubjectUnits(assignment, subject, scheduled) {
  const required = getSubjectUnitRequirements(subject)
  const actual = getScheduledUnitsForAssignment(scheduled, assignment.id, {})
  return {
    lectureMatches: required.lectureUnits === 0 || actual.lectureHours === required.lectureHours,
    labMatches: required.labUnits === 0 || actual.labHours === required.labHours,
    totalMatches: actual.totalHours === required.totalHours,
    required,
    actual,
  }
}

function isPESubject(subject) {
  const text = `${subject?.code || ''} ${subject?.title || ''}`
  return /(^|\s)(PE|P\.E\.?|PATH\s*FIT)\b/i.test(text) || /Physical Education/i.test(text)
}

function isNSTPSubject(subject) {
  return /^NSTP\b/i.test(subject?.code || '') || /National Service Training Program/i.test(subject?.title || '')
}

function isComputerLab(room) {
  return room?.type === 'Computer Lab' || /computer lab/i.test(room?.name || '')
}

function isActivityVenue(room) {
  return /gym|social hall/i.test(`${room?.name || ''} ${room?.type || ''}`)
}

function isRegularClassroom(room) {
  return room?.type === 'Classroom' || room?.type === 'Speech Lab'
}

function roomMatches(room, roomType, program, subject, allowCrossProgramFallback = false, day = null, roomUse = new Map()) {
  if (!roomType || room.status === 'Inactive') return false
  
  // GYM constraint: Saturday is NSTP-only
  const isGym = room.type === 'Gym' || /gym/i.test(room.name)
  if (isGym && day === 'Saturday' && !isNSTPSubject(subject)) return false
  
  // Activity venues are reserved for PE, except NSTP in the gym on Saturday
  if (isActivityVenue(room) && !isPESubject(subject) && !(isGym && isNSTPSubject(subject) && day === 'Saturday')) return false
  if (isPESubject(subject) && isActivityVenue(room)) return true
  const typeOk = room.type === roomType || (roomType === 'Classroom' && isRegularClassroom(room))

  // Computer Lab is EXCLUSIVELY for CP students — never share it with any other program,
  // regardless of whether cross-program fallback is active.
  if (isComputerLab(room) && program !== 'BTVTED-CP') return false

  // For HVAC / Welding labs: HVACRT has priority. Other programs can use them only
  // when the slot is currently vacant (allowCrossProgramFallback=true acts as the
  // "second pass" signal that we already tried program-owned rooms first).
  const isSpecialistLab = ['HVAC Lab', 'Welding Lab'].includes(room.type)
  if (isSpecialistLab && room.prog && room.prog !== program) {
    if (!allowCrossProgramFallback) return false   // first pass: HVACRT-owned slots only for HVACRT
    // second pass: allow other programs only if room is genuinely vacant right now
    const currentlyVacant = (roomUse.get(room.id) || []).length === 0
    if (!currentlyVacant) return false
  }

  // General ownership: rooms with a prog tag go to their owner first;
  // in second pass they're opened up (except Computer Lab & specialist labs handled above).
  const ownerOk = isNSTPSubject(subject) ||
    !room.prog ||
    room.prog === program ||
    allowCrossProgramFallback
  return typeOk && ownerOk
}

function effectiveLabRoomType(subject) {
  if (['BECED', 'BSENTREP'].includes(subject?.prog)) return 'Classroom'
  if (subject?.prog === 'BTVTED-CP') return subject?.labRoomType || 'Computer Lab'
  if (subject?.prog === 'BTVTED-HVACRT') return subject?.labRoomType || 'HVAC Lab'
  return subject?.labRoomType || 'Classroom'
}

function effectiveLectureRoomType(subject) {
  return subject?.lecRoomType || 'Classroom'
}

function policyViolation(row) {
  if (violatesBreaks({ scheduleBreaks: [] }, row)) {
    return `${timeLabel(LUNCH_BREAK.start)} - ${timeLabel(LUNCH_BREAK.end)} is reserved for lunch break.`
  }
  if (row?.kind === 'Laboratory' && effectiveLabRoomType(row.subject) === 'Classroom' && /lab/i.test(row?.room?.type || '') && !isRegularClassroom(row.room)) {
    return `${row.subject.prog} laboratory units must use a regular classroom.`
  }
  const isGym = row?.room && (row.room.type === 'Gym' || /gym/i.test(row.room.name))
  if (row?.room && isActivityVenue(row.room) && !isPESubject(row.subject) && !(isGym && isNSTPSubject(row.subject) && row.day === 'Saturday')) {
    return `${row.room.name} is reserved for P.E. classes only.`
  }
  if (!isNSTPSubject(row?.subject) && row?.day === 'Saturday') {
    return 'Saturday is reserved for NSTP classes only.'
  }
  return ''
}

function applyPolicyGuards(schedule) {
  if (!schedule) return schedule
  const scheduled = []
  const normalizeTask = task => task?.kind === 'Laboratory'
    ? { ...task, roomType: effectiveLabRoomType(task.subject) }
    : task
  const unscheduled = (schedule.unscheduled || []).map(item => {
    const task = normalizeTask(item.task)
    const oldRoomType = item.task?.roomType
    const reason = oldRoomType && oldRoomType !== task?.roomType
      ? String(item.reason || '').replaceAll(oldRoomType, task.roomType)
      : item.reason
    return { ...item, task, reason }
  })
  ;(schedule.scheduled || []).map(normalizeTask).forEach(row => {
    const reason = policyViolation(row)
    if (!reason) {
      scheduled.push(row)
      return
    }
    unscheduled.push({ task: row, type: 'policy-violation', reason })
  })
  return { ...schedule, scheduled, unscheduled }
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
  // Generate diverse meeting patterns to naturally distribute classes throughout the week
  // Priority: more frequent meetings (2-3x/week) to spread load across days and times
  
  if (hours === 1) return [
    { days: ['Monday'], minutes: 60 },
    { days: ['Tuesday'], minutes: 60 },
    { days: ['Wednesday'], minutes: 60 },
    { days: ['Thursday'], minutes: 60 },
    { days: ['Friday'], minutes: 60 },
  ]
  
  if (hours === 2) return [
    { days: ['Tuesday', 'Thursday'], minutes: 60 },
    { days: ['Monday', 'Wednesday'], minutes: 60 },
    { days: ['Monday', 'Friday'], minutes: 60 },
    { days: ['Wednesday', 'Friday'], minutes: 60 },
    { days: ['Monday'], minutes: 120 },
    { days: ['Friday'], minutes: 120 },
  ]
  
  if (hours === 3) return [
    // PRIMARY: MWF (3x/week, 1h each - best distribution)
    { days: ['Monday', 'Wednesday', 'Friday'], minutes: 60 },
    // Secondary: Other 3x/week patterns
    { days: ['Monday', 'Tuesday', 'Wednesday'], minutes: 60 },
    { days: ['Tuesday', 'Wednesday', 'Thursday'], minutes: 60 },
    { days: ['Wednesday', 'Thursday', 'Friday'], minutes: 60 },
    // Fallback: 2-meeting patterns (90min each)
    { days: ['Tuesday', 'Thursday'], minutes: 90 },
    { days: ['Monday', 'Wednesday'], minutes: 90 },
    { days: ['Monday', 'Friday'], minutes: 90 },
    { days: ['Wednesday', 'Friday'], minutes: 90 },
    // Last resort: Compressed (single or 2-day)
    { days: ['Tuesday', 'Thursday'], minutes: 180 },
    { days: ['Monday', 'Friday'], minutes: 180 },
  ]
  
  // For hours >= 4, distribute heavily across the week
  return [
    // Best: distributed across 3-4 days
    { days: ['Monday', 'Tuesday', 'Thursday'], minutes: Math.ceil((hours * 60) / 3) },
    { days: ['Monday', 'Wednesday', 'Friday'], minutes: Math.ceil((hours * 60) / 3) },
    { days: ['Tuesday', 'Wednesday', 'Thursday'], minutes: Math.ceil((hours * 60) / 3) },
    { days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], minutes: Math.ceil((hours * 60) / 4) },
    // Fallback: 2-day patterns
    { days: ['Tuesday', 'Thursday'], minutes: Math.ceil((hours * 60) / 2) },
    { days: ['Monday', 'Wednesday'], minutes: Math.ceil((hours * 60) / 2) },
  ]
}

function sectionSortValue(section = '') {
  const match = section.match(/(\d+)([A-Z])?$/i)
  return match ? `${section.replace(/\s*\d+[A-Z]?$/i, '')}-${match[1].padStart(2, '0')}-${match[2] || ''}` : section
}

function calculateSchedulingDifficulty(subject) {
  // Higher score = schedule first (scarcer resources)
  // Difficulty tier: Labs (hardest) > NSTP > Year 1 > Year 2 > Year 3 > Year 4 (easiest)
  
  let difficulty = 0
  
  // Labs are hardest to place (limited lab rooms)
  if (subject.lab > 0) difficulty += 1000
  
  // NSTP is constrained (Saturday only)
  if (isNSTPSubject(subject)) difficulty += 900
  
  // Year priority: lower year = higher priority (schedule first)
  const yearPriority = {
    1: 800,
    2: 600,
    3: 400,
    4: 200,
  }
  difficulty += yearPriority[subject.yr] || 200
  
  return difficulty
}

function scheduleNSTPSchoolWide(approved, subjectsById, facultyById) {
  const nstpScheduled = []
  const remainingApprovals = []
  const room = createTbaRoom()

  const nstpBySubject = new Map()
  const regularApprovals = []

  for (const assignment of approved) {
    const subject = subjectsById[assignment.subjectId]
    if (!subject || !isNSTPSubject(subject)) {
      regularApprovals.push(assignment)
      continue
    }

    const key = subject.code
    if (!nstpBySubject.has(key)) {
      nstpBySubject.set(key, { subject, assignments: [] })
    }
    nstpBySubject.get(key).assignments.push(assignment)
  }

  const nstpStartTime = 900

  for (const [, { subject, assignments }] of nstpBySubject) {
    const duration = Math.max((subject.lec || 0) * 60, (subject.lab || 0) * 180)

    for (const assignment of assignments) {
      nstpScheduled.push({
        kind: 'Lecture',
        assignment,
        subject,
        day: 'Saturday',
        start: nstpStartTime,
        end: nstpStartTime + duration,
        duration,
        room,
        faculty: facultyById[assignment.facultyId] || null,
        isNSTP: true,
      })
    }
  }

  return { nstpScheduled, remainingApprovals: regularApprovals }
}

function buildTaskGroups(approved, subjectsById) {
  // Filter out NSTP assignments - they're handled separately by scheduleNSTPSchoolWide
  return approved
    .filter(assignment => {
      const subject = subjectsById[assignment.subjectId]
      return subject && !isNSTPSubject(subject)
    })
    .map(assignment => {
      const subject = subjectsById[assignment.subjectId]
      if (!subject) return null
      if (!needsRoom(subject)) return { assignment, subject, offCampus: true, labTasks: [], lectureOptions: [], difficulty: 0 }
      const meetingDays = CLASS_DAYS
      const labTasks = []
      if (subject.lab > 0) {
        const labDurationMinutes = subject.lab * 180
        labTasks.push({ 
          kind: 'Laboratory', 
          assignment, 
          subject, 
          roomType: effectiveLabRoomType(subject), 
          duration: labDurationMinutes, 
          days: meetingDays 
        })
      }
      let lectureOptions = []
      if (subject.lec > 0) {
      lectureOptions = meetingPatterns(subject.lec).map(pattern => (
        pattern.days.map(day => ({ kind: 'Lecture', assignment, subject, roomType: effectiveLectureRoomType(subject), duration: pattern.minutes, days: [day] }))
      ))
    }
    const difficulty = calculateSchedulingDifficulty(subject)
    return { assignment, subject, offCampus: false, labTasks, lectureOptions, difficulty }
  }).filter(Boolean).sort((a, b) => (
    // Sort by difficulty first (harder items scheduled first)
    b.difficulty - a.difficulty
    // Then by section within same difficulty
    || sectionSortValue(a.assignment.section).localeCompare(sectionSortValue(b.assignment.section))
    // Then by subject code
    || a.subject.code.localeCompare(b.subject.code)
  ))
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
  return [...REQUIRED_BREAKS, ...(settings.scheduleBreaks || [])].some(item => ruleOverlaps(item, candidate))
}

function roomScore(room, task, settings, roomUse = new Map()) {
  const priority = settings.roomPriority || {}
  let score = 0
  
  // Priority: admin-designated room (lowest score = most preferred)
  if (priority[task.subject.prog] === room.id) score -= 60
  
  // HVACRT sections should prefer HVAC and Welding labs
  if (task.subject.prog === 'BTVTED-HVACRT' && ['HVAC Lab', 'Welding Lab'].includes(room.type)) score -= 40
  
  // Program ownership (prefer program's own room) - skip for NSTP (school-wide)
  if (!isNSTPSubject(task.subject) && room.prog === task.subject.prog) score -= 25
  
  // Capacity bonus (smaller capacity for better fit)
  score += Number(room.capacity || 0) / 10
  
  // Utilization penalty: prefer less-used rooms to spread load, but keep
  // the penalty modest so type/program fit still dominates the decision.
  const roomBookings = roomUse.get(room.id) || []
  score += roomBookings.length * 10

  return score
}

function removeUsage(map, key, item) {
  if (!key || !map.has(key)) return
  map.set(key, map.get(key).filter(existing => existing !== item))
}

function roomCandidates(activeRooms, task, settings, allowCrossProgramFallback = false, roomUse = new Map(), day = null) {
  return activeRooms
    .filter(room => roomMatches(room, task.roomType, task.subject.prog, task.subject, allowCrossProgramFallback, day, roomUse))
    .sort((a, b) => roomScore(a, task, settings, roomUse) - roomScore(b, task, settings, roomUse) || a.name.localeCompare(b.name))
}

function startCandidates(window, duration) {
  const starts = []
  for (let start = window.start; start + duration <= window.end; start += SLOT) starts.push(start)
  return starts
}

// placeTask: single-day placement (used for labs and single-meeting lectures).
// activeRooms and roomUse were already in context but never destructured here —
// that was the root cause of every class getting "TBA" and zero room tracking.
function placeTask(task, { activeRooms, facultyById, facultyUse, sectionUse, roomUse, yearBlocks, settings }, allowCrossProgramFallback = false) {
  const block = yearBlocks[task.subject.yr] || yearBlocks[4]
  const facultyWindow = preferredWindowForFaculty(facultyById[task.assignment.facultyId])
  const windows = facultyWindow ? [
    { start: Math.max(block.start, facultyWindow.start), end: Math.min(block.end, facultyWindow.end) },
    block,
  ].filter(window => window.start < window.end) : [block]

  for (const window of windows) {
    for (const day of task.days) {
      for (const start of startCandidates(window, task.duration)) {
        const candidate = { day, start, end: start + task.duration }
        if (violatesBreaks(settings, candidate)) continue
        if (unavailableForFaculty(settings, task.assignment.facultyId).some(item => ruleOverlaps(item, candidate))) continue
        if (!isFree(facultyUse, task.assignment.facultyId, candidate)) continue
        if (!isFree(sectionUse, task.assignment.section, candidate)) continue

        // Find a room that is actually free at this day+time.
        // roomCandidates() is already sorted by preference (program-owned first, least-used first).
        const pool = roomCandidates(activeRooms || [], task, settings, allowCrossProgramFallback, roomUse, day)
        const room = pool.find(r => isFree(roomUse, r.id, candidate))
        if (!room) continue   // No room free at this slot — try the next start time

        return {
          placed: {
            ...task,
            ...candidate,
            room,
            faculty: facultyById[task.assignment.facultyId],
          },
          error: null,
        }
      }
    }
  }

  return { placed: null, error: { task, type: 'no-slot', reason: `No available ${task.roomType} slot within Year ${task.subject.yr} ${block.label} block (${timeLabel(block.start)}–${timeLabel(block.end)})` } }
}

// placeMultiDayTask: atomic placement for MWF / TTH lecture patterns.
// Finds a single (startTime, room) pair that is free on ALL meeting days simultaneously,
// so the same room is guaranteed across every session of the pattern.
function placeMultiDayTask(task, days, { activeRooms, facultyById, facultyUse, sectionUse, roomUse, yearBlocks, settings }, allowCrossProgramFallback = false) {
  const block = yearBlocks[task.subject.yr] || yearBlocks[4]
  const facultyWindow = preferredWindowForFaculty(facultyById[task.assignment.facultyId])
  const windows = facultyWindow ? [
    { start: Math.max(block.start, facultyWindow.start), end: Math.min(block.end, facultyWindow.end) },
    block,
  ].filter(w => w.start < w.end) : [block]

  const facUnavailable = unavailableForFaculty(settings, task.assignment.facultyId)

  for (const window of windows) {
    for (const start of startCandidates(window, task.duration)) {
      const end = start + task.duration
      const candidates = days.map(day => ({ day, start, end }))

      // Every day must pass break, faculty-unavailable, faculty-free, and section-free checks
      if (candidates.some(c => violatesBreaks(settings, c))) continue
      if (candidates.some(c => facUnavailable.some(rule => ruleOverlaps(rule, c)))) continue
      if (!candidates.every(c => isFree(facultyUse, task.assignment.facultyId, c))) continue
      if (!candidates.every(c => isFree(sectionUse, task.assignment.section, c))) continue

      // Find one room that is free on ALL meeting days at this time.
      // Using days[0] for day-specific room filters (e.g. gym on Saturdays).
      const pool = roomCandidates(activeRooms || [], task, settings, allowCrossProgramFallback, roomUse, days[0])
      const room = pool.find(r => candidates.every(c => isFree(roomUse, r.id, c)))
      if (!room) continue  // Same room not available on all days — try next start time

      const faculty = facultyById[task.assignment.facultyId]
      return {
        placed: candidates.map(c => ({ ...task, ...c, room, faculty })),
        error: null,
      }
    }
  }

  return {
    placed: null,
    error: { task, type: 'no-slot', reason: `No ${days.join('/')} slot with an available ${task.roomType} in Year ${task.subject.yr} ${block.label} block (${timeLabel(block.start)}–${timeLabel(block.end)})` },
  }
}

function commitPlaced(item, maps, scheduled) {
  addUsage(maps.roomUse, item.room.id, item)
  addUsage(maps.facultyUse, item.assignment.facultyId, item)
  addUsage(maps.sectionUse, item.assignment.section, item)
  scheduled.push(item)
}

function rollbackPlaced(items, maps, scheduled) {
  items.forEach(item => {
    removeUsage(maps.roomUse, item.room.id, item)
    removeUsage(maps.facultyUse, item.assignment.facultyId, item)
    removeUsage(maps.sectionUse, item.assignment.section, item)
  })
  scheduled.splice(scheduled.length - items.length, items.length)
}

function makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks, settings }) {
  const roomUse = new Map()
  const facultyUse = new Map()
  const sectionUse = new Map()
  const scheduled = []
  const unscheduled = []
  const offCampus = []
  const activeRooms = rooms.filter(room => room.status !== 'Inactive')
  const maps = { roomUse, facultyUse, sectionUse }
  const context = { activeRooms, facultyById, roomUse, facultyUse, sectionUse, yearBlocks, settings }

  // FIRST: Schedule NSTP school-wide on the shared timetable before regular courses.
  const { nstpScheduled, remainingApprovals } = scheduleNSTPSchoolWide(approved, subjectsById, facultyById)
  scheduled.push(...nstpScheduled)

  // THEN: Build and schedule regular courses
  const groups = buildTaskGroups(remainingApprovals, subjectsById)

  // First pass: strict program-owned room preference
  for (const group of groups) {
    if (group.offCampus) {
      offCampus.push({ kind: 'offcampus', assignment: group.assignment, subject: group.subject, roomType: '', duration: 0, days: [] })
      continue
    }

    let lecturePlaced = []
    if (group.lectureOptions.length) {
      let lastError = null
      for (const option of group.lectureOptions) {
        // Multi-day options (MWF, TTH, etc.) are placed atomically so the same
        // room is guaranteed on every meeting day — avoids phantom room waste.
        const optionDays = option.map(t => t.days[0])
        const isMultiDay = optionDays.length > 1 && new Set(optionDays).size === optionDays.length
        
        if (isMultiDay) {
          // Use placeMultiDayTask for atomic room+time lock across all days
          const representativeTask = { ...option[0], days: optionDays }
          const { placed: multiPlaced, error } = placeMultiDayTask(representativeTask, optionDays, context, false)
          if (multiPlaced) {
            multiPlaced.forEach(p => commitPlaced(p, maps, scheduled))
            lecturePlaced = multiPlaced
            break
          }
          lastError = error
        } else {
          // Single-day or already-split tasks: place each session individually
          const optionPlaced = []
          let failed = null
          for (const task of option) {
            const { placed, error } = placeTask(task, context, false)
            if (!placed) { failed = error; break }
            commitPlaced(placed, maps, scheduled)
            optionPlaced.push(placed)
          }
          if (!failed) { lecturePlaced = optionPlaced; break }
          rollbackPlaced(optionPlaced, maps, scheduled)
          lastError = failed
        }
      }
      if (!lecturePlaced.length) {
        unscheduled.push(lastError || { task: group.lectureOptions[0][0], type: 'no-slot', reason: 'No lecture pattern could be placed.' })
        continue
      }
    }

    for (const task of group.labTasks) {
      const { placed, error } = placeTask(task, context, false)
      if (!placed) {
        unscheduled.push(error)
        continue
      }
      commitPlaced(placed, maps, scheduled)
    }
  }

  // Second pass: retry unscheduled tasks with cross-program room fallback
  const secondPassCandidates = unscheduled.filter(item => item.type === 'no-slot' || item.type === 'missing-room')
  const retryTasks = []
  secondPassCandidates.forEach(item => {
    if (item.task.kind === 'Lecture') {
      retryTasks.push(item.task)
    } else if (item.task.kind === 'Laboratory') {
      retryTasks.push(item.task)
    }
  })

  const retried = new Set()
  for (const task of retryTasks) {
    // Try multi-day atomic placement first for lecture tasks that had multiple days
    if (task.kind === 'Lecture' && task.days && task.days.length > 1) {
      const { placed: multiPlaced } = placeMultiDayTask(task, task.days, context, true)
      if (multiPlaced) {
        multiPlaced.forEach(p => commitPlaced(p, maps, scheduled))
        retried.add(`${task.assignment.id}-${task.kind}`)
        continue
      }
    }
    const { placed } = placeTask(task, context, true)
    if (placed) {
      commitPlaced(placed, maps, scheduled)
      retried.add(`${task.assignment.id}-${task.kind}`)
    }
  }

  // Update unscheduled list to remove successfully retried items
  unscheduled.splice(0, unscheduled.length, ...unscheduled.filter(item => {
    const key = `${item.task.assignment.id}-${item.task.kind}`
    return !retried.has(key)
  }))

  return { scheduled, unscheduled, offCampus }
}

function validateMove(rows, rowId, patch, rooms, settings, yearBlocks) {
  const original = rows.find(row => makeRowId(row) === rowId)
  if (!original) return ['Schedule row was not found.']
  const moved = { ...original, day: patch.day, start: patch.start, end: patch.start + original.duration, room: original.room || createTbaRoom() }
  const block = yearBlocks?.[original.subject.yr] || yearBlocks?.[4]
  const errors = []
  if (moved.start < OPEN || moved.end > CLOSE) errors.push('Class must stay within operating hours.')
  if (block && (moved.start < block.start || moved.end > block.end)) errors.push(`Class must stay within Year ${original.subject.yr} ${block.label} (${timeLabel(block.start)}-${timeLabel(block.end)}).`)
  const policyError = policyViolation(moved)
  if (policyError) errors.push(policyError)
  if (isNSTPSubject(original.subject) && moved.day !== 'Saturday') errors.push('NSTP classes must be scheduled on Saturday.')
  if (!isNSTPSubject(original.subject) && moved.day === 'Saturday') errors.push('Saturday is reserved for NSTP classes only.')
  if (violatesBreaks(settings, moved)) errors.push('Class overlaps a blocked break period.')
  if (unavailableForFaculty(settings, original.assignment.facultyId).some(item => ruleOverlaps(item, moved))) errors.push('Faculty is unavailable at that time.')
  rows.filter(row => makeRowId(row) !== rowId).forEach(row => {
    if (!overlaps(row, moved)) return
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
    'policy-violation': 'Policy Violation',
  }
  return Object.entries(unscheduled.reduce((acc, item) => {
    const key = item.type || 'no-slot'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})).map(([key, items]) => ({ key, label: labels[key] || 'Needs Review', items }))
}

function isLabRow(row) {
  return row?.kind === 'Laboratory' || /lab/i.test(`${row?.roomType || ''} ${row?.room?.type || ''}`)
}

function scheduleTone(row) {
  return isLabRow(row)
    ? 'border-amber-300 bg-amber-100 text-amber-950'
    : 'border-emerald-900/15 bg-emerald-50 text-emerald-950'
}

function getYearColor(year) {
  // Color scheme by year level
  const yearColors = {
    1: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', label: 'Year 1' },
    2: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', label: 'Year 2' },
    3: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', label: 'Year 3' },
    4: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', label: 'Year 4' },
  }
  return yearColors[year] || { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900', label: 'Unknown' }
}

function Metric({ icon: Icon, label, value, tone = FOREST }) {
  return (
    <div className="rounded-lg border border-emerald-950/10 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase text-emerald-950/45"><Icon size={14} /> {label}</div>
      <p className="mt-1 text-2xl font-black" style={{ color: tone, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </div>
  )
}

function ScheduleGrid({ rows, onEdit, locked, days }) {
  const hours = TIME_OPTIONS.filter(value => value < CLOSE)
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[920px] table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: 84 }} />
          {days.map(day => <col key={day} />)}
        </colgroup>
        <thead>
          <tr className="bg-emerald-950/[0.04] text-[11px] font-black uppercase text-emerald-950/45">
            <th className="border border-emerald-950/10 px-3 py-2">Time</th>
            {days.map(day => <th key={day} className="border border-emerald-950/10 px-3 py-2">{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {hours.map(start => (
            <tr key={start} className="h-[68px] align-top">
              <th className="border border-emerald-950/10 px-3 py-2 text-[11px] font-bold text-emerald-950/55">{timeLabel(start)}</th>
              {days.map(day => {
                const cellRows = rows.filter(row => row.day === day && row.start === start)
                return (
                  <td key={day} className="border border-emerald-950/10 p-1.5 align-top">
                    {cellRows.map(row => (
                      <button key={makeRowId(row)} type="button" onClick={() => onEdit(row)} disabled={locked} className={`mb-1 w-full rounded-md border px-2 py-1.5 text-left disabled:cursor-default ${scheduleTone(row)}`}>
                        <p className="truncate text-[11px] font-black">{row.assignment.section} - {row.subject.code}</p>
                        <p className="truncate text-[10px] font-semibold opacity-70">{timeLabel(row.start)}-{timeLabel(row.end)} - {row.room.name}</p>
                        <p className="text-[9px] opacity-60">{row.kind} - {row.duration / 60}h</p>
                      </button>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RoomOccupancyGrid({ rows, rooms, days, selectedSection, onSectionChange, sectionOptions }) {
  const filteredRows = useMemo(() => {
    if (!selectedSection || selectedSection === 'ALL') return rows
    return rows.filter(row => row.assignment.section === selectedSection)
  }, [rows, selectedSection])

  const roomRows = useMemo(() => {
    const ids = Array.from(new Set(filteredRows.map(row => String(row.room.id))))
    return ids.map(id => rooms.find(room => String(room.id) === id)).filter(Boolean)
  }, [filteredRows, rooms])

  const occupancyByRoom = useMemo(() => {
    const totals = {}
    roomRows.forEach(room => {
      const roomRowsForRoom = filteredRows.filter(row => String(row.room.id) === String(room.id))
      const usedSlots = roomRowsForRoom.reduce((sum, row) => sum + (row.end - row.start) / SLOT, 0)
      const totalSlots = days.length * ((CLOSE - OPEN) / SLOT)
      const rate = totalSlots ? usedSlots / totalSlots : 0
      let state = 'vacant'
      if (usedSlots > 0 && rate >= 0.75) state = 'fully-occupied'
      else if (usedSlots > 0) state = 'occupied'
      totals[String(room.id)] = { state, rate, usedSlots, totalSlots }
    })
    return totals
  }, [days.length, filteredRows, roomRows])

  const occupancySummary = useMemo(() => Object.values(occupancyByRoom).reduce((acc, item) => {
    if (item.state === 'fully-occupied') acc.fullyOccupied += 1
    else if (item.state === 'occupied') acc.occupied += 1
    else acc.vacant += 1
    return acc
  }, { vacant: 0, occupied: 0, fullyOccupied: 0 }), [occupancyByRoom])

  if (!filteredRows.length) {
    return (
      <div className="p-4 text-sm font-semibold text-emerald-950/55">
        No room occupancy is available for the selected filters.
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-emerald-950">Room Occupancy</p>
          <p className="text-xs font-semibold text-emerald-950/55">View which rooms are occupied during class hours and filter by section.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 text-[11px] font-black">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">Vacant: {occupancySummary.vacant}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">Occupied: {occupancySummary.occupied}</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-800">Fully occupied: {occupancySummary.fullyOccupied}</span>
          </div>
          <select value={selectedSection} onChange={e => onSectionChange(e.target.value)} className="rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
            <option value="ALL">All sections</option>
            {sectionOptions.map(section => <option key={section} value={section}>{section}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-emerald-950/10">
        <table className="min-w-[920px] w-full table-fixed border-collapse text-left text-xs">
          <thead>
            <tr className="bg-emerald-950/[0.03] text-[11px] font-black uppercase text-emerald-950/45">
              <th className="border border-emerald-950/10 px-3 py-2">Room</th>
              {days.map(day => <th key={day} className="border border-emerald-950/10 px-3 py-2">{day}</th>)}
            </tr>
            <tr className="bg-emerald-950/[0.02]">
              <td className="border border-emerald-950/10 px-3 py-2" colSpan={days.length + 1}>
                <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-blue-100 border border-blue-300"></span>Year 1</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-green-100 border border-green-300"></span>Year 2</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-orange-100 border border-orange-300"></span>Year 3</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-purple-100 border border-purple-300"></span>Year 4</span>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {roomRows.map(room => {
              const occupancy = occupancyByRoom[String(room.id)] || { state: 'vacant', rate: 0 }
              const roomTone = occupancy.state === 'fully-occupied'
                ? 'bg-red-100 text-red-800'
                : occupancy.state === 'occupied'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              const roomLabel = occupancy.state === 'fully-occupied'
                ? 'Fully occupied'
                : occupancy.state === 'occupied'
                  ? 'Occupied'
                  : 'Vacant'
              return (
                <tr key={room.id} className="align-top">
                  <th className="border border-emerald-950/10 bg-emerald-950/[0.02] px-3 py-2 text-left text-[11px] font-black text-emerald-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>{room.name}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${roomTone}`}>{roomLabel}</span>
                    </div>
                  </th>
                  {days.map(day => {
                    const dayRows = filteredRows.filter(row => row.day === day && String(row.room.id) === String(room.id))
                    
                    // Get the primary year using this room/day combo
                    const yearCounts = {}
                    dayRows.forEach(row => {
                      const year = row.subject.yr || 4
                      yearCounts[year] = (yearCounts[year] || 0) + 1
                    })
                    const primaryYear = Object.keys(yearCounts).length > 0 
                      ? Number(Object.keys(yearCounts).reduce((a, b) => yearCounts[a] > yearCounts[b] ? a : b))
                      : null
                    
                    let cellTone = 'border-emerald-200 bg-emerald-50'
                    if (primaryYear === 1) cellTone = 'border-blue-200 bg-blue-50'
                    else if (primaryYear === 2) cellTone = 'border-green-200 bg-green-50'
                    else if (primaryYear === 3) cellTone = 'border-orange-200 bg-orange-50'
                    else if (primaryYear === 4) cellTone = 'border-purple-200 bg-purple-50'
                    
                    return (
                      <td key={day} className={`border border-emerald-950/10 p-1.5 align-top ${cellTone}`}>
                        {dayRows.length ? (
                          <div className="space-y-1">
                            {dayRows.map(row => {
                              const rowYearColor = getYearColor(row.subject.yr || 4)
                              return (
                                <div key={`${row.assignment.id}-${row.day}-${row.start}-${row.room.id}`} className={`rounded-md border ${rowYearColor.border} ${rowYearColor.bg} p-1.5 shadow-sm`}>
                                  <p className={`truncate text-[11px] font-black ${rowYearColor.text}`}>{row.assignment.section}</p>
                                  <p className={`truncate text-[10px] font-semibold ${rowYearColor.text} opacity-75`}>{row.subject.code}</p>
                                  <p className={`text-[10px] ${rowYearColor.text} opacity-60`}>{timeLabel(row.start)}-{timeLabel(row.end)}</p>
                                  <p className={`text-[9px] font-bold ${rowYearColor.text}`}>{getYearColor(row.subject.yr || 4).label}</p>
                                </div>
                              )
                            })}
                          </div>
                        ) : <p className="text-[10px] text-emerald-950/35">Open</p>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UnitValidationSummary({ result, subjectsById }) {
  if (!result?.scheduled || result.scheduled.length === 0) return null
  
  const assignmentUnitData = {}
  result.scheduled.forEach(row => {
    const key = `${row.assignment.id}`
    if (!assignmentUnitData[key]) {
      assignmentUnitData[key] = {
        assignment: row.assignment,
        subject: row.subject,
        sessions: [],
      }
    }
    assignmentUnitData[key].sessions.push(row)
  })

  const issues = Object.values(assignmentUnitData).filter(data => {
    const validation = validateSubjectUnits(data.assignment, data.subject, result.scheduled)
    return !validation.totalMatches
  })

  if (issues.length === 0) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-amber-800"><AlertTriangle size={15} /> Unit Mismatch Warnings</p>
      <div className="mt-3 space-y-2">
        {issues.map((data, idx) => {
          const validation = validateSubjectUnits(data.assignment, data.subject, result.scheduled)
          return (
            <div key={idx} className="rounded-lg border border-amber-200 bg-white p-2 text-xs font-semibold text-amber-900">
              <p>{data.assignment.section} - {data.subject.code}</p>
              <p className="text-amber-800/75 mt-1">
                Required: {validation.required.lectureHours}h lecture + {validation.required.labHours}h lab = {validation.required.totalHours}h total
              </p>
              <p className="text-amber-800/75">
                Scheduled: {validation.actual.lectureHours}h lecture + {validation.actual.labHours}h lab = {validation.actual.totalHours}h total
              </p>
            </div>
          )
        })}
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
    getScheduleStatusForTerm, submitScheduleForApproval,
    approveScheduleForTerm, rejectScheduleForTerm,
  } = useData()
  
  // ✅ Phase 10: Require finalized loads before scheduling
  const termsFinalized = isTermFinalized(term.ay, term.sem)
  const canSchedule = termsFinalized
  
  const [result, setResult] = useState(null)
  const [program, setProgram] = useState('ALL')
  const [query, setQuery] = useState('')
  const [showAllRows, setShowAllRows] = useState(false)
  const [view, setView] = useState('master')
  const [focusValue, setFocusValue] = useState('ALL')
  const [displayMode, setDisplayMode] = useState('table')
  const [occupancySection, setOccupancySection] = useState('ALL')
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
  const gridDays = useMemo(() => visible.some(row => row.day === 'Saturday') ? ALL_DAYS : CLASS_DAYS, [visible])
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
  const utilizationDays = (result?.scheduled || []).some(row => row.day === 'Saturday') ? ALL_DAYS.length : CLASS_DAYS.length
  const utilization = activeRooms ? Math.round((roomMinutes / (activeRooms * utilizationDays * (CLOSE - OPEN))) * 100) : 0

  function generate() {
    const initial = applyPolicyGuards(makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks, settings }))
    if (initial.unscheduled.length > 0 && initial.unscheduled.every(item => item.type === 'no-slot')) {
      const fallback = applyPolicyGuards(makeSchedule({ approved, subjectsById, facultyById, rooms, yearBlocks: FULL_DAY_YEAR_BLOCKS, settings }))
      if (fallback.unscheduled.length < initial.unscheduled.length) {
        setResult(fallback)
        setShowAllRows(false)
        setFocusValue('ALL')
        return
      }
    }
    setResult(initial)
    setShowAllRows(false)
    setFocusValue('ALL')
  }

  function saveCurrentSchedule() {
    if (!result || scheduleLocked) return
    const saved = saveScheduleForTerm(applyPolicyGuards({ ...result, yearBlocks, generatedAt: new Date().toISOString() }), account)
    setResult(saved)
  }

  function loadSavedSchedule() {
    if (!savedSchedule) return
    setResult(applyPolicyGuards(savedSchedule))
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

  function submitCurrentScheduleForApproval() {
    if (!result || scheduleLocked) return
    submitScheduleForApproval(term.ay, term.sem, account)
    setResult(prev => prev ? { ...prev, status: 'pending_approval', submittedBy: account?.id, submittedAt: new Date().toISOString() } : prev)
  }

  function approveCurrentSchedule() {
    if (!editableByAdmin) return
    approveScheduleForTerm(term.ay, term.sem, account)
    setResult(prev => prev ? { ...prev, status: 'approved', reviewedBy: account?.id, reviewedAt: new Date().toISOString() } : prev)
  }

  function rejectCurrentSchedule() {
    if (!editableByAdmin) return
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    rejectScheduleForTerm(term.ay, term.sem, account, reason)
    setResult(prev => prev ? { ...prev, status: 'draft', rejectionReason: reason, reviewedBy: account?.id, reviewedAt: new Date().toISOString() } : prev)
  }

  const scheduleStatus = savedSchedule?.status || 'draft'
  const isAdmin = account?.role === 'admin'
  const isPH = account?.role === 'program_head'

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

  function removeBreak(index) {
    updateRuleSetting('scheduleBreaks', (settings.scheduleBreaks || []).filter((_, i) => i !== index))
  }

  function addFacultyUnavailable() {
    const first = faculty[0]
    if (!first) return
    updateRuleSetting('facultyUnavailable', [...(settings.facultyUnavailable || []), { facultyId: first.id, day: 'Monday', start: 450, end: 510 }])
  }

  function updateFacultyUnavailable(index, patch) {
    updateRuleSetting('facultyUnavailable', (settings.facultyUnavailable || []).map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function removeFacultyUnavailable(index) {
    updateRuleSetting('facultyUnavailable', (settings.facultyUnavailable || []).filter((_, i) => i !== index))
  }

  function openEdit(row) {
    if (!editableByAdmin || scheduleLocked) return
    const rowId = makeRowId(row)
    const draft = { rowId, day: row.day, start: row.start }
    setEditingRow(row)
    setEditDraft(draft)
    setEditErrors(validateMove(result.scheduled, rowId, draft, rooms, settings, yearBlocks))
  }

  function updateEdit(patch) {
    const next = { ...editDraft, ...patch }
    setEditDraft(next)
    setEditErrors(validateMove(result.scheduled, editDraft.rowId, next, rooms, settings, yearBlocks))
  }

  function applyEdit() {
    if (editErrors.length || !editDraft) return
    setResult(prev => ({
      ...prev,
      scheduled: prev.scheduled.map(row => makeRowId(row) === editDraft.rowId
        ? { ...row, day: editDraft.day, start: editDraft.start, end: editDraft.start + row.duration, room: row.room || createTbaRoom() }
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
        {/* ✅ Phase 10: Block scheduling if loads not finalized */}
        {!canSchedule && (
          <section className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50">
            <div className="flex items-start gap-3 p-5">
              <AlertTriangle size={24} className="shrink-0 text-amber-700" />
              <div>
                <p className="text-lg font-black text-amber-900">Cannot Schedule Yet</p>
                <p className="mt-2 text-sm text-amber-800">
                  All faculty loads for AY {term.ay} {term.sem} Semester must be finalized by the Registrar before scheduling can begin.
                </p>
                <p className="mt-1 text-xs text-amber-800/75">
                  ➜ Go to Registrar page and finalize all approved loads first.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><CalendarDays size={20} className="text-white" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Class Schedule Generator</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">AY {term.ay} - {term.sem} Semester, {timeLabel(OPEN)} to {timeLabel(CLOSE)} • Room assignment handled separately</p>
            </div>
            {savedSchedule && <button type="button" onClick={loadSavedSchedule} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white"><Clock3 size={14} /> Load Saved</button>}
            <button type="button" onClick={exportCsv} disabled={!result} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Download size={14} /> CSV</button>
            <button type="button" onClick={printSchedule} disabled={!result} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Printer size={14} /> Print</button>
            
            {/* Schedule Status Badges */}
            {savedSchedule && (
              <>
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
                  Status: <span className={scheduleStatus === 'draft' ? 'text-yellow-300' : scheduleStatus === 'pending_approval' ? 'text-blue-300' : scheduleStatus === 'approved' ? 'text-green-300' : 'text-purple-300'}>{scheduleStatus.replace(/_/g, ' ')}</span>
                </div>
                {isAdmin && scheduleStatus === 'draft' && (
                  <button type="button" onClick={submitCurrentScheduleForApproval} disabled={!result} className="flex items-center gap-2 rounded-lg border border-blue-300/50 bg-blue-500/20 px-3 py-2 text-xs font-black text-blue-200 disabled:opacity-45"><CheckCircle2 size={14} /> Submit for Approval</button>
                )}
                {isAdmin && scheduleStatus === 'pending_approval' && (
                  <>
                    <button type="button" onClick={approveCurrentSchedule} className="flex items-center gap-2 rounded-lg border border-green-300/50 bg-green-500/20 px-3 py-2 text-xs font-black text-green-200"><CheckCircle2 size={14} /> Approve Schedule</button>
                    <button type="button" onClick={rejectCurrentSchedule} className="flex items-center gap-2 rounded-lg border border-red-300/50 bg-red-500/20 px-3 py-2 text-xs font-black text-red-200"><X size={14} /> Reject</button>
                  </>
                )}
              </>
            )}

            {savedSchedule?.finalized ? (
              <button type="button" onClick={reopenCurrentSchedule} disabled={!editableByAdmin} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Unlock size={14} /> Reopen</button>
            ) : (
              <button type="button" onClick={finalizeCurrentSchedule} disabled={!savedSchedule || !editableByAdmin} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Lock size={14} /> Finalize</button>
            )}
            <button type="button" onClick={saveCurrentSchedule} disabled={!result || !editableByAdmin || scheduleLocked} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45"><Save size={14} /> Save</button>
            <button type="button" onClick={generate} disabled={blockers.length > 0 || !canSchedule} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-emerald-950 disabled:opacity-50" style={{ background: GOLD }}>{result ? <RefreshCw size={14} /> : <Play size={14} />} Generate</button>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Metric icon={CheckCircle2} label="Approved Loads" value={approved.length} tone={MID_GREEN} />
            <Metric icon={DoorOpen} label="Active Rooms" value={activeRooms} />
            <Metric icon={Clock3} label="Scheduled" value={result?.scheduled.length || 0} tone={MID_GREEN} />
            <Metric icon={AlertTriangle} label="Unscheduled" value={result?.unscheduled.length || 0} tone={(result?.unscheduled.length || 0) ? '#B91C1C' : MID_GREEN} />
            <Metric icon={Users} label="Time Slots" value={`${result?.scheduled.length || 0}`} tone={GOLD} />
          </div>

          {blockers.length > 0 && <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-black text-amber-800"><AlertTriangle size={15} /> Scheduler blocked</p><p className="mt-1 text-xs font-semibold text-amber-800/75">{blockers.join(' ')}</p></div>}

          {result && <UnitValidationSummary result={result} subjectsById={subjectsById} />}
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-emerald-950/10 p-4">
              <div className="flex overflow-hidden rounded-lg border border-emerald-950/10 bg-emerald-950/[0.03]">
                {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => { setView(value); setFocusValue('ALL'); setOccupancySection('ALL'); setShowAllRows(false) }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-black" style={{ background: view === value ? MID_GREEN : 'transparent', color: view === value ? '#fff' : FOREST }}><Icon size={13} /> {label}</button>
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
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search section, subject, room" className="min-w-64 flex-1 rounded-lg border border-emerald-950/15 px-3 py-2 text-sm outline-none" />
            </div>
              {view === 'program' && result ? (
                <div className="p-4">
                  <ScheduleViewByProgram schedule={result} term={term} programs={PROGRAMS} facultyById={facultyById} />
                </div>
              ) : displayMode === 'grid' ? (
              <ScheduleGrid rows={visible} onEdit={openEdit} locked={!editableByAdmin || scheduleLocked} days={gridDays} />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-emerald-950/[0.04] text-[11px] uppercase text-emerald-950/50"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Action</th></tr></thead>
                  <tbody>
                    {displayRows.map((row, index) => (
                      <tr key={`${makeRowId(row)}-${index}`} className={`border-t border-emerald-950/10 ${isLabRow(row) ? 'bg-amber-50' : ''}`}>
                        <td className="whitespace-nowrap px-4 py-3 font-black text-emerald-950">{row.day}<br /><span className="text-xs font-bold text-emerald-950/55">{timeLabel(row.start)} - {timeLabel(row.end)}</span></td>
                        <td className="px-4 py-3 font-bold text-emerald-950">{row.assignment.section}<br /><span className="text-xs text-emerald-950/50">{yearBlocks[row.subject.yr]?.label}</span></td>
                        <td className="px-4 py-3"><span className="font-black text-emerald-950">{row.subject.code}</span><br /><span className={`text-xs font-semibold ${isLabRow(row) ? 'text-amber-700' : 'text-emerald-950/55'}`}>{row.kind}</span></td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">{row.duration / 60}h</span></td>
                        <td className="px-4 py-3 text-xs font-semibold text-emerald-950/65">{row.faculty ? `${row.faculty.ln}, ${row.faculty.fn}` : 'TBA'}</td>
                        <td className={`px-4 py-3 text-xs font-black ${isLabRow(row) ? 'text-amber-800' : 'text-emerald-950'}`}>{isLabRow(row) ? <FlaskConical size={13} className="mr-1 inline" /> : <DoorOpen size={13} className="mr-1 inline" />}{row.room?.name || 'TBA'}</td>
                        <td className="px-4 py-3"><button type="button" onClick={() => openEdit(row)} disabled={!editableByAdmin || scheduleLocked} className="rounded-lg border border-emerald-950/15 px-2.5 py-1.5 text-xs font-black text-emerald-950 disabled:opacity-40"><Pencil size={12} /></button></td>
                      </tr>
                    ))}
                    {visible.length === 0 && <tr><td colSpan="7" className="px-4 py-10 text-center text-sm font-bold text-emerald-950/45">{result ? 'No schedule rows match the filters.' : 'Generate or load a schedule.'}</td></tr>}
                    {visible.length > displayRows.length && <tr><td colSpan="7" className="border-t border-emerald-950/10 px-4 py-4 text-center"><button type="button" onClick={() => setShowAllRows(true)} className="rounded-lg border border-emerald-950/15 px-4 py-2 text-xs font-black text-emerald-950">Show all {visible.length} schedule rows</button></td></tr>}
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
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-black text-amber-900">Protected Lunch Break</p>
                  <p className="mt-0.5 text-xs font-semibold text-amber-800/75">{timeLabel(LUNCH_BREAK.start)} - {timeLabel(LUNCH_BREAK.end)} daily</p>
                </div>
                <button type="button" onClick={addBreak} className="mt-3 rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">Add Break</button>
                {(settings.scheduleBreaks || []).map((item, index) => (
                  <div key={index} className="mt-2 grid grid-cols-[1fr_1fr_1fr_32px] gap-1">
                    <select value={item.day} onChange={e => updateBreak(index, { day: e.target.value })} className="min-w-0 rounded border px-1 text-xs">{RULE_DAYS.map(day => <option key={day}>{day}</option>)}</select>
                    <select value={minutesToInput(item.start)} onChange={e => updateBreak(index, { start: inputToMinutes(e.target.value) })} className="min-w-0 rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
                    <select value={minutesToInput(item.end)} onChange={e => updateBreak(index, { end: inputToMinutes(e.target.value) })} className="min-w-0 rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
                    <button type="button" onClick={() => removeBreak(index)} title="Remove break" className="flex h-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-700"><Trash2 size={13} /></button>
                  </div>
                ))}
                <button type="button" onClick={addFacultyUnavailable} className="mt-4 rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">Add Faculty Unavailable</button>
                {(settings.facultyUnavailable || []).map((item, index) => (
                  <div key={index} className="mt-2 grid grid-cols-[1fr_1fr_32px] gap-1">
                    <select value={item.facultyId} onChange={e => updateFacultyUnavailable(index, { facultyId: Number(e.target.value) })} className="min-w-0 rounded border px-1 text-xs">{faculty.map(fac => <option key={fac.id} value={fac.id}>{fac.ln}, {fac.fn}</option>)}</select>
                    <select value={item.day} onChange={e => updateFacultyUnavailable(index, { day: e.target.value })} className="min-w-0 rounded border px-1 text-xs">{RULE_DAYS.map(day => <option key={day}>{day}</option>)}</select>
                    <button type="button" onClick={() => removeFacultyUnavailable(index)} title="Remove unavailable time" className="row-span-2 flex h-full min-h-16 items-center justify-center rounded border border-red-200 bg-red-50 text-red-700"><Trash2 size={13} /></button>
                    <select value={minutesToInput(item.start)} onChange={e => updateFacultyUnavailable(index, { start: inputToMinutes(e.target.value) })} className="min-w-0 rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
                    <select value={minutesToInput(item.end)} onChange={e => updateFacultyUnavailable(index, { end: inputToMinutes(e.target.value) })} className="min-w-0 rounded border px-1 text-xs">{TIME_OPTIONS.map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
                  </div>
                ))}
                <p className="mt-4 text-xs font-black text-emerald-950">Room Priority</p>
                {PROGRAMS.map(item => <select key={item.code} value={(settings.roomPriority || {})[item.code] || ''} onChange={e => updateRuleSetting('roomPriority', { ...(settings.roomPriority || {}), [item.code]: e.target.value ? Number(e.target.value) : '' })} className="mt-2 w-full rounded border px-2 py-1 text-xs"><option value="">{item.label}: no preference</option>{rooms.filter(room => room.status !== 'Inactive' && !isActivityVenue(room)).map(room => <option key={room.id} value={room.id}>{item.label}: {room.name}</option>)}</select>)}
              </div>
            )}

            {result && <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm"><p className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Unit Summary by Section</p><div className="mt-3 space-y-2 max-h-96 overflow-y-auto text-xs">{sectionOptions.map(section => {
              const assignmentsInSection = approved.filter(a => a.section === section)
              const issues = assignmentsInSection.map(a => {
                const subject = subjectsById[a.subjectId]
                const validation = validateSubjectUnits(a, subject, result.scheduled)
                return { assignment: a, subject, validation }
              }).filter(item => !item.validation.totalMatches)
              if (issues.length === 0) return null
              return (
                <div key={section} className="rounded-lg border border-emerald-950/10 p-2 bg-emerald-950/[0.02]">
                  <p className="font-black text-emerald-950">{section}</p>
                  {issues.map((item, idx) => (
                    <div key={idx} className="mt-1 rounded border border-amber-200 bg-amber-50/50 p-1.5">
                      <p className="font-bold text-amber-900">{item.subject.code}</p>
                      <p className="text-amber-800 text-[10px] mt-0.5">Required: {item.validation.required.totalHours}h (L:{item.validation.required.lectureHours} + Lab:{item.validation.required.labHours})</p>
                      <p className="text-amber-700 text-[10px]">Scheduled: {item.validation.actual.totalHours}h (L:{item.validation.actual.lectureHours} + Lab:{item.validation.actual.labHours})</p>
                    </div>
                  ))}
                </div>
              )
            })}</div></div>}

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
              <select value={editDraft.day} onChange={e => updateEdit({ day: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">{(isNSTPSubject(editingRow.subject) ? ['Saturday'] : CLASS_DAYS).map(day => <option key={day}>{day}</option>)}</select>
              <select value={minutesToInput(editDraft.start)} onChange={e => updateEdit({ start: inputToMinutes(e.target.value) })} className="rounded-lg border px-3 py-2 text-sm">{TIME_OPTIONS.filter(value => value >= (yearBlocks[editingRow.subject.yr]?.start ?? OPEN) && value + editingRow.duration <= (yearBlocks[editingRow.subject.yr]?.end ?? CLOSE)).map(value => <option key={value} value={minutesToInput(value)}>{timeLabel(value)}</option>)}</select>
            </div>
            {editErrors.length > 0 && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">{editErrors.map(error => <p key={error} className="text-xs font-bold text-red-800">{error}</p>)}</div>}
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditingRow(null)} className="rounded-lg border px-3 py-2 text-xs font-black">Cancel</button><button type="button" onClick={applyEdit} disabled={editErrors.length > 0} className="rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-50" style={{ background: MID_GREEN }}>Apply</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
