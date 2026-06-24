import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { FACULTY_SEED } from './facultySeed'
import { SUBJECTS } from './subjects'
import { PROGRAM_BY_CODE } from './programs'
import { checkAssignmentCompatibility, getFacultyUnits, getFacultyMaxUnits, canTeachProgram } from './validation'

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
  { id: 12, name: 'B4-C2 SPEECH LAB', type: 'Speech Lab', capacity: 35, prog: '', status: 'Active' },
  { id: 13, name: 'SCIENCE LABORATORY', type: 'Science Lab', capacity: 32, prog: '', status: 'Active' },
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

// NOTE: this whole file is a stand-in for a real backend. Everything here is
// stored in the browser's localStorage so the approval workflow is demoable
// without standing up a server/database. Swap the bodies of these functions
// for real API calls later — the shapes (assignment objects, function
// signatures) were designed so that swap doesn't require touching the pages.
export function DataProvider({ children }) {
  const [assignments, setAssignments] = useState(() => load(ASSIGNMENTS_KEY, []))
  const [finalizedTerms, setFinalizedTerms] = useState(() => load(FINALIZED_KEY, []))
  const [term, setTerm] = useState(() => load(TERM_KEY, { ay: '2025-2026', sem: '1st' }))
  const [faculty, setFaculty] = useState(() => load(FACULTY_KEY, FACULTY_SEED))
  const [subjects, setSubjects] = useState(() => load(SUBJECTS_KEY, SUBJECTS))
  const [rooms, setRooms] = useState(() => load(ROOMS_KEY, DEFAULT_ROOMS))
  const [users, setUsers] = useState(() => load(USERS_KEY, []))
  const [settings, setSettings] = useState(() => load(SETTINGS_KEY, DEFAULT_SETTINGS))
  const [activity, setActivity] = useState(() => load(ACTIVITY_KEY, []))

  useEffect(() => localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)), [assignments])
  useEffect(() => localStorage.setItem(FINALIZED_KEY, JSON.stringify(finalizedTerms)), [finalizedTerms])
  useEffect(() => localStorage.setItem(TERM_KEY, JSON.stringify(term)), [term])
  useEffect(() => localStorage.setItem(FACULTY_KEY, JSON.stringify(faculty)), [faculty])
  useEffect(() => localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)), [subjects])
  useEffect(() => localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)), [rooms])
  useEffect(() => localStorage.setItem(USERS_KEY, JSON.stringify(users)), [users])
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings])
  useEffect(() => localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity)), [activity])

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

    return alerts
  }

  // Faculty recommendations for a subject based on specialization + workload
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

        // Specialization match score (0-100)
        let specScore = 0
        if (fac.spec) {
          const subjCodePrefix = subject.code.slice(0, 2).toLowerCase()
          if (fac.spec.toLowerCase().includes(subjCodePrefix)) specScore = 100
          else if (fac.spec.toLowerCase().includes(subject.prog.slice(0, 4).toLowerCase())) specScore = 50
          else specScore = 20
        }

        // Workload score (prefer less loaded, 0-100)
        const workloadScore = ((maxUnits - currentUnits) / maxUnits) * 100

        // Total score for ranking
        const score = specScore * 0.6 + workloadScore * 0.4

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

  const value = {
    term,
    setTerm,
    isTermFinalized,
    faculty,
    facultyById,
    setFaculty,
    upsertFaculty,
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
    assignments,
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
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
