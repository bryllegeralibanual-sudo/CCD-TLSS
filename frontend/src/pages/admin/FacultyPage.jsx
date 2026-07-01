import { useMemo, useState } from 'react'
import { AlertTriangle, Camera, Mail, Search, Users, X, BookOpen, Clock, Briefcase, Pencil, Save, Plus, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { useAuth } from '../../auth/AuthContext'
import { PROGRAMS, programLabel } from '../../data/programs'
import { getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import { useTheme } from '../../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const YEAR_LEVELS = [
  { value: 1, label: '1st year' },
  { value: 2, label: '2nd year' },
  { value: 3, label: '3rd year' },
  { value: 4, label: '4th year' },
]

const FACULTY_TEMPLATE_COLUMNS = 'First Name,Last Name,Email,Program,Shared Programs,Specialization,Type,Max Units,Preferred Years'

function splitList(value) {
  if (!value) return []
  return String(value).split(/[;,|]/).map(item => item.trim()).filter(Boolean)
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function pick(row, names) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]))
  for (const name of names) {
    const value = normalized[normalizeHeader(name)]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

function normalizeProgram(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = PROGRAMS.find(program =>
    program.code.toUpperCase().replace(/[^A-Z0-9]/g, '') === compact ||
    program.label.toUpperCase().replace(/[^A-Z0-9]/g, '') === compact
  )
  return match?.code || raw.toUpperCase()
}

function normalizeImportedFaculty(row, index, existingEmails) {
  const fn = String(pick(row, ['First Name', 'FirstName', 'FN', 'Given Name']) || '').trim()
  const ln = String(pick(row, ['Last Name', 'LastName', 'LN', 'Surname', 'Family Name']) || '').trim()
  const email = String(pick(row, ['Email', 'Email Address', 'Mail']) || '').trim()
  const prog = normalizeProgram(pick(row, ['Program', 'Primary Program', 'Prog']))
  const shared = splitList(pick(row, ['Shared Programs', 'Shared', 'Other Programs'])).map(normalizeProgram).filter(Boolean)
  const spec = String(pick(row, ['Specialization', 'Spec', 'Expertise']) || '').trim()
  const type = String(pick(row, ['Type', 'Employment Type', 'Faculty Type']) || 'Full-Time').trim()
  const maxUnits = Number(pick(row, ['Max Units', 'MaxUnits', 'Units']) || 18)
  const preferredYearLevels = splitList(pick(row, ['Preferred Years', 'Preferred Year Levels', 'Years']))
    .map(value => Number(String(value).replace(/[^0-9]/g, '')))
    .filter(value => value >= 1 && value <= 4)

  const errors = []
  if (!fn) errors.push('Missing first name')
  if (!ln) errors.push('Missing last name')
  if (!email) errors.push('Missing email')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email')
  if (!prog) errors.push('Missing program')
  if (prog && !PROGRAMS.some(program => program.code === prog)) errors.push(`Unknown program: ${prog}`)
  if (!spec) errors.push('Missing specialization')
  if (!Number.isFinite(maxUnits) || maxUnits <= 0) errors.push('Invalid max units')

  const emailKey = email.toLowerCase()
  const action = existingEmails.has(emailKey) ? 'update' : 'create'

  return {
    rowNumber: index + 2,
    action,
    errors,
    faculty: {
      fn,
      ln,
      email,
      prog,
      shared: Array.from(new Set([prog, ...shared].filter(Boolean))),
      spec,
      type: type || 'Full-Time',
      maxUnits: Number.isFinite(maxUnits) && maxUnits > 0 ? maxUnits : 18,
      preferred: 'flexible',
      preferredYearLevels,
    },
  }
}

function parseCsv(text) {
  const rows = []
  let cell = ''
  let row = []
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell)
      if (row.some(item => String(item).trim())) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  row.push(cell)
  if (row.some(item => String(item).trim())) rows.push(row)
  const headers = rows.shift() || []
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
}

function normalizePreferredYears(faculty) {
  const years = faculty?.preferredYearLevels || faculty?.preferredYears || []
  if (Array.isArray(years)) return years.map(Number).filter(Boolean)
  if (years) return [Number(years)].filter(Boolean)
  return []
}

function preferredYearLabel(faculty) {
  const years = normalizePreferredYears(faculty)
  if (years.length === 0) return 'Any year level'
  return YEAR_LEVELS.filter(y => years.includes(y.value)).map(y => y.label).join(', ')
}

function sharedProgramLabel(faculty) {
  const shared = (faculty?.shared || []).filter(code => code && code !== faculty.prog)
  if (shared.length === 0) return 'No borrowed programs'
  return shared.map(programLabel).join(', ')
}

function initials(faculty) {
  return `${faculty.fn?.[0] || ''}${faculty.ln?.[0] || ''}`.toUpperCase()
}

function avatarUrl(faculty) {
  return faculty.photo || faculty.picture || faculty.image || ''
}

function LoadBar({ used, max }) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0
  const color = used > max ? '#DC2626' : pct >= 85 ? '#D97706' : MID_GREEN
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-extrabold text-emerald-950/60">Current load</span>
        <span className="font-black" style={{ color }}>{used}/{max} units</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-950/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function FacultyDetailDrawer({ faculty, onClose, dark, term, assignments, subjectsById }) {
  if (!faculty) return null

  const used = getFacultyUnits(assignments, subjectsById, faculty.id, term.sem)
  const max = getFacultyMaxUnits(faculty)
  const percent = max > 0 ? Math.round((used / max) * 100) : 0
  
  const current = assignments
    .filter(a => a.facultyId === faculty.id && a.ay === term.ay && a.status !== 'withdrawn' && subjectsById[a.subjectId]?.sem === term.sem)
    .map(a => ({ ...a, subject: subjectsById[a.subjectId] }))

  const programs = new Set()
  current.forEach(a => {
    if (a.subject?.prog) programs.add(a.subject.prog)
  })

  const subjects = [...new Set(current.map(a => a.subject?.code))].filter(Boolean)
  
  // Estimate hours (assuming 3 hours per lecture unit, 2 hours per lab unit per week)
  const weeklyHours = current.reduce((sum, a) => {
    const subj = a.subject
    return sum + ((subj?.lec || 0) * 3 + (subj?.lab || 0) * 2)
  }, 0)

  const loadStatus = used > max ? 'Overloaded' : percent >= 85 ? 'Near Capacity' : percent >= 50 ? 'Balanced' : 'Underloaded'
  const statusColor = used > max ? '#DC2626' : percent >= 85 ? '#D97706' : percent >= 50 ? MID_GREEN : '#3B82F6'

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-screen w-full max-w-md z-50 overflow-y-auto shadow-2xl transition-transform ${
        dark ? 'bg-[#0A1410] border-l border-emerald-900/30' : 'bg-white'
      }`}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-5" style={{ background: dark ? '#0F1C16' : '#f9fafb', borderBottom: dark ? '1px solid #1a3029' : '1px solid #e5e7eb' }}>
          <h2 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Faculty Details</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          }`}>
            <X size={18} className={dark ? 'text-white' : 'text-gray-600'} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Header with avatar */}
          <div className="flex gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${FOREST}, ${MID_GREEN})` }}>
              {avatarUrl(faculty) ? <img src={avatarUrl(faculty)} alt={`${faculty.fn} ${faculty.ln}`} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white">{initials(faculty)}</div>}
            </div>
            <div className="flex-1">
              <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{faculty.fn} {faculty.ln}</p>
              <p className={`text-sm mt-1 ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>{faculty.spec || 'No specialization'}</p>
              <p className={`text-xs mt-2 font-semibold px-2.5 py-1 rounded-full w-fit ${
                used > max ? 'bg-red-100 text-red-700' : percent >= 85 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>{loadStatus}</p>
            </div>
          </div>

          {/* Workload overview */}
          <div className={`p-4 rounded-lg ${dark ? 'bg-white/8' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-bold ${dark ? 'text-emerald-100' : 'text-gray-700'}`}>Current Load</span>
              <span className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif", color: statusColor }}>{used}/{max} units</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: statusColor }} />
            </div>
            <div className="flex gap-3 mt-3 text-xs">
              <div className={`flex-1 p-2 rounded ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className={dark ? 'text-emerald-200/60' : 'text-gray-500'}>Type</p>
                <p className={`font-bold mt-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{faculty.type || 'Full-Time'}</p>
              </div>
              <div className={`flex-1 p-2 rounded ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className={dark ? 'text-emerald-200/60' : 'text-gray-500'}>Weekly Hrs</p>
                <p className={`font-bold mt-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{weeklyHours} hrs</p>
              </div>
              <div className={`flex-1 p-2 rounded ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className={dark ? 'text-emerald-200/60' : 'text-gray-500'}>Max Units</p>
                <p className={`font-bold mt-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{max} units</p>
              </div>
            </div>
          </div>

          {/* Programs */}
          {programs.size > 0 && (
            <div>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <Briefcase size={16} /> Programs
              </h3>
              <div className="space-y-2">
                {Array.from(programs).map(prog => (
                  <div key={prog} className={`p-3 rounded-lg ${dark ? 'bg-white/8' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>✓ {programLabel(prog)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects taught */}
          {subjects.length > 0 && (
            <div>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <BookOpen size={16} /> Subjects ({subjects.length})
              </h3>
              <div className="space-y-2">
                {subjects.map(code => (
                  <div key={code} className={`p-3 rounded-lg ${dark ? 'bg-white/8' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>• {code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current assignments */}
          {current.length > 0 && (
            <div>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <Clock size={16} /> Current Assignments ({current.length})
              </h3>
              <div className="space-y-2">
                {current.map(a => (
                  <div key={a.id} className={`p-3 rounded-lg ${dark ? 'bg-white/8' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{a.subject?.code}</p>
                    <p className={`text-sm font-semibold mt-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{a.subject?.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>{a.section}</span>
                      <span className={`text-xs font-semibold ${dark ? 'text-emerald-200' : 'text-emerald-700'}`}>{(a.subject?.lec || 0) + (a.subject?.lab || 0)} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.length === 0 && (
            <div className={`p-8 rounded-lg text-center ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Clock size={32} className={`mx-auto mb-3 ${dark ? 'text-emerald-900' : 'text-gray-300'}`} />
              <p className={dark ? 'text-emerald-200/50' : 'text-gray-400'}>No active assignments this term</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function FacultyEditModal({ faculty, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...faculty,
    preferredYearLevels: normalizePreferredYears(faculty),
  }))

  if (!faculty) return null

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleYear(year) {
    setForm(prev => {
      const current = new Set(normalizePreferredYears(prev))
      if (current.has(year)) current.delete(year)
      else current.add(year)
      return { ...prev, preferredYearLevels: Array.from(current).sort((a, b) => a - b) }
    })
  }

  function toggleSharedProgram(code) {
    setForm(prev => {
      const current = new Set(prev.shared || [])
      if (current.has(code)) current.delete(code)
      else current.add(code)
      if (prev.prog) current.add(prev.prog)
      return { ...prev, shared: Array.from(current) }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      shared: Array.from(new Set([form.prog, ...(form.shared || [])].filter(Boolean))),
      maxUnits: Number(form.maxUnits || 18),
      preferredYearLevels: normalizePreferredYears(form),
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 z-50 w-[min(94vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div>
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{faculty.id ? 'Edit Faculty' : 'Add Faculty'}</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">{faculty.id ? `${faculty.fn} ${faculty.ln}` : 'Create a new faculty record'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10" aria-label="Close edit faculty">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              First Name
              <input required value={form.fn || ''} onChange={e => updateField('fn', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Last Name
              <input required value={form.ln || ''} onChange={e => updateField('ln', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
            Email
            <input required type="email" value={form.email || ''} onChange={e => updateField('email', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Program
              <select required value={form.prog || ''} onChange={e => updateField('prog', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-bold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`}>
                <option value="">Choose program</option>
                {PROGRAMS.map(program => <option key={program.code} value={program.code}>{program.label}</option>)}
              </select>
            </label>
            <div className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Shared Programs
              <div className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} p-2 normal-case tracking-normal`}>
                <div className="grid gap-1.5">
                  {PROGRAMS.map(program => {
                    const checked = (form.shared || []).includes(program.code) || form.prog === program.code
                    return (
                      <label key={program.code} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-950/70 hover:${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={form.prog === program.code}
                          onChange={() => toggleSharedProgram(program.code)}
                          className="h-4 w-4 accent-emerald-700"
                        />
                        {program.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Type
              <select value={form.type || 'Full-Time'} onChange={e => updateField('type', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-bold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Max Units
              <input type="number" min="1" value={form.maxUnits || 18} onChange={e => updateField('maxUnits', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-bold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
            Specialization
            <input value={form.spec || ''} onChange={e => updateField('spec', e.target.value)} className={`rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
          </label>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-950/45">Prioritize Year Levels</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {YEAR_LEVELS.map(year => {
                const active = normalizePreferredYears(form).includes(year.value)
                return (
                  <button
                    key={year.value}
                    type="button"
                    onClick={() => toggleYear(year.value)}
                    className="rounded-xl border px-3 py-2 text-xs font-black transition"
                    style={{
                      borderColor: active ? MID_GREEN : 'rgba(3,56,38,0.14)',
                      background: active ? 'rgba(15,107,60,0.10)' : '#fff',
                      color: active ? MID_GREEN : 'rgba(3,56,38,0.55)',
                    }}
                  >
                    {year.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs font-semibold text-emerald-950/45">Selected years are prioritized during manual recommendations and auto-assignment.</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-emerald-950/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-emerald-950/15 px-4 py-2 text-sm font-black text-emerald-950/65">Cancel</button>
            <button type="submit" className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
              <Save size={15} /> Save
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function FacultyImportModal({ faculty, onClose, onImport }) {
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const existingEmails = useMemo(() => new Set(faculty.map(item => String(item.email || '').toLowerCase()).filter(Boolean)), [faculty])
  const validRows = rows.filter(row => row.errors.length === 0)
  const errorRows = rows.filter(row => row.errors.length > 0)

  async function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setError('')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let rawRows = []
      if (ext === 'csv') {
        rawRows = parseCsv(await file.text())
      } else if (ext === 'xlsx' || ext === 'xls') {
        const data = await file.arrayBuffer()
        // Lazy-load xlsx so the ~750 KB library is only downloaded when an
        // Excel file is actually chosen — not on every page load.
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      } else {
        setError('Upload a .xlsx, .xls, or .csv file.')
        setRows([])
        return
      }
      setRows(rawRows.map((row, index) => normalizeImportedFaculty(row, index, existingEmails)))
    } catch (err) {
      setError(err?.message || 'Could not read the faculty file.')
      setRows([])
    }
  }

  function downloadTemplate() {
    const sample = [
      FACULTY_TEMPLATE_COLUMNS,
      'Juan,Dela Cruz,juan.delacruz@ccd.edu.ph,BTVTED-CP,"BTVTED-HVACRT","CP Programming, Web Systems & Application Development",Full-Time,18,"1,2"',
    ].join('\n')
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'faculty-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function confirmImport() {
    if (validRows.length === 0) return
    onImport(validRows.map(row => row.faculty))
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(96vw,880px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div>
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Import Faculty</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">Accepted columns: {FACULTY_TEMPLATE_COLUMNS}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10" aria-label="Close import faculty">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-emerald-900/25 bg-emerald-50/50 px-4 py-5">
              <FileSpreadsheet size={22} className="text-emerald-700" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{fileName || 'Choose Excel or CSV file'}</p>
                <p className="mt-0.5 text-xs font-semibold text-emerald-950/50">Supports .xlsx, .xls, and .csv</p>
              </div>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={downloadTemplate} className={`rounded-2xl border border-emerald-950/15 px-4 py-3 text-sm font-black text-emerald-800 hover:${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
              Template CSV
            </button>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          {rows.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Ready</p><p className="mt-1 text-2xl font-black text-emerald-700">{validRows.length}</p></div>
              <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Updates</p><p className="mt-1 text-2xl font-black text-blue-700">{validRows.filter(row => row.action === 'update').length}</p></div>
              <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Errors</p><p className="mt-1 text-2xl font-black text-red-700">{errorRows.length}</p></div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-emerald-950/10">
              <div className="grid grid-cols-[70px_1fr_1fr_1fr] gap-3 bg-emerald-950/[0.04] px-4 py-2 text-[11px] font-black uppercase text-emerald-950/45">
                <span>Row</span><span>Name</span><span>Program</span><span>Status</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-emerald-950/10">
                {rows.map(row => (
                  <div key={row.rowNumber} className="grid grid-cols-[70px_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs">
                    <span className="font-black text-emerald-950/50">{row.rowNumber}</span>
                    <span className={`font-bold ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{row.faculty.ln}, {row.faculty.fn}<br /><span className="font-semibold text-emerald-950/45">{row.faculty.email}</span></span>
                    <span className="font-semibold text-emerald-950/65">{programLabel(row.faculty.prog)}</span>
                    {row.errors.length ? (
                      <span className="font-bold text-red-700">{row.errors.join(', ')}</span>
                    ) : (
                      <span className="flex items-center gap-1 font-black text-emerald-700"><CheckCircle2 size={13} /> {row.action === 'update' ? 'Update existing' : 'Create new'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-emerald-950/10 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-emerald-950/15 px-4 py-2 text-sm font-black text-emerald-950/65">Cancel</button>
          <button type="button" onClick={confirmImport} disabled={validRows.length === 0} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: MID_GREEN }}>
            <Upload size={15} /> Import {validRows.length || ''} Faculty
          </button>
        </div>
      </div>
    </>
  )
}

export default function FacultyPage() {
  const { term, faculty, assignments, subjectsById, upsertFaculty, upsertFacultyMany } = useData()
  const { dark } = useTheme()
  const { account } = useAuth()
  const isHeadView = account?.role === 'program_head'
  const headPrograms = account?.programs || []
  
  const [program, setProgram] = useState(isHeadView ? (headPrograms[0] || 'ALL') : 'ALL')
  const [query, setQuery] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [importingFaculty, setImportingFaculty] = useState(false)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faculty
      .map(f => {
        const used = getFacultyUnits(assignments, subjectsById, f.id, term.sem)
        const max = getFacultyMaxUnits(f)
        const current = assignments
          .filter(a => a.facultyId === f.id && a.ay === term.ay && a.status !== 'withdrawn' && subjectsById[a.subjectId]?.sem === term.sem)
          .map(a => ({ ...a, subject: subjectsById[a.subjectId] }))
        return { ...f, used, max, current }
      })
      .filter(f => {
        const shared = f.shared || []
        if (isHeadView) return headPrograms.includes(f.prog) || shared.some(code => headPrograms.includes(code))
        return program === 'ALL' || f.prog === program || shared.includes(program)
      })
      .filter(f => !q || `${f.fn} ${f.ln} ${f.email} ${f.spec} ${f.prog} ${sharedProgramLabel(f)} ${preferredYearLabel(f)}`.toLowerCase().includes(q))
      .sort((a, b) => programLabel(a.prog).localeCompare(programLabel(b.prog)) || a.ln.localeCompare(b.ln))
  }, [assignments, faculty, program, query, subjectsById, term.ay, term.sem, isHeadView, headPrograms])

  const byProgram = useMemo(() => {
    const groups = new Map()
    rows.forEach(f => {
      const borrowedForHead = isHeadView && !headPrograms.includes(f.prog) && (f.shared || []).some(code => headPrograms.includes(code))
      const key = borrowedForHead ? 'BORROWED' : (f.prog || 'Unassigned')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(f)
    })
    return Array.from(groups.entries())
  }, [rows, isHeadView, headPrograms])

  const overloaded = rows.filter(f => f.used > f.max).length
  const nearCapacity = rows.filter(f => f.used <= f.max && f.max && f.used / f.max >= 0.85).length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className={`overflow-hidden rounded-2xl border border-emerald-900/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Users size={19} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Faculty Directory</p>
            <p className="mt-0.5 text-xs text-emerald-100/70">Click any faculty card to view detailed analytics and current assignments</p>
          </div>
          {!isHeadView && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditingFaculty({ fn: '', ln: '', email: '', prog: '', shared: [], spec: '', type: 'Full-Time', maxUnits: 18, preferred: 'flexible', preferredYearLevels: [] })} className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-xs font-black text-white hover:bg-white/20">
                <Plus size={14} /> Add
              </button>
              <button type="button" onClick={() => setImportingFaculty(true)} className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-xs font-black text-white hover:bg-white/20">
                <Upload size={14} /> Import
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Faculty</p><p className={`mt-1 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{rows.length}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Overloaded</p><p className="mt-1 text-2xl font-black text-red-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{overloaded}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Near Capacity</p><p className="mt-1 text-2xl font-black text-amber-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{nearCapacity}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Term</p><p className={`mt-1 text-lg font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{term.sem}</p></div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-emerald-950/10 p-4">
          {!isHeadView && (
            <select value={program} onChange={e => setProgram(e.target.value)} className={`rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`}>
              <option value="ALL">All programs</option>
              {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          )}
          <div className="relative min-w-64 flex-1">
            <Search size={14} className="absolute left-3 top-3 text-emerald-950/35" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search faculty, email, specialization" className={`w-full rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} py-2 pl-9 pr-3 text-sm ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
          </div>
        </div>
      </div>

      {byProgram.map(([code, people]) => (
        <section key={code} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{code === 'BORROWED' ? 'Borrowed Teachers' : programLabel(code)}</h2>
              {code === 'BORROWED' && <p className="mt-0.5 text-xs font-semibold text-emerald-950/45">Faculty shared from other programs</p>}
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: `${GOLD}24`, color: FOREST }}>{people.length} faculty</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {people.map(f => {
              const img = avatarUrl(f)
              return (
                <article key={f.id} onClick={() => setSelectedFaculty(f)} className={`rounded-2xl border border-emerald-900/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} p-4 shadow-sm hover:shadow-md hover:border-emerald-700/20 cursor-pointer transition-all`}>
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-emerald-900/10">
                      {img ? <img src={img} alt={`${f.fn} ${f.ln}`} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-black text-white" style={{ background: `linear-gradient(135deg, ${FOREST}, ${MID_GREEN})` }}>{initials(f)}</div>}
                      {!img && <Camera size={13} className="absolute bottom-1 right-1 text-white/75" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{f.ln}, {f.fn}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-emerald-950/55">{f.spec || 'Specialization not set'}</p>
                      <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-emerald-950/45"><Mail size={11} /> {f.email}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <LoadBar used={f.used} max={f.max} />
                    {f.used > f.max && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-red-700"><AlertTriangle size={12} /> Over max load</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-emerald-950/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-950/65">{programLabel(f.prog)}</span>
                    <span className={`rounded-full ${dark ? 'bg-emerald-900/30' : 'bg-emerald-100'} px-2.5 py-1 text-[10px] font-black text-emerald-800`}>{preferredYearLabel(f)}</span>
                    {code === 'BORROWED' && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-800">Borrowed</span>}
                    {(f.shared || []).filter(p => p !== f.prog).map(p => <span key={p} className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">{programLabel(p)}</span>)}
                  </div>
                  {!isHeadView && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingFaculty(f)
                      }}
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-800 hover:${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  )}
                  <div className="mt-3 border-t border-emerald-950/10 pt-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-emerald-950/40">Current loads</p>
                    {f.current.length === 0 ? <p className="mt-1 text-xs font-semibold text-emerald-950/40">No active load this term.</p> : (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {f.current.slice(0, 3).map(a => <p key={a.id} className="truncate text-xs text-emerald-950/65"><span className="font-black">{a.subject?.code}</span> - {a.section}</p>)}
                        {f.current.length > 3 && <p className="text-xs font-bold text-emerald-700">+{f.current.length - 3} more</p>}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {/* Faculty Detail Drawer */}
      <FacultyDetailDrawer 
        faculty={selectedFaculty} 
        onClose={() => setSelectedFaculty(null)}
        dark={false}
        term={term}
        assignments={assignments}
        subjectsById={subjectsById}
      />
      {editingFaculty && (
        <FacultyEditModal
          faculty={editingFaculty}
          onClose={() => setEditingFaculty(null)}
          onSave={(record) => {
            upsertFaculty(record)
            setEditingFaculty(null)
          }}
        />
      )}
      {importingFaculty && (
        <FacultyImportModal
          faculty={faculty}
          onClose={() => setImportingFaculty(false)}
          onImport={(records) => {
            upsertFacultyMany(records)
            setImportingFaculty(false)
          }}
        />
      )}
    </div>
  )
}
