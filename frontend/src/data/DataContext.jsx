import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { FACULTY_SEED } from './facultySeed'
import { SUBJECTS } from './subjects'
import { PROGRAM_BY_CODE } from './programs'
import { checkAssignmentCompatibility } from './validation'

const DataContext = createContext(null)

const ASSIGNMENTS_KEY = 'ccd-tlss.assignments'
const FINALIZED_KEY = 'ccd-tlss.finalized-terms'
const TERM_KEY = 'ccd-tlss.current-term'

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

  useEffect(() => localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)), [assignments])
  useEffect(() => localStorage.setItem(FINALIZED_KEY, JSON.stringify(finalizedTerms)), [finalizedTerms])
  useEffect(() => localStorage.setItem(TERM_KEY, JSON.stringify(term)), [term])

  const faculty = FACULTY_SEED
  const facultyById = useMemo(() => Object.fromEntries(faculty.map((f) => [f.id, f])), [faculty])
  const subjectsById = useMemo(() => Object.fromEntries(SUBJECTS.map((s) => [s.id, s])), [])

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
      status: 'pending',
      submittedBy: account.id,
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      comment: null,
    }
    setAssignments((prev) => [...prev, newAssignment])
    return { ok: true, blockers: [], assignment: newAssignment }
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

  const value = {
    term,
    setTerm,
    isTermFinalized,
    faculty,
    facultyById,
    subjects: SUBJECTS,
    subjectsById,
    assignments,
    checkCompatibility,
    createAssignment,
    withdrawAssignment,
    approveAssignment,
    rejectAssignment,
    getFinalizeBlockers,
    finalizeTerm,
    reopenTerm,
    pendingForProgramHead,
    decidedForProgramHead,
    assignmentsForFaculty,
    registrarSummary,
    termAssignments,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}