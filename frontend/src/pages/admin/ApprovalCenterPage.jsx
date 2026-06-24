import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, Filter, RefreshCw, TrendingUp, X, AlertCircle, ChevronRight, FileText } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { PROGRAMS } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

const GOLD = '#D9B44A'
const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'

function card(dark) {
  return `rounded-2xl border p-5 transition-all duration-200 ${
    dark ? 'bg-[#101F18] border-emerald-900/50 hover:border-emerald-700/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow'
  }`
}

function groupByProgramAndSection(items) {
  const grouped = items.reduce((programs, item) => {
    const programCode = item.programCode || 'UNASSIGNED'
    const section = item.section || 'Unsectioned'

    if (!programs[programCode]) {
      programs[programCode] = {
        code: programCode,
        label: item.program || programCode,
        count: 0,
        sections: {},
      }
    }

    if (!programs[programCode].sections[section]) {
      programs[programCode].sections[section] = []
    }

    programs[programCode].count += 1
    programs[programCode].sections[section].push(item)
    return programs
  }, {})

  return Object.values(grouped)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(program => ({
      ...program,
      sectionEntries: Object.entries(program.sections).sort(([a], [b]) => a.localeCompare(b)),
    }))
}

function ApprovalSection({ title, icon: Icon, items, status, dark, onActionClick }) {
  if (items.length === 0) {
    return (
      <div className={card(dark)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
            style={{ backgroundColor: status === 'pending' ? 'rgba(217,180,74,0.15)' : status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(220,38,38,0.15)' }}>
            <Icon size={18} className={status === 'pending' ? 'text-amber-600' : status === 'approved' ? 'text-emerald-600' : 'text-red-600'} />
          </div>
          <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
            style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <CheckCircle2 size={32} className={dark ? 'text-emerald-900' : 'text-gray-200'} />
          <p className={`text-sm ${dark ? 'text-emerald-200/40' : 'text-gray-400'}`}>All caught up!</p>
        </div>
      </div>
    )
  }

  const groupedItems = groupByProgramAndSection(items)

  return (
    <div className={card(dark)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
            style={{ backgroundColor: status === 'pending' ? 'rgba(217,180,74,0.15)' : status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(220,38,38,0.15)' }}>
            <Icon size={18} className={status === 'pending' ? 'text-amber-600' : status === 'approved' ? 'text-emerald-600' : 'text-red-600'} />
          </div>
          <div>
            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
              style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{title}</h3>
            <p className={`text-xs ${dark ? 'text-emerald-200/50' : 'text-gray-500'}`}>{items.length} items</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
          status === 'pending' ? 'bg-amber-100 text-amber-700' : status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>{items.length}</span>
      </div>

      <div className="space-y-3 max-h-[34rem] overflow-y-auto">
        {groupedItems.map(program => (
          <div key={program.code} className={`rounded-xl border overflow-hidden ${
            dark ? 'border-emerald-900/30 bg-white/4' : 'border-gray-100 bg-gray-50/70'
          }`}>
            <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${
              dark ? 'border-emerald-900/30 bg-white/4' : 'border-gray-100 bg-white/80'
            }`}>
              <div className="min-w-0">
                <p className={`text-sm font-black truncate ${dark ? 'text-white' : 'text-[#10241A]'}`}
                  style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{program.label}</p>
                <p className={`text-[10px] mt-0.5 ${dark ? 'text-emerald-200/45' : 'text-gray-500'}`}>
                  {program.sectionEntries.length} section{program.sectionEntries.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${
                status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>{program.count}</span>
            </div>

            <div className="p-3 space-y-3">
              {program.sectionEntries.map(([section, sectionItems]) => (
                <div key={section} className={`rounded-lg border ${
                  dark ? 'border-white/10 bg-[#0a1410]/35' : 'border-gray-100 bg-white'
                }`}>
                  <div className={`flex items-center justify-between gap-3 px-3 py-2 border-b ${
                    dark ? 'border-white/10' : 'border-gray-100'
                  }`}>
                    <p className={`text-xs font-black ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{section}</p>
                    <p className={`text-[10px] font-bold ${dark ? 'text-emerald-200/55' : 'text-gray-500'}`}>
                      {sectionItems.length} assignment{sectionItems.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {sectionItems.map(item => (
                      <div key={item.id} className={`p-3 transition-colors ${
                        dark ? 'divide-emerald-900/30 hover:bg-white/5' : 'hover:bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>
                              {item.subjectCode} - {item.subjectTitle}
                            </p>
                            <p className={`text-xs mt-1.5 ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>
                              {item.facultyName}
                            </p>
                            {item.comment && (
                              <p className={`text-xs mt-2 p-2 rounded ${dark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
                                {item.comment}
                              </p>
                            )}
                            <p className={`text-[10px] mt-2 ${dark ? 'text-emerald-200/40' : 'text-gray-400'}`}>
                              {item.date}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => onActionClick(item, status)}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                  : status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {status === 'pending' ? 'Review' : 'View'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ApprovalCenterPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const { term, termAssignments, subjectsById, facultyById, isTermFinalized } = useData()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState('all')

  const ta = useMemo(() => termAssignments(term.ay, term.sem), [term, termAssignments])
  const finalized = isTermFinalized(term.ay, term.sem)

  // Organize assignments by status
  const pending = useMemo(() => ta.filter(a => a.status === 'pending').map(a => {
    const subj = subjectsById[a.subjectId]
    const fac = facultyById[a.facultyId]
    const prog = PROGRAMS.find(p => p.code === subj?.prog)
    return {
      id: a.id,
      assignmentId: a.id,
      status: 'pending',
      program: prog?.label || subj?.prog,
      programCode: subj?.prog,
      subjectCode: subj?.code,
      subjectTitle: subj?.title,
      section: a.section,
      facultyName: Memo(() => ta.filter(a => a.status === 'approved').map(a => {
    const subj = subjectsById[a.subjectId]
    const fac = facultyById[a.facultyId]
    const prog = PROGRAMS.find(p => p.code === subj?.prog)
    return {
      id: a.id,
      assignmentId: a.id,
      status: 'approved',
      program: prog?.label || subj?.prog,
      programCode: subj?.prog,
      subjectCode: subj?.code,
      subjectTitle: subj?.title,
      section: a.section,
      facultyName: `${fac?.fn} ${fac?.ln}`,
      date: new Date(a.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
  }), [ta, subjectsById, facultyById])

  const rejected = useMemo(() => ta.filter(a => a.status === 'rejected').map(a => {
    const subj = subjectsById[a.subjectId]
    const fac = facultyById[a.facultyId]
    const prog = PROGRAMS.find(p => p.code === subj?.prog)
    return {
      id: a.id,
      assignmentId: a.id,
      status: 'rejected',
      program: prog?.label || subj?.prog,
      programCode: subj?.prog,
      subjectCode: subj?.code,
      subjectTitle: subj?.title,
      section: a.section,
      facultyName: `${fac?.fn} ${fac?.ln}`,
      comment: a.comment,
      date: new Date(a.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
  }), [ta, subjectsById, facultyById])

  const stats = useMemo(() => ({
    total: ta.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
  }), [ta, pending, approved, rejected])

  // Extract unique programs with counts
  const programs = useMemo(() => {
    const allItems = [...pending, ...approved, ...rejected]
    const programMap = {}
    
    allItems.forEach(item => {
      const code = item.programCode || 'UNASSIGNED'
      if (!programMap[code]) {
        programMap[code] = {
          code,
          label: item.program || code,
          count: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      }
      programMap[code].count += 1
      if (item.status === 'pending') programMap[code].pending += 1
      if (item.status === 'approved') programMap[code].approved += 1
      if (item.status === 'rejected') programMap[code].rejected += 1
    })

    return [
      { code: 'all', label: 'All Programs', count: allItems.length, pending: pending.length, approved: approved.length, rejected: rejected.length },
      ...Object.values(programMap).sort((a, b) => a.label.localeCompare(b.label)),
    ]
  }, [pending, approved, rejected])

  // Filter sections based on selected program
  const filteredPending = useMemo(() => 
    selectedProgram === 'all' ? pending : pending.filter(p => p.programCode === selectedProgram),
    [pending, selectedProgram]
  )
  
  const filteredApproved = useMemo(() => 
    selectedProgram === 'all' ? approved : approved.filter(a => a.programCode === selectedProgram),
    [approved, selectedProgram]
  )
  
  const filteredRejected = useMemo(() => 
    selectedProgram === 'all' ? rejected : rejected.filter(r => r.programCode === selectedProgram),
    [rejected, selectedProgram]
  )

  const handleAction = (item, status) => {
    setSelectedItem({ ...item, currentStatus: status })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(115deg,#033826 0%,#0F6B3C 60%,#1FA84F 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '16px 16px' }} />
        <div className="relative z-10 px-6 py-5">
          <h1 className="text-white font-extrabold text-3xl leading-tight"
            style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
            Approval Center
          </h1>
          <p className="text-emerald-100/70 text-sm mt-2">
            Manage all load assignment approvals for AY {term.ay}, {term.sem} semester
            {finalized && <span className="ml-2 font-semibold text-emerald-300">· Finalized</span>}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: FOREST, icon: FileText },
          { label: 'Waiting Review', value: stats.pending, color: GOLD, icon: Clock },
          { label: 'Approved', value: stats.approved, color: '#10B981', icon: CheckCircle2 },
          { label: 'Rejected', value: stats.rejected, color: '#EF4444', icon: AlertCircle },
        ].map((stat, idx) => (
          <div key={idx} className={card(dark) + ' flex items-center gap-3'}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: stat.color + '1A', border: `1.5px solid ${stat.color}33` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div className="min-w-0">
              <p className={`text-2xl font-extrabold leading-none ${dark ? 'text-white' : 'text-[#10241A]'}`}
                style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{stat.value}</p>
              <p className={`text-xs font-semibold mt-1 ${dark ? 'text-emerald-200/70' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Program Tabs */}
      <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-[#101F18] border-emerald-900/50' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className={`flex overflow-x-auto border-b ${dark ? 'border-emerald-900/50' : 'border-gray-100'}`}>
          {programs.map(prog => (
            <button
              key={prog.code}
              onClick={() => setSelectedProgram(prog.code)}
              className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                selectedProgram === prog.code
                  ? `border-b-2 ${dark ? 'text-emerald-300 border-emerald-500 bg-white/5' : 'text-emerald-700 border-emerald-500 bg-emerald-50/30'}`
                  : `border-b-2 border-transparent ${dark ? 'text-emerald-200/60 hover:text-emerald-200 hover:bg-white/3' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'}`
              }`}
            >
              <span>{prog.label}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                selectedProgram === prog.code
                  ? `${dark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`
                  : `${dark ? 'bg-emerald-900/20 text-emerald-200/70' : 'bg-gray-100 text-gray-600'}`
              }`}>{prog.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Approval Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Waiting Review */}
        <ApprovalSection
          title="Waiting for Review"
          icon={Clock}
          items={filteredPending}
          status="pending"
          dark={dark}
          onActionClick={handleAction}
        />

        {/* Approved */}
        <ApprovalSection
          title="Approved"
          icon={CheckCircle2}
          items={filteredApproved}
          status="approved"
          dark={dark}
          onActionClick={handleAction}
        />

        {/* Rejected - Full Width */}
      </div>

      {filteredRejected.length > 0 && (
        <ApprovalSection
          title="Rejected (Needs Replacement)"
          icon={AlertCircle}
          items={filteredRejected}
          status="rejected"
          dark={dark}
          onActionClick={handleAction}
        />
      )}

      {/* Info Box */}
      {filteredPending.length + filteredApproved.length + filteredRejected.length === 0 && (
        <div className={card(dark)}>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <TrendingUp size={40} className={dark ? 'text-emerald-900' : 'text-gray-300'} />
            <p className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>No assignments in this program</p>
            <p className={`text-sm ${dark ? 'text-emerald-200/50' : 'text-gray-600'}`}>
              {selectedProgram === 'all' ? 'Create load assignments from the Load Assignment page to see them here.' : 'Switch to another program or create assignments.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
