import { useMemo, useState } from "react"
import { Link } from 'react-router-dom'
import { Users, ChevronRight, TrendingUp, AlertCircle, CalendarDays, History, ChevronDown } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

const GOLD = '#D9B44A'

function card(dark) {
  return `rounded-2xl border p-5 transition-all duration-200 ${
    dark ? 'bg-[#101F18] border-emerald-900/50 hover:border-emerald-700/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow'
  }`
}

function ProgressBar({ percent, dark, color = '#0F6B3C' }) {
  return (
    <div className={`h-2 rounded-full ${dark ? 'bg-white/8' : 'bg-gray-100'}`}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, percent)}%`, background: color }} />
    </div>
  )
}

const PROGRAM_PROGRESS_GROUPS = [
  {
    label: 'BTVTED',
    programs: [
      { code: 'BTVTED-CP', label: 'CP' },
      { code: 'BTVTED-HVACRT', label: 'HVACRT' },
    ],
  },
  { label: 'BECED', programs: [{ code: 'BECED', label: 'BECED' }] },
  { label: 'BSE', programs: [{ code: 'BSENTREP', label: 'BSE' }] },
]

function ProgressStat({ label, value, tone, dark }) {
  const styles = {
    neutral: dark ? 'bg-white/5 text-emerald-100' : 'bg-gray-50 text-gray-900',
    success: dark ? 'bg-emerald-900/20 border border-emerald-700/20 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700',
    warning: dark ? 'bg-amber-900/20 border border-amber-700/20 text-amber-300' : 'bg-amber-50 border border-amber-200 text-amber-700',
  }

  return (
    <div className={`rounded-lg p-3 ${styles[tone] || styles.neutral}`}>
      <p className={`text-xs ${dark ? 'text-current/70' : ''}`}>{label}</p>
      <p className="text-lg font-bold mt-1" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </div>
  )
}

function ProgramProgressCard({ group, data, dark }) {
  const groupTotals = group.programs.reduce((sum, program) => {
    const item = data.byProgram[program.code] || {}
    return {
      total: sum.total + (item.total || 0),
      completed: sum.completed + (item.completed || 0),
      pending: sum.pending + (item.pending || 0),
    }
  }, { total: 0, completed: 0, pending: 0 })
  const pct = groupTotals.total ? Math.round((groupTotals.completed / groupTotals.total) * 100) : 0

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-white/5 border border-emerald-900/30' : 'bg-white border border-gray-100 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-sm font-black ${dark ? 'text-white' : 'text-[#10241A]'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{group.label}</p>
          <p className={`text-[10px] mt-0.5 ${dark ? 'text-emerald-200/45' : 'text-gray-400'}`}>{groupTotals.completed}/{groupTotals.total} sections completed</p>
        </div>
        <span className={`text-xs font-black ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{pct}%</span>
      </div>
      <ProgressBar percent={pct} dark={dark} />
      <div className="mt-3 space-y-2">
        {group.programs.map(program => {
          const item = data.byProgram[program.code] || { total: 0, completed: 0, pending: 0, percentComplete: 0 }
          return (
            <div key={program.code}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${dark ? 'text-emerald-100/80' : 'text-gray-700'}`}>{program.label}</span>
                <span className={`text-[10px] font-bold ${dark ? 'text-emerald-200/65' : 'text-gray-500'}`}>{item.completed}/{item.total}</span>
              </div>
              <ProgressBar percent={item.percentComplete} dark={dark} color={program.code === 'BTVTED-HVACRT' ? '#0EA5E9' : '#0F6B3C'} />
              {item.pending > 0 && <p className="mt-1 text-[10px] font-semibold text-amber-500">{item.pending} section(s) in progress</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FacultyDistributionCard({ group, workload, facultyById, dark }) {
  const [activeStatus, setActiveStatus] = useState('underloaded')
  const facultyIds = new Set()
  group.programs.forEach(program => {
    workload.forEach(item => {
      const faculty = facultyById[item.facultyId]
      const programs = [faculty?.prog, ...(faculty?.shared || [])]
      if (programs.includes(program.code)) facultyIds.add(item.facultyId)
    })
  })

  const rows = workload.filter(item => facultyIds.has(item.facultyId))
  const total = rows.length
  const categories = [
    { key: 'balanced', status: 'balanced', label: 'Balanced', color: '#10B981' },
    { key: 'underloaded', status: 'underloaded', label: 'Underloaded', color: '#3B82F6' },
    { key: 'nearCapacity', status: 'near-capacity', label: 'Near Max', color: '#F59E0B' },
    { key: 'overloaded', status: 'overloaded', label: 'Overloaded', color: '#EF4444' },
  ]
  const counts = {
    balanced: rows.filter(item => item.status === 'balanced').length,
    underloaded: rows.filter(item => item.status === 'underloaded').length,
    nearCapacity: rows.filter(item => item.status === 'near-capacity').length,
    overloaded: rows.filter(item => item.status === 'overloaded').length,
  }
  const activeCategory = categories.find(item => item.status === activeStatus) || categories[0]
  const selectedRows = rows
    .filter(item => item.status === activeCategory.status)
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name))

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-white/5 border border-emerald-900/30' : 'bg-white border border-gray-100 shadow-sm'}`}>
      <div className="mb-3">
        <p className={`text-sm font-black ${dark ? 'text-white' : 'text-[#10241A]'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{group.label}</p>
        <p className={`text-[10px] mt-0.5 ${dark ? 'text-emerald-200/45' : 'text-gray-400'}`}>{total} faculty members</p>
      </div>
      <div className="space-y-2.5">
        {categories.map(item => {
          const count = counts[item.key] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          const isActive = activeCategory.key === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveStatus(item.status)}
              className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                isActive
                  ? dark ? 'bg-white/8' : 'bg-gray-50'
                  : dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${dark ? 'text-emerald-100/80' : 'text-gray-700'}`}>{item.label}</span>
                <span className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold ${dark ? 'text-emerald-200/65' : 'text-gray-500'}`}>{count}</span>
                  <ChevronDown size={12} className={`transition-transform ${isActive ? 'rotate-180' : ''} ${dark ? 'text-emerald-200/45' : 'text-gray-400'}`} />
                </span>
              </div>
              <ProgressBar percent={pct} dark={dark} color={item.color} />
            </button>
          )
        })}
      </div>
      <div className={`mt-4 rounded-lg border ${dark ? 'border-emerald-900/30 bg-[#0a1410]/45' : 'border-gray-100 bg-gray-50/70'}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
          <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-[#10241A]'}`}>{activeCategory.label}</p>
          <p className={`text-[10px] font-semibold ${dark ? 'text-emerald-200/55' : 'text-gray-500'}`}>{selectedRows.length} faculty</p>
        </div>
        <div className="max-h-52 overflow-y-auto p-2 space-y-1.5">
          {selectedRows.length === 0 ? (
            <p className={`px-2 py-3 text-center text-xs ${dark ? 'text-emerald-200/45' : 'text-gray-400'}`}>No faculty in this status.</p>
          ) : selectedRows.map(item => {
            const faculty = facultyById[item.facultyId]
            return (
              <div key={item.facultyId} className={`rounded-md px-2.5 py-2 ${dark ? 'bg-white/5' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-bold ${dark ? 'text-emerald-50' : 'text-gray-800'}`}>{item.name}</p>
                    <p className={`mt-0.5 truncate text-[10px] ${dark ? 'text-emerald-200/45' : 'text-gray-500'}`}>{faculty?.spec || 'No specialization listed'}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black" style={{ color: activeCategory.color }}>{item.units}/{item.max}</span>
                </div>
                <div className={`mt-1.5 h-1 rounded-full ${dark ? 'bg-white/8' : 'bg-gray-100'}`}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.percent)}%`, backgroundColor: activeCategory.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AlertDetails({ alert, pendingByProgram, rejectedByProgram, facultyById, dark }) {
  if (alert.type === 'pending-approvals') {
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {pendingByProgram.map(item => (
          <div key={item.code} className={`rounded-lg px-3 py-2 ${dark ? 'bg-white/6' : 'bg-white/70'}`}>
            <p className={`text-xs font-bold ${dark ? 'text-emerald-50' : 'text-gray-800'}`}>{item.label}</p>
            <p className={`mt-0.5 text-[10px] font-semibold ${dark ? 'text-amber-200/80' : 'text-amber-700'}`}>
              {item.count} assignment{item.count === 1 ? '' : 's'} pending review
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (alert.type === 'rejected-assignments') {
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {rejectedByProgram.map(item => (
          <div key={item.code} className={`rounded-lg px-3 py-2 ${dark ? 'bg-white/6' : 'bg-white/70'}`}>
            <p className={`text-xs font-bold ${dark ? 'text-emerald-50' : 'text-gray-800'}`}>{item.label}</p>
            <p className={`mt-0.5 text-[10px] font-semibold ${dark ? 'text-red-200/80' : 'text-red-700'}`}>
              {item.count} rejected load{item.count === 1 ? '' : 's'} need replacement
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (alert.type === 'faculty-profile-updates') {
    return (
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {(alert.updates || []).map(item => (
          <div key={item.id} className={`rounded-lg px-3 py-2 ${dark ? 'bg-white/6' : 'bg-white/70'}`}>
            <p className={`text-xs font-bold ${dark ? 'text-emerald-50' : 'text-gray-800'}`}>{item.details}</p>
            <p className={`mt-0.5 text-[10px] font-semibold ${dark ? 'text-amber-200/80' : 'text-amber-700'}`}>
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const facultyRows = alert.type === 'near-capacity' ? alert.near_capacity || [] : alert.overloaded || []
  const byProgram = facultyRows.reduce((map, item) => {
    const faculty = facultyById[item.facultyId]
    const programs = [faculty?.prog, ...(faculty?.shared || [])].filter(Boolean)
    const code = programs[0] || 'UNASSIGNED'
    if (!map[code]) map[code] = []
    map[code].push({ ...item, faculty })
    return map
  }, {})
  const rows = Object.entries(byProgram)

  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {rows.map(([code, items]) => (
        <div key={code} className={`rounded-lg px-3 py-2 ${dark ? 'bg-white/6' : 'bg-white/70'}`}>
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs font-bold ${dark ? 'text-emerald-50' : 'text-gray-800'}`}>{programLabel(code)}</p>
            <p className={`text-[10px] font-black ${alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>{items.length}</p>
          </div>
          <div className="mt-2 space-y-1.5">
            {items.slice(0, 4).map(item => (
              <div key={item.facultyId} className="flex items-center justify-between gap-2">
                <p className={`truncate text-[11px] ${dark ? 'text-emerald-100/80' : 'text-gray-600'}`}>{item.name}</p>
                <p className={`shrink-0 text-[10px] font-bold ${alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>{item.units}/{item.max}</p>
              </div>
            ))}
            {items.length > 4 && (
              <p className={`text-[10px] ${dark ? 'text-emerald-200/45' : 'text-gray-400'}`}>+{items.length - 4} more</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const [expandedAlerts, setExpandedAlerts] = useState({})
  const { 
    term, faculty, subjects, termAssignments, registrarSummary, isTermFinalized, subjectsById, facultyById,
    getCriticalAlerts, getAssignmentProgress, getFacultyWorkload, getRecentActivity
  } = useData()

  const ta = useMemo(() => termAssignments(term.ay, term.sem), [term, termAssignments])
  const pending  = ta.filter(a => a.status === 'pending').length
  const approved = ta.filter(a => a.status === 'approved').length
  const progress = useMemo(() => getAssignmentProgress(term.ay, term.sem), [term, getAssignmentProgress])
  const alerts = useMemo(() => getCriticalAlerts(term.ay, term.sem), [term, getCriticalAlerts])
  const workload = useMemo(() => getFacultyWorkload(term.ay, term.sem), [term, getFacultyWorkload])
  const recentActivity = useMemo(() => getRecentActivity(10), [getRecentActivity])
  
  const summary  = registrarSummary(term.ay, term.sem)
  const finalized = isTermFinalized(term.ay, term.sem)
  const recent = [...ta].reverse().slice(0, 6)
  const pendingByProgram = useMemo(() => {
    return PROGRAMS
      .map(program => ({
        code: program.code,
        label: program.label,
        count: ta.filter(a => a.status === 'pending' && subjectsById[a.subjectId]?.prog === program.code).length,
      }))
      .filter(item => item.count > 0)
  }, [ta, subjectsById])
  const rejectedByProgram = useMemo(() => {
    return PROGRAMS
      .map(program => ({
        code: program.code,
        label: program.label,
        count: ta.filter(a => a.status === 'rejected' && subjectsById[a.subjectId]?.prog === program.code).length,
      }))
      .filter(item => item.count > 0)
  }, [ta, subjectsById])
  const assignmentProgress = useMemo(() => {
    const sections = getSections()
    const byProgram = Object.fromEntries(PROGRAMS.map(program => [program.code, {
      total: 0,
      completed: 0,
      pending: 0,
      assigned: 0,
      rejected: 0,
      percentComplete: 0,
    }]))

    for (const section of sections) {
      const requiredSubjects = subjects.filter(subject => subject.prog === section.prog && subject.yr === section.yr && subject.sem === term.sem)
      const bucket = byProgram[section.prog]
      if (!bucket || requiredSubjects.length === 0) continue

      const sectionKey = `${section.prog} ${section.yr}${section.lbl}`
      const subjectStates = requiredSubjects.map(subject => {
        const relevant = ta.filter(a => a.section === sectionKey && a.subjectId === subject.id && a.status !== 'withdrawn')
        const active = relevant.find(a => a.status === 'approved' || a.status === 'pending')
        return {
          active,
          rejected: !active && relevant.some(a => a.status === 'rejected'),
        }
      })
      const isCompleted = subjectStates.every(item => item.active?.status === 'approved')
      const hasMovement = subjectStates.some(item => item.active || item.rejected)
      const hasRejected = subjectStates.some(item => item.rejected)

      bucket.total += 1
      if (isCompleted) bucket.completed += 1
      else if (hasMovement) bucket.pending += 1
      if (hasMovement) bucket.assigned += 1
      if (hasRejected) bucket.rejected += 1
    }

    const overall = Object.values(byProgram).reduce((sum, item) => ({
      total: sum.total + item.total,
      completed: sum.completed + item.completed,
      pending: sum.pending + item.pending,
      assigned: sum.assigned + item.assigned,
      rejected: sum.rejected + item.rejected,
    }), { total: 0, completed: 0, pending: 0, assigned: 0, rejected: 0 })

    for (const item of Object.values(byProgram)) {
      item.percentComplete = item.total ? Math.round((item.completed / item.total) * 100) : 0
    }
    overall.percentComplete = overall.total ? Math.round((overall.completed / overall.total) * 100) : 0

    return { overall, byProgram }
  }, [subjects, ta, term.sem])

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  const toggleAlert = (key) => {
    setExpandedAlerts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={`space-y-5 ${dark ? 'bg-[#0a1410]' : 'bg-gradient-to-br from-emerald-50/40 to-blue-50/40'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">

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
              <p className="text-2xl font-extrabold text-white leading-none" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{progress.percentComplete}%</p>
              <p className="text-[10px] text-emerald-200/70 mt-0.5">Complete</p>
            </div>
            <div className="rounded-xl px-4 py-2 text-center bg-white/10">
              <p className="text-2xl font-extrabold text-white leading-none" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{faculty.length}</p>
              <p className="text-[10px] text-emerald-200/70 mt-0.5">Faculty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => {
            const isExpanded = !!expandedAlerts[`${alert.type}-${idx}`]
            return (
            <div key={idx} className={`rounded-2xl border px-5 py-3.5 ${
              alert.severity === 'high'
                ? dark ? 'bg-red-900/20 border-red-700/40' : 'bg-red-50 border-red-200'
                : dark ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className={alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'} shrink-0 />
                  <div>
                    <p className={`text-sm font-bold ${
                      alert.severity === 'high'
                        ? dark ? 'text-red-300' : 'text-red-800'
                        : dark ? 'text-amber-300' : 'text-amber-800'
                    }`}>
                      {alert.message}
                    </p>
                    {isExpanded && (
                      <p className={`mt-0.5 text-[11px] ${dark ? 'text-emerald-100/50' : 'text-gray-500'}`}>
                        Program breakdown is shown below.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleAlert(`${alert.type}-${idx}`)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    alert.severity === 'high'
                      ? dark ? 'border-red-700/40 text-red-200 hover:bg-red-900/30' : 'border-red-200 text-red-700 hover:bg-red-100/60'
                      : dark ? 'border-amber-700/40 text-amber-200 hover:bg-amber-900/30' : 'border-amber-200 text-amber-700 hover:bg-amber-100/60'
                  }`}
                >
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>
                {alert.type === 'pending-approvals' && (
                  <Link to="/admin/approvals" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0">
                    Review <ChevronRight size={12} />
                  </Link>
                )}
                {alert.type === 'rejected-assignments' && (
                  <Link to="/admin/loads" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0">
                    Reassign <ChevronRight size={12} />
                  </Link>
                )}
                </div>
              </div>
              {isExpanded && (
                <AlertDetails alert={alert} pendingByProgram={pendingByProgram} rejectedByProgram={rejectedByProgram} facultyById={facultyById} dark={dark} />
              )}
            </div>
            )
          })}
        </div>
      )}

      {/* Term Progress & Load Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Academic Term Overview */}
        <div className={`md:col-span-2 ${card(dark)}`}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
                style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Load Assignment Progress</h3>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className={`text-xs ${dark ? 'text-emerald-200/50' : 'text-gray-500'}`}>
              AY {term.ay} · {term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} Semester
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${dark ? 'text-emerald-100' : 'text-gray-700'}`}>Overall Progress</span>
                <span className={`text-xs font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}
                  style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{assignmentProgress.overall.percentComplete}%</span>
              </div>
              <ProgressBar percent={assignmentProgress.overall.percentComplete} dark={dark} />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <ProgressStat label="Total Sections" value={assignmentProgress.overall.total} tone="neutral" dark={dark} />
              <ProgressStat label="Completed Sections" value={assignmentProgress.overall.completed} tone="success" dark={dark} />
              <ProgressStat label="Sections In Progress" value={assignmentProgress.overall.pending} tone="warning" dark={dark} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 pt-1">
              {PROGRAM_PROGRESS_GROUPS.map(group => (
                <ProgramProgressCard key={group.label} group={group} data={assignmentProgress} dark={dark} />
              ))}
            </div>
          </div>
        </div>

        {/* Faculty Load Distribution */}
        <div className={`md:col-span-2 ${card(dark)}`}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
                style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Faculty Load Distribution</h3>
              <Users size={16} className="text-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            {PROGRAM_PROGRESS_GROUPS.map(group => (
              <FacultyDistributionCard
                key={group.label}
                group={group}
                workload={workload}
                facultyById={facultyById}
                dark={dark}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent assignments */}
      <div className={card(dark)}>
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

      {/* Activity Timeline */}
      <div className={card(dark)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
            style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Recent Activity</h3>
          <History size={14} className="text-emerald-500" />
        </div>
        
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => {
              const timestamp = new Date(activity.timestamp)
              const now = new Date()
              const diffMs = now - timestamp
              const diffMins = Math.floor(diffMs / 60000)
              const diffHours = Math.floor(diffMs / 3600000)
              const diffDays = Math.floor(diffMs / 86400000)
              
              let timeAgo
              if (diffMins < 1) timeAgo = 'Just now'
              else if (diffMins < 60) timeAgo = `${diffMins}m ago`
              else if (diffHours < 24) timeAgo = `${diffHours}h ago`
              else if (diffDays < 7) timeAgo = `${diffDays}d ago`
              else timeAgo = timestamp.toLocaleDateString()

              // Get action color and description
              const getActionColor = (action) => {
                const map = {
                  'assignment_created': 'emerald',
                  'assignment_approved': 'green',
                  'assignment_rejected': 'red',
                  'assignment_updated': 'blue',
                  'faculty_reassigned': 'indigo',
                  'faculty_profile_updated': 'blue',
                  'admin_action': 'amber'
                }
                return map[action] || 'gray'
              }

              const getActionLabel = (action) => {
                const map = {
                  'assignment_created': 'Assignment Created',
                  'assignment_approved': 'Assignment Approved',
                  'assignment_rejected': 'Assignment Rejected',
                  'assignment_updated': 'Assignment Updated',
                  'faculty_reassigned': 'Faculty Reassigned',
                  'faculty_profile_updated': 'Faculty Profile Updated',
                  'admin_action': 'Admin Action'
                }
                return map[action] || action
              }

              const color = getActionColor(activity.action)
              const colorMap = {
                emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                green: 'bg-green-100 text-green-700 border-green-200',
                red: 'bg-red-100 text-red-700 border-red-200',
                blue: 'bg-blue-100 text-blue-700 border-blue-200',
                indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                amber: 'bg-amber-100 text-amber-700 border-amber-200',
                gray: 'bg-gray-100 text-gray-700 border-gray-200'
              }
              const colorClass = dark 
                ? `bg-white/5 text-emerald-300 border-emerald-900/20` 
                : colorMap[color]

              return (
                <div key={idx} className={`flex items-start gap-3 pb-3 border-b ${dark ? 'border-emerald-900/30' : 'border-gray-100'} last:border-0 last:pb-0`}>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${colorClass} border`}>
                    {getActionLabel(activity.action).split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>
                      {activity.details}
                    </p>
                    <p className={`text-xs mt-0.5 ${dark ? 'text-emerald-200/50' : 'text-gray-500'}`}>
                      {timeAgo}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={`flex items-center justify-center py-6 ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

