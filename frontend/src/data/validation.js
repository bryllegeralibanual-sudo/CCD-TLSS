// Faculty/subject compatibility checks — ported from checkAssignCompat() in
// public/ccd-scheduling.html so both systems enforce the same rules.
// NOTE: the specialization check is the same coarse heuristic as the legacy
// app (matches the subject code's 2-letter prefix against the spec text).
// That's flagged as a known limitation to revisit later, not a fix made here.

export function facultyPrograms(fac) {
  return [fac.prog, ...(fac.shared || [])].filter((p, i, a) => p && a.indexOf(p) === i)
}

export function canTeachProgram(fac, progCode) {
  return facultyPrograms(fac).includes(progCode)
}

export function getFacultyMaxUnits(fac) {
  return fac.maxUnits || (fac.type === 'Part-Time' ? 12 : 18)
}

// Units the faculty member already carries this semester, optionally excluding
// one assignment id (useful when re-checking during an edit).
export function getFacultyUnits(assignments, subjectsById, facId, sem, excludeId = null) {
  return assignments
    .filter((a) => a.facultyId === facId && a.id !== excludeId && a.status !== 'rejected' && a.status !== 'withdrawn')
    .map((a) => subjectsById[a.subjectId])
    .filter((s) => s && (!sem || s.sem === sem))
    .reduce((sum, s) => sum + s.lec + s.lab, 0)
}

export function getTeacherSubjectCodes(assignments, subjectsById, facId, excludeId = null) {
  const codes = new Set()
  assignments
    .filter((a) => a.facultyId === facId && a.id !== excludeId && a.status !== 'rejected' && a.status !== 'withdrawn')
    .forEach((a) => {
      const subj = subjectsById[a.subjectId]
      if (subj) codes.add(subj.code)
    })
  return codes
}

// Returns { ok, blockers: [...], notes: [...] } for a candidate assignment.
// blockers stop the save; notes are informational (shown either way).
export function checkAssignmentCompatibility({ faculty, subject, section, assignments, subjectsById, excludeId = null }) {
  const blockers = []
  const notes = []

  if (!faculty || !subject) {
    return { ok: false, blockers: ['Select a faculty member and a subject.'], notes: [] }
  }

  if (!canTeachProgram(faculty, subject.prog)) {
    blockers.push(`${faculty.ln} is not registered under ${subject.prog}, so they can't be assigned this subject.`)
  }

  const specMatch = faculty.spec && subject.code && faculty.spec.toLowerCase().includes(subject.code.slice(0, 2).toLowerCase())
  if (faculty.spec && !specMatch) {
    notes.push(`Specialization mismatch: ${faculty.ln} lists "${faculty.spec}" — not an exact match for ${subject.title}. Allowed, but flagged for the Program Head.`)
  } else if (specMatch) {
    notes.push(`Specialization match: ${faculty.spec}.`)
  }

  const curUnits = getFacultyUnits(assignments, subjectsById, faculty.id, subject.sem, excludeId)
  const max = getFacultyMaxUnits(faculty)
  const afterUnits = curUnits + subject.lec + subject.lab
  if (afterUnits > max) {
    blockers.push(`Exceeds unit cap: ${afterUnits}/${max} units in ${subject.sem === '2nd' ? '2nd' : subject.sem} semester.`)
  } else if (afterUnits > max * 0.85) {
    notes.push(`Near the unit limit: ${afterUnits}/${max} units after this assignment.`)
  } else {
    notes.push(`Units OK: ${afterUnits}/${max}.`)
  }

  const currentCodes = getTeacherSubjectCodes(assignments, subjectsById, faculty.id, excludeId)
  const isNewCode = !currentCodes.has(subject.code)
  const wouldHave = isNewCode ? currentCodes.size + 1 : currentCodes.size
  if (wouldHave > 3) {
    blockers.push(`Subject-code limit exceeded: would teach ${wouldHave} different subject codes (max 3). Current: ${Array.from(currentCodes).join(', ') || 'none'}.`)
  } else {
    notes.push(`Subject diversity OK: ${wouldHave}/3 codes.`)
  }

  const duplicate = assignments.find(
    (a) => a.id !== excludeId && a.facultyId === faculty.id && a.subjectId === subject.id && a.section === section && a.status !== 'rejected' && a.status !== 'withdrawn',
  )
  if (duplicate) {
    blockers.push('This faculty member is already assigned to this exact subject and section.')
  }

  return { ok: blockers.length === 0, blockers, notes }
}
