import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

const ROLE_LABELS = {
  admin: 'Admin',
  program_head: 'Program Head',
  registrar: 'Registrar',
  teacher: 'Teacher',
}

const AY_OPTIONS = ['2024-2025', '2025-2026', '2026-2027']
const SEM_OPTIONS = [
  { value: '1st', label: '1st Semester' },
  { value: '2nd', label: '2nd Semester' },
  { value: 'Summer', label: 'Summer Class' },
]

export default function Topbar({ title }) {
  const { account, logout } = useAuth()
  const { term, setTerm, isTermFinalized } = useData()
  const canEditTerm = account.role === 'admin' || account.role === 'registrar'
  const finalized = isTermFinalized(term.ay, term.sem)

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div>
        <h1 className="text-base font-medium text-gray-900">{title}</h1>
        {finalized && <p className="text-xs text-green-700 mt-0.5">{term.ay} · {term.sem} semester is finalized</p>}
      </div>
      <div className="flex items-center gap-3">
        {canEditTerm ? (
          <>
            <select
              value={term.ay}
              onChange={(e) => setTerm((t) => ({ ...t, ay: e.target.value }))}
              className="text-xs rounded-lg border border-gray-300 px-2 py-1.5"
            >
              {AY_OPTIONS.map((ay) => (
                <option key={ay} value={ay}>AY {ay}</option>
              ))}
            </select>
            <select
              value={term.sem}
              onChange={(e) => setTerm((t) => ({ ...t, sem: e.target.value }))}
              className="text-xs rounded-lg border border-gray-300 px-2 py-1.5"
            >
              {SEM_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </>
        ) : (
          <span className="text-xs text-gray-500">AY {term.ay} · {SEM_OPTIONS.find((s) => s.value === term.sem)?.label}</span>
        )}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 leading-none">{account.name}</div>
            <div className="text-xs text-gray-500 leading-none mt-0.5">{ROLE_LABELS[account.role]}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}