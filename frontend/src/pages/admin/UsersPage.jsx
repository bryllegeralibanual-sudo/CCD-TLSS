import { useMemo, useState } from 'react'
import { CheckCircle2, KeyRound, Pencil, Plus, Search, ShieldCheck, UserCog, X } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'
import { useTheme } from '../../context/ThemeContext'
import ConfirmDialog from '../../components/ConfirmDialog'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'

const ROLE_LABELS = {
  admin: 'Administrator',
  program_head: 'Program Head',
  registrar: 'Registrar',
  teacher: 'Faculty',
}

const PROGRAM_ORDER = ['BTVTED-CP', 'BTVTED-HVACRT', 'BECED', 'BSENTREP', 'UNASSIGNED']

function makeUserId(role) {
  return `${role}-${Date.now()}`
}

function emptyUser() {
  return {
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    programs: [],
    facultyId: '',
    status: 'active',
  }
}

function UserModal({ user, faculty, onClose, onSave }) {
  const { dark } = useTheme()
  const [form, setForm] = useState(() => ({ ...emptyUser(), ...user }))
  const isNew = !user?.id

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleProgram(code) {
    setForm(prev => {
      const current = new Set(prev.programs || [])
      if (current.has(code)) current.delete(code)
      else current.add(code)
      return { ...prev, programs: Array.from(current) }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const saved = {
      ...form,
      id: form.id || makeUserId(form.role),
      password: form.password || 'password123',
      managedEdited: true,
      programs: form.role === 'program_head' ? (form.programs || []) : [],
      facultyId: form.role === 'teacher' && form.facultyId ? Number(form.facultyId) : null,
    }
    onSave(saved)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 z-50 w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div>
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{isNew ? 'Add User' : 'Edit User'}</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">Manage account role and access</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10" aria-label="Close user modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[74vh] flex-col gap-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Name
              <input required value={form.name || ''} onChange={e => update('name', e.target.value)} className={`rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Email
              <input required type="email" value={form.email || ''} onChange={e => update('email', e.target.value)} className={`rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Role
              <select value={form.role} onChange={e => update('role', e.target.value)} className={`rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-bold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Status
              <select value={form.status || 'active'} onChange={e => update('status', e.target.value)} className={`rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-bold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Password
              <input value={form.password || ''} onChange={e => update('password', e.target.value)} placeholder={isNew ? 'Required to login' : 'Keep current'} className={`rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-semibold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
            </label>
          </div>

          {form.role === 'program_head' && (
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-950/45">Program Scope</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PROGRAMS.map(program => (
                  <label key={program.code} className="flex items-center gap-2 rounded-xl border border-emerald-950/10 px-3 py-2 text-sm font-bold text-emerald-950/70">
                    <input type="checkbox" checked={(form.programs || []).includes(program.code)} onChange={() => toggleProgram(program.code)} className="h-4 w-4 accent-emerald-700" />
                    {program.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.role === 'teacher' && (
            <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-950/45">
              Linked Faculty Profile
              <select value={form.facultyId || ''} onChange={e => update('facultyId', e.target.value)} className={`rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-bold normal-case tracking-normal ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`}>
                <option value="">No linked faculty</option>
                {faculty.map(fac => <option key={fac.id} value={fac.id}>{fac.ln}, {fac.fn} - {programLabel(fac.prog)}</option>)}
              </select>
            </label>
          )}

          <div className="flex justify-end gap-2 border-t border-emerald-950/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-emerald-950/15 px-4 py-2 text-sm font-black text-emerald-950/65">Cancel</button>
            <button type="submit" className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white" style={{ background: MID_GREEN }}>
              <CheckCircle2 size={15} /> Save User
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function UsersPage() {
  const { users, setUsers, faculty } = useData()
  const { dark } = useTheme()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null) // { title, message, variant, onConfirm }

  const accounts = useMemo(() => users.map(account => ({ status: 'active', ...account })), [users])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return accounts
      .filter(account => {
        const linkedFaculty = faculty.find(fac => fac.id === account.facultyId)
        return !q || `${account.name} ${account.email} ${account.role} ${(account.programs || []).join(' ')} ${linkedFaculty?.prog || ''} ${linkedFaculty?.ln || ''} ${linkedFaculty?.fn || ''}`.toLowerCase().includes(q)
      })
      .sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name))
  }, [accounts, faculty, query])

  const groupedAccounts = useMemo(() => {
    const systemAccounts = visible
      .filter(account => account.role !== 'teacher')
      .sort((a, b) => {
        const order = { admin: 0, program_head: 1, registrar: 2 }
        return (order[a.role] ?? 9) - (order[b.role] ?? 9) || a.name.localeCompare(b.name)
      })

    const facultyGroups = new Map()
    visible
      .filter(account => account.role === 'teacher')
      .forEach(account => {
        const linkedFaculty = faculty.find(fac => fac.id === account.facultyId)
        const key = linkedFaculty?.prog || 'UNASSIGNED'
        if (!facultyGroups.has(key)) facultyGroups.set(key, [])
        facultyGroups.get(key).push(account)
      })

    const facultySections = Array.from(facultyGroups.entries())
      .sort(([a], [b]) => {
        const ai = PROGRAM_ORDER.indexOf(a)
        const bi = PROGRAM_ORDER.indexOf(b)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || programLabel(a).localeCompare(programLabel(b))
      })
      .map(([code, items]) => ({
        key: `faculty-${code}`,
        title: `${programLabel(code)} Faculty Accounts`,
        subtitle: `${items.length} faculty account${items.length === 1 ? '' : 's'}`,
        items: items.sort((a, b) => {
          const af = faculty.find(fac => fac.id === a.facultyId)
          const bf = faculty.find(fac => fac.id === b.facultyId)
          return (af?.ln || a.name).localeCompare(bf?.ln || b.name)
        }),
      }))

    return [
      { key: 'system', title: 'System Accounts', subtitle: `${systemAccounts.length} admin, program head, and registrar account${systemAccounts.length === 1 ? '' : 's'}`, items: systemAccounts },
      ...facultySections,
    ].filter(group => group.items.length > 0)
  }, [faculty, visible])

  const counts = {
    total: accounts.length,
    admins: accounts.filter(account => account.role === 'admin').length,
    heads: accounts.filter(account => account.role === 'program_head').length,
    faculty: accounts.filter(account => account.role === 'teacher').length,
    inactive: accounts.filter(account => account.status === 'inactive').length,
  }

  function saveUser(record) {
    if (record.id && accounts.some(account => account.id === record.id && account.role !== record.role)) {
      setConfirm({
        title: 'Change User Role',
        message: `Change ${record.name}'s role to ${ROLE_LABELS[record.role] || record.role}? This affects their access after the next login.`,
        variant: 'default',
        onConfirm: () => { setConfirm(null); _persistUser(record) },
      })
      return
    }
    _persistUser(record)
  }

  function _persistUser(record) {
    const savedRecord = { ...record, managedEdited: true }
    setUsers(prev => {
      const existing = prev.some(user => user.id === savedRecord.id || user.email?.toLowerCase() === savedRecord.email?.toLowerCase())
      return existing
        ? prev.map(user => (user.id === savedRecord.id || user.email?.toLowerCase() === savedRecord.email?.toLowerCase() ? savedRecord : user))
        : [...prev, savedRecord]
    })
    setEditing(null)
    setToast(`${record.name} saved.`)
    window.setTimeout(() => setToast(null), 2600)
  }

  function toggleStatus(account) {
    const nextStatus = account.status === 'inactive' ? 'active' : 'inactive'
    setConfirm({
      title: nextStatus === 'inactive' ? 'Deactivate Account' : 'Reactivate Account',
      message: `${nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate'} ${account.name}?`,
      variant: nextStatus === 'inactive' ? 'danger' : 'default',
      onConfirm: () => { setConfirm(null); _persistUser({ ...account, status: nextStatus }) },
    })
  }

  function resetPassword(account) {
    setConfirm({
      title: 'Reset Password',
      message: `Reset password for ${account.name} to the default password?`,
      variant: 'danger',
      onConfirm: () => { setConfirm(null); _persistUser({ ...account, password: account.seedPassword || 'password123' }) },
    })
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      {toast && (
        <div className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${dark ? 'border-emerald-700/30 bg-[#101F18] text-emerald-100' : 'border-emerald-200 bg-white text-emerald-900'}`}>
          {toast}
        </div>
      )}
      <div className={`overflow-hidden rounded-2xl border border-emerald-900/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <UserCog size={19} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Account Management</p>
            <p className="mt-0.5 text-xs text-emerald-100/70">Seed-based login accounts grouped for easier tracing</p>
          </div>
          <button type="button" onClick={() => setEditing(emptyUser())} className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-xs font-black text-white hover:bg-white/20">
            <Plus size={14} /> Add Account
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Accounts</p><p className={`mt-1 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{counts.total}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Admins</p><p className={`mt-1 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{counts.admins}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Faculty</p><p className={`mt-1 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{counts.faculty}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Inactive</p><p className="mt-1 text-2xl font-black text-red-700">{counts.inactive}</p></div>
        </div>

        <div className="border-t border-emerald-950/10 p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-emerald-950/35" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search accounts, email, role, faculty, or program" className={`w-full rounded-xl border border-emerald-950/15 ${dark ? 'bg-[#101F18]' : 'bg-white'} py-2 pl-9 pr-3 text-sm ${dark ? 'text-emerald-50' : 'text-emerald-950'} outline-none`} />
          </div>
        </div>
      </div>

      {groupedAccounts.length === 0 && (
        <div className={`rounded-2xl border border-emerald-900/10 ${dark ? 'bg-[#101F18] text-emerald-200/65' : 'bg-white text-emerald-950/55'} p-10 text-center shadow-sm`}>
          <UserCog size={30} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-black">No accounts match the current search.</p>
          <p className="mt-1 text-xs font-semibold">Try a different name, email, role, faculty, or program.</p>
        </div>
      )}

      {groupedAccounts.map(group => (
        <section key={group.key} className={`overflow-hidden rounded-2xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between gap-3 border-b border-emerald-950/10 px-4 py-3">
            <div>
              <h2 className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{group.title}</h2>
              <p className="mt-0.5 text-xs font-semibold text-emerald-950/45">{group.subtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_150px] gap-3 bg-emerald-950/[0.04] px-4 py-3 text-[11px] font-black uppercase text-emerald-950/45">
            <span>Account</span><span>Role</span><span>Program / Faculty</span><span>Status</span><span>Actions</span>
          </div>
          <div className="divide-y divide-emerald-950/10">
            {group.items.map(account => {
              const linkedFaculty = faculty.find(fac => fac.id === account.facultyId)
              return (
                <div key={account.id} className="grid grid-cols-[1.3fr_1fr_1fr_1fr_150px] items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className={`truncate font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{account.name}</p>
                    <p className="truncate text-xs font-semibold text-emerald-950/45">{account.email}</p>
                  </div>
                  <span className="font-bold text-emerald-950/70">{ROLE_LABELS[account.role] || account.role}</span>
                  <span className="text-xs font-semibold text-emerald-950/55">
                    {account.role === 'program_head'
                      ? (account.programs || []).map(programLabel).join(', ') || 'No scope'
                      : account.role === 'teacher'
                        ? linkedFaculty ? `${programLabel(linkedFaculty.prog)} - ${linkedFaculty.ln}, ${linkedFaculty.fn}` : 'No faculty link'
                        : 'System-wide'}
                  </span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${account.status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{account.status === 'inactive' ? 'Inactive' : 'Active'}</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setEditing(account)} className={`rounded-lg border border-emerald-950/15 p-2 text-emerald-800 hover:${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`} aria-label="Edit account"><Pencil size={14} /></button>
                    <button type="button" onClick={() => resetPassword(account)} className={`rounded-lg border border-emerald-950/15 p-2 text-emerald-800 hover:${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`} aria-label="Reset password"><KeyRound size={14} /></button>
                    <button type="button" onClick={() => toggleStatus(account)} className={`rounded-lg border border-emerald-950/15 p-2 text-emerald-800 hover:${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`} aria-label="Toggle status"><ShieldCheck size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {editing && <UserModal user={editing} faculty={faculty} onClose={() => setEditing(null)} onSave={saveUser} />}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        variant={confirm?.variant}
        confirmLabel="Confirm"
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
