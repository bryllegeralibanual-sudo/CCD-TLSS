import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from './api'
import { useAuth } from '../auth/AuthContext'
import { FACULTY_SEED } from './facultySeed'
import { SUBJECTS } from './subjects'
import { PROGRAM_BY_CODE } from './programs'
import { checkAssignmentCompatibility } from './validation'

const DataContext = createContext(null)

const TERM_KEY = 'ccd-tlss.current-term'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function DataProvider({ children }) {
  const { token } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [finalizedTerms, setFinalizedTerms] = useState([])
  const [faculty, setFaculty] = useState(FACULTY_SEED)
  const [subjects, setSubjects] = useState(SUBJECTS)
  const [term, setTerm] = useState(() => load(TERM_KEY, { ay: '2025-2026', sem: '1st' }))

  useEffect(() => {
    localStorage.setItem(TERM_KEY, JSON.stringify(term))
  }, [term])

  useEffect(() => {
    if (!token) {
      setAssignments([])
      setFinalizedTerms([])
      setFaculty(FACULTY_SEED)
      setSubjects(SUBJECTS)
      return
    }

    api.getMetadata(token)
      .then((data) => {
        setFaculty(data.faculty ?? FACULTY_SEED)
        setSubjects(data.subjects ?? SUBJECTS)
        setAssignments(data.assignments ?? [])
        setFinalizedTerms(data.finalizedTerms ?? [])
      })
      .catch((error) => {
        console.error('Failed to load data metadata', error)
      })
  }, [token])

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
  async function createAssignment({ facultyId, subjectId, section }, account) {
    if (isTermFinalized(term.ay, term.sem)) {
      return { ok: false, blockers: [`${term.ay} ${term.sem} semester is already finalized — reopen it before making changes.`] }
    }
    const check = checkCompatibility({ facultyId, subjectId, section })
    if (!check.ok) return check

    try {
      const newAssignment = await api.createAssignment(
        { facultyId, subjectId, section, ay: term.ay, sem: term.sem },
        token,
      )
      setAssignments((prev) => [...prev, newAssignment])
      return { ok: true, blockers: [], assignment: newAssignment }
    } catch (error) {
      return { ok: false, blockers: [error.message || 'Unable to create assignment.'] }
    }
  }

  async function withdrawAssignment(id) {
    try {
      const updated = await api.withdrawAssignment(id, token)
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (error) {
      console.error('Failed to withdraw assignment', error)
    }
  }

  async function approveAssignment(id, account) {
    try {
      const updated = await api.approveAssignment(id, {}, token)
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (error) {
      console.error('Failed to approve assignment', error)
    }
  }

  async function rejectAssignment(id, account, comment) {
    try {
      const updated = await api.rejectAssignment(id, { comment }, token)
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (error) {
      console.error('Failed to reject assignment', error)
    }
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

  async function finalizeTerm(ay, sem, account) {
    const blockers = getFinalizeBlockers(ay, sem)
    if (blockers.length) return { ok: false, blockers }

    try {
      await api.finalizeTerm({ ay, sem }, token)
      setFinalizedTerms((prev) => [...prev, { ay, sem, finalizedBy: account.id, finalizedAt: new Date().toISOString() }])
      return { ok: true, blockers: [] }
    } catch (error) {
      return { ok: false, blockers: [error.message || 'Unable to finalize term.'] }
    }
  }

  async function reopenTerm(ay, sem) {
    try {
      await api.reopenTerm({ ay, sem }, token)
      setFinalizedTerms((prev) => prev.filter((t) => !(t.ay === ay && t.sem === sem)))
    } catch (error) {
      console.error('Failed to reopen term', error)
    }
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
    subjects,
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