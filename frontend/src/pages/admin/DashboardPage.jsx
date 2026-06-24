import { useMemo } from "react"
import { Link } from 'react-router-dom'
import { Users, BookOpen, Clock, CheckCircle2, ChevronRight, TrendingUp, AlertCircle, CalendarDays } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { PROGRAMS } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

const GOLD = '#D9B44A'

function card(dark) {
  return `rounded-2xl border p-5 transition-all duration-200 ${
    dark ? 'bg-[#101F18] border-emerald-900/50 hover:border-emerald-700/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow'
  }`
}

function StatCard({ icon: Icon, label, value, sub, accent, dark }) {
  return (
    <div className={`${card(dark)} flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent + '1A', border: `1.5px solid ${accent}33` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-extrabold leading-none ${dark ? 'text-white' : 'text-[#10241A]'}`}
          style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
        <p className={`text-xs font-semibold mt-1 ${dark ? 'text-emerald-200/70' : 'text-gray-600'}`}>{label}</p>
        {sub && <p className={`text-[10px] mt-0.5 ${dark ? 'text-emerald-200/40' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const { term, faculty, termAssignments, registrarSummary, isTermFinalized, subjectsById, facultyById } = useData()

  const ta = useMemo(() => termAssignments(term.ay, term.sem), [term, termAssignments])
  const pending  = ta.filter(a => a.status === 'pending').length
  const approved = ta.filter(a => a.status === 'approved').length
  
  const summary  = registrarSummary(term.ay, term.sem)
  const finalized = isTermFinalized(term.ay, term.sem)
  const recent = [...ta].reverse().slice(0, 6)

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Welcome banner */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(115deg,#033826 0%,#0F6B3C 60%,#1FA84F 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '16px 16px' }} />
        <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-emerald-200/70 text-sm">{greeting()},</p>
            <h2 className="text-white font-extrabold text-xl leading-tight mt-0.5"
              style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {account?.name} <span style={{ color: GOLD }}>👋</span>
            </h2>
            <p className="text-emerald-100/70 text-xs mt-1">
              AY {term.ay} · {term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} Semester
              {finalized && <span className="ml-2 font-semibold text-emerald-300">· Finalized</span>}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {pending > 0 && (
              <div className="rounded-xl px-4 py-2 text-center" style={{ backgroundColor: 'rgba(217,180,74,0.15)', border: `1px solid ${GOLD}40` }}>
                <p className="text-2xl font-extrabold leading-none" style={{ color: GOLD, fontFamily: "'EB Garamond',Georgia,serif" }}>{pending}</p>
                <p className="text-[10px] mt-0.5" style={{ color: GOLD + 'CC' }}>Pending</p>
              </div>
            )}
            <div className="rounded-xl px-4 py-2 text-center bg-white/10">
              <p className="text-2xl font-extrabold text-white leading-none" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{approved}</p>
              <p className="text-[10px] text-emerald-200/70 mt-0.5">Approved</p>
            </div>
            <div className="rounded-xl px-4 py-2 text-center bg-white/10">
              <p className="text-2xl font-extrabold text-white leading-none" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{faculty.length}</p>
              <p className="text-[10px] text-emerald-200/70 mt-0.5">Faculty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert if pending > 0 */}
      {pending > 0 && (
        <div className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-3.5 ${
          dark ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className={`text-sm font-medium ${dark ? 'text-amber-300' : 'text-amber-800'}`}>
              {pending} load assignment{pending > 1 ? 's are' : ' is'} waiting for Program Head approval.
            </p>
          </div>
          <Link to="/admin/loads" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 shrink-0">
            View <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard dark={dark} icon={Users}       label="Total Faculty"  value={faculty.length}   sub="Registered teachers"  accent="#0F6B3C" />
        <StatCard dark={dark} icon={BookOpen}    label="Subjects"       value={ta.length}        sub={`This ${term.sem} term`} accent={GOLD}  />
        <StatCard dark={dark} icon={Clock}       label="Pending Review" value={pending}           sub="Awaiting heads"       accent="#F59E0B" />
        <StatCard dark={dark} icon={CheckCircle2}label="Approved"       value={approved}          sub="Ready to schedule"    accent="#10B981" />
      </div>

      {/* Program overview + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Program breakdown */}
        <div className={`lg:col-span-2 ${card(dark)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
              style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Program Status</h3>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <div className="space-y-3">
            {PROGRAMS.map(p => {
              const s = summary[p.code] || {}
              const total = (s.pending || 0) + (s.approved || 0) + (s.rejected || 0)
              const pct = total ? Math.round(((s.approved || 0) / total) * 100) : 0
              return (
                <div key={p.code}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-semibold truncate ${dark ? 'text-emerald-100' : 'text-gray-700'}`}>{p.label}</p>
                    <p className={`text-[10px] shrink-0 ml-2 ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>{s.approved || 0}/{total} approved</p>
                  </div>
                  <div className={`h-1.5 rounded-full ${dark ? 'bg-white/8' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0F6B3C,#1FA84F)' }} />
                  </div>
                  <div className="flex gap-3 mt-1">
                    {s.pending > 0 && <span className="text-[9px] text-amber-500">{s.pending} pending</span>}
                    {s.rejected > 0 && <span className="text-[9px] text-red-500">{s.rejected} rejected</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent assignments */}
        <div className={`lg:col-span-3 ${card(dark)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
              style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Recent Assignments</h3>
            <Link to="/admin/loads" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CalendarDays size={28} className={dark ? 'text-emerald-800' : 'text-gray-300'} />
              <p className={`text-sm ${dark ? 'text-emerald-200/40' : 'text-gray-400'}`}>No assignments yet this term.</p>
              <Link to="/admin/loads" className="text-xs font-semibold text-emerald-600 hover:underline mt-1">Assign the first subject →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(a => {
                const subj = subjectsById[a.subjectId]
                const fac  = facultyById[a.facultyId]
                return (
                  <div key={a.id} className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-colors ${dark ? 'hover:bg-white/4' : 'hover:bg-gray-50'}`}>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${dark ? 'text-white' : 'text-gray-800'}`}>{subj?.code} — {subj?.title}</p>
                      <p className={`text-[10px] mt-0.5 truncate ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>{a.section} · {fac?.ln}, {fac?.fn}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
