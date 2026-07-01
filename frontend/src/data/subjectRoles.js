// Identifies subjects that need role-restricted assignment instead of the
// normal program-based specialization match: PE (taught by dedicated PE
// faculty across every program) and NSTP (a single institution-wide
// coordinator, not a per-section subject). Centralized here so Load
// Assignment, validation, and the Scheduler all agree on the same rule.

export function isPESubject(subject) {
  const text = `${subject?.code || ''} ${subject?.title || ''}`
  return /(^|\s)(PE|P\.E\.?|PATH\s*FIT)\b/i.test(text) || /Physical Education/i.test(text)
}

export function isNSTPSubject(subject) {
  return /^NSTP\b/i.test(subject?.code || '') || /National Service Training Program/i.test(subject?.title || '')
}

export function isRoleRestrictedSubject(subject) {
  return isPESubject(subject) || isNSTPSubject(subject)
}

// The faculty `role` tag required to teach a role-restricted subject.
// Returns null for normal subjects (no restriction — falls back to the
// regular program + specialization match).
export function requiredRoleFor(subject) {
  if (isNSTPSubject(subject)) return 'nstp_coordinator'
  if (isPESubject(subject)) return 'pe'
  return null
}

export function facultyHasRole(faculty, role) {
  return faculty?.role === role
}

// Groups subjects that represent "the same institution-wide offering" —
// same code, year, and semester — across every program. NSTP 201 under
// BTVTED-CP and BTVTED-HVACRT are the same real-world class taught once by
// one coordinator, not two separate classes that happen to share a name.
export function groupInstitutionWideSubjects(subjects) {
  const groups = new Map()
  subjects.filter(isNSTPSubject).forEach((s) => {
    const key = `${s.code}__${s.yr}__${s.sem}`
    if (!groups.has(key)) groups.set(key, { code: s.code, title: s.title, yr: s.yr, sem: s.sem, subjects: [] })
    groups.get(key).subjects.push(s)
  })
  return Array.from(groups.values()).sort((a, b) => a.yr - b.yr || a.code.localeCompare(b.code))
}
