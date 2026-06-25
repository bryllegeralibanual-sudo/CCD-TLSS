import { FACULTY_SEED } from '../data/facultySeed'

// MOCK accounts — no real backend yet. Passwords are plain text on purpose
// (this is a stand-in until a real auth backend is wired up — do not ship
// this account list as-is to anything public-facing).
//
// Roles: 'admin' | 'program_head' | 'registrar' | 'teacher'
// A program_head's `programs` array scopes which program codes they approve for.
// A teacher account links to a FACULTY_SEED record via facultyId.

const STATIC_ACCOUNTS = [
  { id: 'admin-1', email: 'admin@ccd.edu.ph', password: 'admin123', role: 'admin', name: 'Admin (Teacher-in-Charge)' },
  { id: 'head-btvted', email: 'head.btvted@ccd.edu.ph', password: 'head123', role: 'program_head', name: 'BTVTEd Program Head', programs: ['BTVTED-CP', 'BTVTED-HVACRT'] },
  { id: 'head-beced', email: 'head.beced@ccd.edu.ph', password: 'head123', role: 'program_head', name: 'BECEd Program Head', programs: ['BECED'] },
  { id: 'head-bsentrep', email: 'head.bsentrep@ccd.edu.ph', password: 'head123', role: 'program_head', name: 'BS Entrepreneurship Program Head', programs: ['BSENTREP'] },
  { id: 'registrar-1', email: 'registrar@ccd.edu.ph', password: 'registrar123', role: 'registrar', name: 'Registrar' },
]

const TEACHER_ACCOUNTS = FACULTY_SEED.map((f) => ({
  id: `teacher-${f.id}`,
  email: f.email,
  password: 'teacher123',
  role: 'teacher',
  name: `${f.fn} ${f.ln}`,
  facultyId: f.id,
}))

export const MOCK_ACCOUNTS = [...STATIC_ACCOUNTS, ...TEACHER_ACCOUNTS]

const ACCOUNT_OVERRIDES_KEY = 'ccd-tlss.account-overrides'

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_OVERRIDES_KEY) || '{}')
  } catch {
    return {}
  }
}

function accountsWithOverrides() {
  const overrides = loadOverrides()
  return MOCK_ACCOUNTS.map((account) => ({ ...account, ...(overrides[account.id] || {}) }))
}

export function saveAccountOverride(id, patch) {
  const overrides = loadOverrides()
  const next = { ...(overrides[id] || {}), ...patch }
  localStorage.setItem(ACCOUNT_OVERRIDES_KEY, JSON.stringify({ ...overrides, [id]: next }))
  return accountsWithOverrides().find((account) => account.id === id) || null
}

export function findAccount(email, password) {
  return accountsWithOverrides().find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password) || null
}

export function findAccountById(id) {
  return accountsWithOverrides().find((a) => a.id === id) || null
}

// Quick-login list shown on the login page so this is actually demoable.
export const DEMO_LOGINS = [
  { label: 'Admin', email: 'admin@ccd.edu.ph', password: 'admin123' },
  { label: 'BTVTEd Program Head', email: 'head.btvted@ccd.edu.ph', password: 'head123' },
  { label: 'BECEd Program Head', email: 'head.beced@ccd.edu.ph', password: 'head123' },
  { label: 'BS Entrep Program Head', email: 'head.bsentrep@ccd.edu.ph', password: 'head123' },
  { label: 'Registrar', email: 'registrar@ccd.edu.ph', password: 'registrar123' },
  { label: 'Teacher (Romel Salazar)', email: 'romel.salazar@ccd.edu.ph', password: 'teacher123' },
]
