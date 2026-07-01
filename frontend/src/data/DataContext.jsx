import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { FACULTY_SEED } from './facultySeed'
import { SUBJECTS } from './subjects'
import { PROGRAM_BY_CODE } from './programs'
import { checkAssignmentCompatibility, getFacultyUnits, getFacultyMaxUnits, canTeachProgram, specMatchScore } from './validation'
import { MOCK_ACCOUNTS } from '../auth/accounts'

const DataContext = createContext(null)

const ASSIGNMENTS_KEY = 'ccd-tlss.assignments'
const FINALIZED_KEY = 'ccd-tlss.finalized-terms'
const TERM_KEY = 'ccd-tlss.current-term'
const FACULTY_KEY = 'ccd-tlss.faculty'
const SUBJECTS_KEY = 'ccd-tlss.subjects'
const ROOMS_KEY = 'ccd-tlss.rooms'
const USERS_KEY = 'ccd-tlss.users'
const SETTINGS_KEY = 'ccd-tlss.settings'
const ACTIVITY_KEY = 'ccd-tlss.activity-log'
const OVERLOAD_KEY = 'ccd-tlss.overload-requests'
const SCHEDULES_KEY = 'ccd-tlss.schedules'

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_ROOMS = [
  { id: 1, name: 'B1-C1', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 2, name: 'B1-C3', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 3, name: 'B1-C4', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 4, name: 'B4-C3', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 5, name: 'B4-C4', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 6, name: 'B4-C5', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 7, name: 'B4-C6', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 8, name: 'B4-C7', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 9, name: 'B1-C2 HVACRT LAB', type: 'HVAC Lab', capacity: 30, prog: 'BTVTED-HVACRT', status: 'Active' },
  { id: 10, name: 'WELDING LABORATORY', type: 'Welding Lab', capacity: 28, prog: 'BTVTED-HVACRT', status: 'Active' },
  { id: 11, name: 'B4-C1 COMPUTER LAB', type: 'Computer Lab', capacity: 35, prog: 'BTVTED-CP', status: 'Active' },
  { id: 12, name: 'B4-C2 SPEECH LAB', type: 'Classroom', capacity: 35, prog: '', status: 'Active' },
  { id: 13, name: 'SCIENCE LABORATORY', type: 'Science Lab', capacity: 32, prog: '', status: 'Active' },
  { id: 14, name: 'PE CCD GYM', type: 'Gym', capacity: 200, prog: '', status: 'Active' },
  { id: 15, name: 'SOCIAL HALL', type: 'Social Hall', capacity: 150, prog: '', status: 'Active' },
  { id: 16, name: 'NEW ROOM 1', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
  { id: 17, name: 'NEW ROOM 2', type: 'Classroom', capacity: 45, prog: '', status: 'Active' },
]

const DEFAULT_SETTINGS = {
  maxFacultyUnits: 18,
  classDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  requireProgramHeadApproval: true,
  allowSchedulePreviewBeforeFinalization: true,
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function loadFaculty() {
  const stored = load(FACULTY_KEY, [])
  const seedById = new Map(FACULTY_SEED.map((f) => [f.id, f]))
  const storedIds = new Set(stored.map((f) => f.id))
  return [
    ...stored.map((f) => {
      const seedRecord = seedById.get(f.id)
      return seedRecord ? { ...f, spec: seedRecord.spec } : f
    }),
    ...FACULTY_SEED.filter((f) => !storedIds.has(f.id)),
  ]
}

function loadRooms() {
  const stored = load(ROOMS_KEY, [])
  try {
    const storedNames = new Set(stored.map((r) => r.name))
    const merged = [...stored]
    DEFAULT_ROOMS.forEach((r) => {
      if (!storedNames.has(r.name)) merged.push(r)
    })
    return merged
  } catch {
    return DEFAULT_ROOMS
  }
}

function loadUsers() {
  const stored = load(USERS_KEY, [])
  const storedById = new Map(stored.map((user) => [user.id, user]))
  const seedEmails = new Set(MOCK_ACCOUNTS.map((account) => account.email?.toLowerCase()).filter(Boolean))
  return [
    ...MOCK_ACCOUNTS.map((account) => ({
      status: 'active',
      programs: [],
      facultyId: null,
      seedPassword: account.password,
      ...account,
      ...(storedById.get(account.id)?.managedEdited ? storedById.get(account.id) : {}),
    })),
    ...stored.filter((user) => !MOCK_ACCOUNTS.some((account) => account.id === user.id || account.email?.toLowerCase() === user.email?.toLowerCase()) && !seedEmails.has(user.email?.toLowerCase())),
  ]
}

// NOTE: this whole file is a stand-in for a real backend. Everything here is
// stored in the browser's localStorage so the approval workflow is demoable
// without standing up a server/database. Swap the bodies of these functions
// for real API calls later — the shapes (assignment objects, function
// signatures) were designed so that swap doesn't require touching the pages.
export function DataProvider({ children }) {
  const [assignments, setAssignments] = useState(() => load(ASSIGNMENTS_KEY, []))
  const [finalizedTerms, setFinalizedTerms] = useState(() => load(FINALIZED_KEY, []))
  const [term, setTerm] = useState(() => load(TERM_KEY, { ay: '2025-2026', sem: '1st' }))
  const [faculty, setFaculty] = useState(loadFaculty)
  const [subjects, setSubjects] = useState(() => load(SUBJECTS_KEY, SUBJECTS))
  const [rooms, setRooms] = useState(loadRooms)
  const [users, setUsers] = useState(loadUsers)
  const [settings, setSettings] = useState(() => load(SETTINGS_KEY, DEFAULT_SETTINGS))
  const [activity, setActivity] = useState(() => load(ACTIVITY_KEY, []))
  const [overloadRequests, setOverloadRequests] = useState(() => load(OVERLOAD_KEY, []))
  const [schedules, setSchedules] = useState(() => load(SCHEDULES_KEY, []))

  useEffect(() => localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)), [assignments])
  useEffect(() => localStorage.setItem(FINALIZED_KEY, JSON.stringify(finalizedTerms)), [finalizedTerms])
  useEffect(() => localStorage.setItem(TERM_KEY, JSON.stringify(term)), [term])
  useEffect(() => localStorage.setItem(FACULTY_KEY, JSON.stringify(faculty)), [faculty])
  useEffect(() => localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)), [subjects])
  useEffect(() => localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)), [rooms])
  useEffect(() => localStorage.setItem(USERS_KEY, JSON.stringify(users)), [users])
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings])
  useEffect(() => localStorage.setItem(OVERLOAD_KEY, JSON.stringify(overloadRequests)), [overloadRequests])
  useEffect(() => localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity)), [activity])
  useEffect(() => localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules)), [schedules])

  const facultyById = useMemo(() => Object.fromEntries(faculty.map((f) => [f.id, f])), [faculty])
  const subjectsById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects])

  const isTermFinalized = (ay, sem) => finalizedTerms.some((t) => t.ay === ay && t.sem === sem)

  function termAssignments(ay, sem) {
    return assignments.filter((a) => a.ay === ay && subjectsById[a.subjectId]?.sem === sem)
  }

  function checkCompatibility({ facultyId, subjectId, section, excludeId = null }) {
    return checkAssignmentCompatibility({
      faculty: facultyById[facultyId],
      subject: subjectsById[subjectId],
      section,
      assignments: assignments.filter((a) => a.ay === term.ay),
      subjectsById,
      excludeId,
    })
  }

  // Returns { ok, blockers } — does not throw, so callers can show messages inline.
  function createAssignment({ facultyId, subjectId, section }, account) {
    if (isTermFinalized(term.ay, term.sem)) {
      return { ok: false, blockers: [`${term.ay} ${term.sem} semester is already finalized — reopen it before making changes.`] }
    }
    const check = checkCompatibility({ facultyId, subjectId, section })
    if (!check.ok) return check

    const nextId = assignments.reduce((max, a) => Math.max(max, a.id), 0) + 1
    const newAssignment = {
      id: nextId,
      ay: term.ay,
      facultyId,
      subjectId,
      section,
      status: 'draft',
      createdBy: account.id,
      createdAt: new Date().toISOString(),
      submittedBy: null,
      submittedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      comment: null,
    }
    setAssignments((prev) => [...prev, newAssignment])
    return { ok: true, blockers: [], assignment: newAssignment }
  }

  function createBulkAssignments(items, account) {
    if (isTermFinalized(term.ay, term.sem)) {
      return { ok: false, blockers: [`${term.ay} ${term.sem} semester is already finalized - reopen it before making changes.`], created: [] }
    }

    const blockers = []
    const simulated = assignments.filter((a) => a.ay === term.ay).map((a) => ({ ...a }))
    items.forEach((item) => {
      const check = checkAssignmentCompatibility({
        faculty: facultyById[item.facultyId],
        subject: subjectsById[item.subjectId],
        section: item.section,
        assignments: simulated,
        subjectsById,
      })
      if (!check.ok) {
        const subject = subjectsById[item.subjectId]
        const facultyRecord = facultyById[item.facultyId]
        blockers.push(`${item.section} ${subject?.code || item.subjectId}: ${check.blockers[0] || `${facultyRecord?.ln || 'Faculty'} is not eligible.`}`)
        return
      }
      simulated.push({
        id: `bulk-${simulated.length}`,
        ay: term.ay,
        facultyId: item.facultyId,
        subjectId: item.subjectId,
        section: item.section,
        status: 'draft',
      })
    })

    if (blockers.length) return { ok: false, blockers, created: [] }

    const createdAt = new Date().toISOString()
    setAssignments((prev) => {
      const nextStartId = prev.reduce((max, a) => Math.max(max, a.id), 0) + 1
      const created = items.map((item, index) => ({
        id: nextStartId + index,
        ay: term.ay,
        facultyId: item.facultyId,
        subjectId: item.subjectId,
        section: item.section,
        status: 'draft',
        createdBy: account?.id || 'system-auto',
        createdAt,
        submittedBy: null,
        submittedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        comment: item.overload ? 'Auto-assigned with overload after max loads were filled.' : null,
      }))
      return [...prev, ...created]
    })

    return { ok: true, blockers: [], created: items }
  }

  function withdrawAssignment(id) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'withdrawn' } : a)))
  }

  function approveAssignment(id, account) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved', reviewedBy: account.id, reviewedAt: new Date().toISOString(), comment: null } : a)),
    )
  }

  function rejectAssignment(id, account, comment) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected', reviewedBy: account.id, reviewedAt: new Date().toISOString(), comment } : a)),
    )
  }

  function submitToProgramHead(assignmentIds, account) {
    const now = new Date().toISOString()
    setAssignments((prev) =>
      prev.map((a) =>
        assignmentIds.includes(a.id)
          ? { ...a, status: 'pending', submittedBy: account.id, submittedAt: now }
          : a
      ),
    )
  }

  // Blocked until every assignment submitted for this term is approved or withdrawn.
  function getFinalizeBlockers(ay, sem) {
    const relevant = termAssignments(ay, sem)
    const pending = relevant.filter((a) => a.status === 'pending').length
    const rejected = relevant.filter((a) => a.status === 'rejected').length
    const blockers = []
    if (pending > 0) blockers.push(`${pending} assignment(s) still pending Program Head review.`)
    if (rejected > 0) blockers.push(`${rejected} rejected assignment(s) still need a replacement or to be withdrawn.`)
    return blockers
  }

  function finalizeTerm(ay, sem, account) {
    const blockers = getFinalizeBlockers(ay, sem)
    if (blockers.length) return { ok: false, blockers }
    setFinalizedTerms((prev) => [...prev, { ay, sem, finalizedBy: account.id, finalizedAt: new Date().toISOString() }])
    return { ok: true, blockers: [] }
  }

  function reopenTerm(ay, sem) {
    setFinalizedTerms((prev) => prev.filter((t) => !(t.ay === ay && t.sem === sem)))
  }

  function pendingForProgramHead(account) {
    const programs = account.programs || []
    return termAssignments(term.ay, term.sem).filter((a) => a.status === 'pending' && programs.includes(subjectsById[a.subjectId]?.prog))
  }

  // OVERLOAD REQUEST SYSTEM
  function requestOverload({ facultyId, requestedUnits, reason, requestType }, account) {
    // requestType: 'admin-to-ph' (admin requests PH to ask teacher) or 'teacher-self' (teacher self-requests)
    const nextId = overloadRequests.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1
    const newRequest = {
      id: nextId,
      facultyId,
      requestedUnits: Number(requestedUnits),
      reason,
      requestType, // 'admin-to-ph' | 'teacher-self'
      requestedBy: account.id,
      requestedAt: new Date().toISOString(),
      ay: term.ay,
      sem: term.sem,
      phStatus: 'pending', // 'pending' | 'approved' | 'rejected'
      phResponsedBy: null,
      phRespondedAt: null,
      phReason: null,
      teacherStatus: null, // 'pending' | 'accepted' | 'rejected' (only if phStatus === 'approved')
      teacherResponsedBy: null,
      teacherRespondedAt: null,
      teacherReason: null,
    }
    setOverloadRequests((prev) => [...prev, newRequest])
    logActivity('overload_requested', { facultyId, requestedUnits, requestType }, account.id)
    return { ok: true, request: newRequest }
  }

  function respondToOverloadRequest(requestId, phResponse, phReason, account) {
    // phResponse: 'approved' | 'rejected'
    const now = new Date().toISOString()
    setOverloadRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              phStatus: phResponse,
              phResponsedBy: account.id,
              phRespondedAt: now,
              phReason,
              teacherStatus: phResponse === 'approved' ? 'pending' : null,
            }
          : r,
      ),
    )
    logActivity('overload_ph_responded', { requestId, response: phResponse }, account.id)
  }

  function respondToTeacherOverloadOffer(requestId, teacherResponse, teacherReason, account) {
    // teacherResponse: 'accepted' | 'rejected'
    const now = new Date().toISOString()
    setOverloadRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              teacherStatus: teacherResponse,
              teacherResponsedBy: account.id,
              teacherRespondedAt: now,
              teacherReason,
            }
          : r,
      ),
    )
    logActivity('overload_teacher_responded', { requestId, response: teacherResponse }, account.id)
  }

  function getPendingOverloadRequestsForPH(account) {
    const programs = account.programs || []
    return overloadRequests.filter(
      (r) => r.ay === term.ay && r.sem === term.sem && r.phStatus === 'pending' && programs.includes(facultyById[r.facultyId]?.prog),
    )
  }

  function getPendingOverloadOffersForTeacher(facultyId) {
    return overloadRequests.filter((r) => r.facultyId === facultyId && r.ay === term.ay && r.sem === term.sem && r.phStatus === 'approved' && r.teacherStatus === 'pending')
  }

  function getOverloadHistoryForFaculty(facultyId) {
    return overloadRequests.filter((r) => r.facultyId === facultyId && r.ay === term.ay && r.sem === term.sem && (r.phStatus !== 'pending' || r.teacherStatus !== null))
  }

  function getPendingTeacherOverloadRequests(account) {
    // For PH to see teacher's self-initiated overload requests
    const programs = account.programs || []
    return overloadRequests.filter(
      (r) =>
        r.ay === term.ay && r.sem === term.sem && r.requestType === 'teacher-self' && r.phStatus === 'pending' && programs.includes(facultyById[r.facultyId]?.prog),
    )
  }

  function getTBASubmissionsForPH(account) {
    // For Program Head to see TBA (To Be Assigned) subjects submitted by admin for overload review
    const programs = account.programs || []
    return assignments
      .filter(a => 
        a.ay === term.ay && 
        a.status === 'tba' && 
        a.submittedBy && 
        a.submittedAt &&
        programs.includes(subjectsById[a.subjectId]?.prog)
      )
      .map(a => ({
        id: a.id,
        section: a.section,
        subjectId: a.subjectId,
        subjectCode: subjectsById[a.subjectId]?.code,
        subjectTitle: subjectsById[a.subjectId]?.title,
        units: (subjectsById[a.subjectId]?.lec || 0) + (subjectsById[a.subjectId]?.lab || 0),
        submittedAt: a.submittedAt,
        reason: a.comment,
      }))
  }

  function decidedForProgramHead(account) {
    const programs = account.programs || []
    return termAssignments(term.ay, term.sem).filter((a) => a.status !== 'pending' && a.reviewedBy === account.id && programs.includes(subjectsById[a.subjectId]?.prog))
  }

  function assignmentsForFaculty(facultyId) {
    return assignments.filter((a) => a.facultyId === facultyId && a.status !== 'withdrawn')
  }

  function upsertFaculty(record) {
    setFaculty((prev) => {
      const id = record.id || prev.reduce((max, item) => Math.max(max, item.id), 0) + 1
      const next = { ...record, id, maxUnits: Number(record.maxUnits || settings.maxFacultyUnits) }
      return prev.some((item) => item.id === id) ? prev.map((item) => (item.id === id ? next : item)) : [...prev, next]
    })
  }

  function upsertFacultyMany(records) {
    setFaculty((prev) => {
      let nextId = prev.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
      const byEmail = new Map(prev.filter(item => item.email).map(item => [String(item.email).toLowerCase(), item]))
      const byId = new Map(prev.map(item => [item.id, item]))
      const next = [...prev]

      records.forEach((record) => {
        const emailKey = record.email ? String(record.email).toLowerCase() : ''
        const existing = (record.id && byId.get(record.id)) || (emailKey && byEmail.get(emailKey))
        const id = existing?.id || record.id || nextId++
        const saved = { ...existing, ...record, id, maxUnits: Number(record.maxUnits || existing?.maxUnits || settings.maxFacultyUnits) }
        const index = next.findIndex(item => item.id === id)
        if (index >= 0) next[index] = saved
        else next.push(saved)
        if (saved.email) byEmail.set(String(saved.email).toLowerCase(), saved)
        byId.set(id, saved)
      })

      return next
    })
  }

  function upsertSubject(record) {
    setSubjects((prev) => {
      const id = record.id || prev.reduce((max, item) => Math.max(max, item.id), 0) + 1
      const next = { ...record, id, yr: Number(record.yr), lec: Number(record.lec || 0), lab: Number(record.lab || 0) }
      return prev.some((item) => item.id === id) ? prev.map((item) => (item.id === id ? next : item)) : [...prev, next]
    })
  }

  function upsertRoom(record) {
    setRooms((prev) => {
      const id = record.id || prev.reduce((max, item) => Math.max(max, item.id), 0) + 1
      const next = { ...record, id, capacity: Number(record.capacity || 0) }
      return prev.some((item) => item.id === id) ? prev.map((item) => (item.id === id ? next : item)) : [...prev, next]
    })
  }

  function upsertUser(record) {
    setUsers((prev) => {
      const id = record.id || `user-${Date.now()}`
      const next = { ...record, id }
      return prev.some((item) => item.id === id) ? prev.map((item) => (item.id === id ? next : item)) : [...prev, next]
    })
  }

  function registrarSummary(ay, sem) {
    const relevant = termAssignments(ay, sem)
    const byProgram = {}
    Object.keys(PROGRAM_BY_CODE).forEach((code) => {
      byProgram[code] = { pending: 0, approved: 0, rejected: 0 }
    })
    relevant.forEach((a) => {
      const prog = subjectsById[a.subjectId]?.prog
      if (prog && byProgram[prog] && a.status !== 'withdrawn') byProgram[prog][a.status] = (byProgram[prog][a.status] || 0) + 1
    })
    return byProgram
  }

  // ACTIVITY TRACKING
  function logActivity(action, details, userId) {
    const event = {
      id: `activity-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userId,
    }
    setActivity((prev) => [event, ...prev])
  }

  function getRecentActivity(limit = 20) {
    return activity.slice(0, limit)
  }

  // ANALYTICS & INSIGHTS
  
  // Faculty workload analysis for heatmap + warnings
  function getFacultyWorkload(ay, sem) {
    const relevantAssignments = assignments.filter(
      (a) => a.ay === ay && subjectsById[a.subjectId]?.sem === sem && a.status !== 'withdrawn' && a.status !== 'rejected',
    )

    return faculty.map((fac) => {
      const units = relevantAssignments
        .filter((a) => a.facultyId === fac.id)
        .reduce((sum, a) => {
          const subj = subjectsById[a.subjectId]
          return sum + (subj ? subj.lec + subj.lab : 0)
        }, 0)
      const max = fac.maxUnits || settings.maxFacultyUnits
      const percent = (units / max) * 100
      const status = units > max ? 'overloaded' : units >= max * 0.9 ? 'near-capacity' : units >= max * 0.5 ? 'balanced' : 'underloaded'
      return { facultyId: fac.id, name: `${fac.fn} ${fac.ln}`, units, max, percent, status }
    })
  }

  // Get critical alerts for dashboard
  function getCriticalAlerts(ay, sem) {
    const alerts = []
    const ta = termAssignments(ay, sem)

    // Find faculty near maximum units
    const workload = getFacultyWorkload(ay, sem)
    const nearCapacity = workload.filter((w) => w.status === 'near-capacity')
    const overloaded = workload.filter((w) => w.status === 'overloaded')

    if (nearCapacity.length > 0) {
      alerts.push({
        type: 'near-capacity',
        severity: 'medium',
        message: `⚠ ${nearCapacity.length} faculty at near-maximum capacity`,
        near_capacity: nearCapacity,
      })
    }

    if (overloaded.length > 0) {
      alerts.push({
        type: 'overloaded',
        severity: 'high',
        message: `⚠ ${overloaded.length} faculty exceeding maximum units`,
        overloaded: overloaded,
      })
    }

    // Pending approvals
    const pending = ta.filter((a) => a.status === 'pending').length
    if (pending > 0) {
      alerts.push({
        type: 'pending-approvals',
        severity: 'medium',
        message: `⚠ ${pending} assignments waiting for Program Head approval`,
      })
    }

    const rejected = ta.filter((a) => a.status === 'rejected').length
    if (rejected > 0) {
      alerts.push({
        type: 'rejected-assignments',
        severity: 'high',
        message: `${rejected} rejected load assignment(s) need admin reassignment`,
      })
    }

    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const facultyProfileUpdates = activity.filter(
      (item) => item.action === 'faculty_profile_updated' && new Date(item.timestamp).getTime() >= weekAgo,
    )
    if (facultyProfileUpdates.length > 0) {
      alerts.push({
        type: 'faculty-profile-updates',
        severity: 'medium',
        message: `${facultyProfileUpdates.length} faculty profile update(s) need admin review`,
        updates: facultyProfileUpdates.slice(0, 6),
      })
    }

    return alerts
  }

  // Faculty recommendations for a subject based on specialization + workload
  function preferredYears(fac) {
    const years = fac?.preferredYearLevels || fac?.preferredYears || []
    if (Array.isArray(years)) return years.map(Number).filter(Boolean)
    if (years) return [Number(years)].filter(Boolean)
    return []
  }

  function getFacultyRecommendations(subjectId) {
    const subject = subjectsById[subjectId]
    if (!subject) return []

    const candidates = faculty
      .filter((fac) => canTeachProgram(fac, subject.prog))
      .map((fac) => {
        const currentUnits = getFacultyUnits(assignments, subjectsById, fac.id, subject.sem)
        const maxUnits = getFacultyMaxUnits(fac)
        const availableUnits = maxUnits - currentUnits
        const wouldFit = availableUnits >= subject.lec + subject.lab

        // Specialization match score (0-100) — uses the proper specKey system
        const specScore = specMatchScore(fac, subject)

        // Workload score (prefer less loaded, 0-100)
        const workloadScore = ((maxUnits - currentUnits) / maxUnits) * 100
        const years = preferredYears(fac)
        const yearPriorityScore = years.length === 0 || !subject.yr ? 50 : years.includes(Number(subject.yr)) ? 100 : 25

        // Total score for ranking
        const score = specScore * 0.5 + workloadScore * 0.3 + yearPriorityScore * 0.2

        return {
          facultyId: fac.id,
          name: `${fac.fn} ${fac.ln}`,
          spec: fac.spec,
          currentUnits,
          maxUnits,
          availableUnits,
          wouldFit,
          specScore,
          workloadScore,
          yearPriorityScore,
          totalScore: score,
          type: fac.type || 'Full-Time',
        }
      })
      .filter((c) => c.wouldFit)
      .sort((a, b) => b.totalScore - a.totalScore)

    return candidates.slice(0, 5) // Top 5 recommendations
  }

  // Get load distribution for analytics (underloaded, balanced, etc.)
  function getLoadDistribution(ay, sem) {
    const workload = getFacultyWorkload(ay, sem)
    const distribution = {
      underloaded: workload.filter((w) => w.status === 'underloaded').length,
      balanced: workload.filter((w) => w.status === 'balanced').length,
      nearCapacity: workload.filter((w) => w.status === 'near-capacity').length,
      overloaded: workload.filter((w) => w.status === 'overloaded').length,
    }
    return distribution
  }

  // Get assignment progress for current term
  function getAssignmentProgress(ay, sem) {
    const ta = termAssignments(ay, sem)
    const total = ta.length
    const completed = ta.filter((a) => a.status === 'approved').length
    const pending = ta.filter((a) => a.status === 'pending').length
    const rejected = ta.filter((a) => a.status === 'rejected').length
    
    return {
      total,
      completed,
      pending,
      rejected,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  function savedScheduleForTerm(ay, sem) {
    return schedules.find((schedule) => schedule.ay === ay && schedule.sem === sem) || null
  }

  function saveScheduleForTerm(schedule, account) {
    const existing = savedScheduleForTerm(term.ay, term.sem)
    const saved = {
      ...schedule,
      ay: term.ay,
      sem: term.sem,
      status: existing?.status || schedule.status || 'draft',
      finalized: existing?.finalized || false,
      finalizedBy: existing?.finalizedBy || null,
      finalizedAt: existing?.finalizedAt || null,
      savedBy: account?.id || 'system',
      savedAt: new Date().toISOString(),
    }
    setSchedules((prev) => [saved, ...prev.filter((item) => !(item.ay === term.ay && item.sem === term.sem))])
    logActivity('schedule_saved', { ay: term.ay, sem: term.sem, rows: schedule.scheduled?.length || 0 }, account?.id || 'system')
    return saved
  }

  function finalizeScheduleForTerm(ay, sem, account) {
    const schedule = savedScheduleForTerm(ay, sem)
    if (!schedule) return { ok: false, blockers: ['No generated schedule has been saved yet.'] }
    if (schedule.status !== 'approved') return { ok: false, blockers: ['Program Head approval is required before Registrar finalization.'] }
    setSchedules((prev) => prev.map((item) => (
      item.ay === ay && item.sem === sem
        ? { ...item, status: 'finalized', finalized: true, finalizedBy: account?.id || 'system', finalizedAt: new Date().toISOString() }
        : item
    )))
    logActivity('schedule_finalized', { ay, sem }, account?.id || 'system')
    return { ok: true, blockers: [] }
  }

  function reopenScheduleForTerm(ay, sem, account) {
    setSchedules((prev) => prev.map((schedule) => (
      schedule.ay === ay && schedule.sem === sem
        ? { ...schedule, status: 'approved', finalized: false, finalizedBy: null, finalizedAt: null }
        : schedule
    )))
    logActivity('schedule_reopened', { ay, sem }, account?.id || 'system')
  }

  // SCHEDULE STATUS TRACKING (Phase 9)
  function getScheduleStatusForTerm(ay, sem) {
    const schedule = schedules.find((s) => s.ay === ay && s.sem === sem)
    return schedule?.status || 'draft'
  }

  function submitScheduleForApproval(ay, sem, account) {
    const now = new Date().toISOString()
    setSchedules((prev) => prev.map((schedule) => (
      schedule.ay === ay && schedule.sem === sem
        ? {
            ...schedule,
            status: 'pending_approval',
            submittedBy: account?.id || 'system',
            submittedAt: now,
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
          }
        : schedule
    )))
    logActivity('schedule_submitted_for_approval', { ay, sem }, account?.id || 'system')
  }

  function approveScheduleForTerm(ay, sem, account) {
    const now = new Date().toISOString()
    setSchedules((prev) => prev.map((schedule) => (
      schedule.ay === ay && schedule.sem === sem
        ? {
            ...schedule,
            status: 'approved',
            reviewedBy: account?.id || 'system',
            reviewedAt: now,
            rejectionReason: null,
          }
        : schedule
    )))
    logActivity('schedule_approved', { ay, sem }, account?.id || 'system')
  }

  function rejectScheduleForTerm(ay, sem, account, rejectionReason) {
    const now = new Date().toISOString()
    setSchedules((prev) => prev.map((schedule) => (
      schedule.ay === ay && schedule.sem === sem
        ? {
            ...schedule,
            status: 'draft',
            submittedBy: null,
            submittedAt: null,
            reviewedBy: account?.id || 'system',
            reviewedAt: now,
            rejectionReason,
          }
        : schedule
    )))
    logActivity('schedule_rejected', { ay, sem, reason: rejectionReason }, account?.id || 'system')
  }

  function assignRoomsToSchedule(ay, sem, roomAssignments, account) {
    // roomAssignments: { [rowId]: { roomId, roomName } }
    const now = new Date().toISOString()
    setSchedules((prev) => prev.map((schedule) => {
      if (schedule.ay !== ay || schedule.sem !== sem) return schedule

      const updatedScheduled = (schedule.scheduled || []).map((row) => {
        const rowKey = `${row.assignment?.id || row.assignmentId || ''}-${row.kind || ''}-${row.day || ''}`
        const assignment = roomAssignments?.[rowKey]

        if (!assignment?.roomId) return row

        const matchedRoom = rooms.find((room) => room.id === assignment.roomId)
        return {
          ...row,
          room: matchedRoom
            ? {
                id: matchedRoom.id,
                name: matchedRoom.name,
                type: matchedRoom.type,
                status: matchedRoom.status,
                capacity: matchedRoom.capacity,
                prog: matchedRoom.prog,
              }
            : { id: null, name: 'TBA', type: 'TBA' },
        }
      })

      return {
        ...schedule,
        status: 'room_assigned',
        scheduled: updatedScheduled,
        roomAssignments,
        roomsAssignedBy: account?.id || 'system',
        roomsAssignedAt: now,
      }
    }))
    logActivity('schedule_rooms_assigned', { ay, sem, count: Object.keys(roomAssignments).length }, account?.id || 'system')
  }

  function getPendingSchedulesForPH(account) {
    const programs = account.programs || []
    return schedules
      .filter((s) => s.status === 'pending_approval' && s.ay === term.ay && s.sem === term.sem)
      .map((schedule) => ({
        ...schedule,
        relevantPrograms: programs,
      }))
  }

  function getScheduleFinalizeBlockers(ay, sem) {
    const schedule = savedScheduleForTerm(ay, sem)
    const blockers = []
    if (!schedule) blockers.push('No generated schedule has been saved yet.')
    else if (schedule.status !== 'approved' && !schedule.finalized) blockers.push('Generated schedule is not approved by the Program Head yet.')
    return blockers
  }

  // ✅ Phase 10: Room Conflict Detection & Auto-Fix Support
  function detectRoomConflicts(schedule) {
    if (!schedule?.scheduled) return []
    
    const conflicts = []
    const scheduled = schedule.scheduled
    
    // Check for double-booked rooms (same room, overlapping times)
    for (let i = 0; i < scheduled.length; i++) {
      for (let j = i + 1; j < scheduled.length; j++) {
        const row1 = scheduled[i]
        const row2 = scheduled[j]
        
        // Same room, same day, overlapping times
        if (
          row1.room?.id === row2.room?.id &&
          row1.day === row2.day &&
          row1.start < row2.end &&
          row2.start < row1.end
        ) {
          conflicts.push({
            id: `conflict-${i}-${j}`,
            type: 'double-booked',
            rows: [row1, row2],
            room: row1.room,
            suggestion: 'Move one class to alternative time slot',
          })
        }
      }
    }
    
    return conflicts
  }

  function markRoomsAsTBA(ay, sem, account) {
    // When PH approves, mark all unassigned rooms as TBA
    setSchedules((prev) => prev.map((schedule) => {
      if (schedule.ay === ay && schedule.sem === sem && schedule.status === 'approved') {
        const updatedScheduled = (schedule.scheduled || []).map(row => ({
          ...row,
          room: row.room?.id ? row.room : { id: null, name: 'TBA', type: 'TBA' },
        }))
        return {
          ...schedule,
          scheduled: updatedScheduled,
          roomsMarkedTBABy: account?.id || 'system',
          roomsMarkedTBAAt: new Date().toISOString(),
        }
      }
      return schedule
    }))
    logActivity('rooms_marked_tba', { ay, sem }, account?.id || 'system')
  }

  function getScheduleConflicts(ay, sem) {
    const schedule = savedScheduleForTerm(ay, sem)
    if (!schedule) return []
    return detectRoomConflicts(schedule)
  }

  function suggestAlternativeTimeSlots(conflictRow, schedule) {
    // Returns list of alternative time slots that don't conflict
    if (!schedule?.scheduled) return []
    
    const alternatives = []
    const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const SLOT_DURATION = 30 // minutes
    const OPEN = 450 // 7:30 AM
    const CLOSE = 1290 // 9:30 PM
    
    // Try all possible time slots
    for (const day of CLASS_DAYS) {
      for (let start = OPEN; start + (conflictRow.duration || 60) <= CLOSE; start += SLOT_DURATION) {
        const end = start + (conflictRow.duration || 60)
        
        // Check if this slot conflicts with existing classes
        const hasConflict = schedule.scheduled.some(row => 
          row.room?.id === conflictRow.room?.id &&
          row.day === day &&
          row.start < end &&
          start < row.end &&
          row.id !== conflictRow.id
        )
        
        if (!hasConflict) {
          alternatives.push({
            day,
            start,
            end,
            label: `${day}, ${Math.floor(start/60)}:${String(start%60).padStart(2,'0')} - ${Math.floor(end/60)}:${String(end%60).padStart(2,'0')}`,
          })
        }
      }
    }
    
    return alternatives
  }

  const value = {
    term,
    setTerm,
    isTermFinalized,
    faculty,
    facultyById,
    setFaculty,
    upsertFaculty,
    upsertFacultyMany,
    subjects,
    subjectsById,
    setSubjects,
    upsertSubject,
    rooms,
    setRooms,
    upsertRoom,
    users,
    setUsers,
    upsertUser,
    settings,
    setSettings,
    schedules,
    savedScheduleForTerm,
    saveScheduleForTerm,
    finalizeScheduleForTerm,
    reopenScheduleForTerm,
    getScheduleStatusForTerm,
    submitScheduleForApproval,
    approveScheduleForTerm,
    rejectScheduleForTerm,
    assignRoomsToSchedule,
    getPendingSchedulesForPH,
    getScheduleFinalizeBlockers,
    detectRoomConflicts,
    markRoomsAsTBA,
    getScheduleConflicts,
    suggestAlternativeTimeSlots,
    assignments,
    setAssignments,
    checkCompatibility,
    createAssignment,
    createBulkAssignments,
    withdrawAssignment,
    approveAssignment,
    rejectAssignment,
    submitToProgramHead,
    getFinalizeBlockers,
    finalizeTerm,
    reopenTerm,
    pendingForProgramHead,
    decidedForProgramHead,
    assignmentsForFaculty,
    registrarSummary,
    termAssignments,
    activity,
    logActivity,
    getRecentActivity,
    getFacultyWorkload,
    getCriticalAlerts,
    getFacultyRecommendations,
    getLoadDistribution,
    getAssignmentProgress,
    overloadRequests,
    requestOverload,
    respondToOverloadRequest,
    respondToTeacherOverloadOffer,
    getPendingOverloadRequestsForPH,
    getPendingOverloadOffersForTeacher,
    getOverloadHistoryForFaculty,
    getPendingTeacherOverloadRequests,
    getTBASubmissionsForPH,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
