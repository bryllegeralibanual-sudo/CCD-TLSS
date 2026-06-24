import { useState, useMemo } from 'react'
import { Download, FileText, BarChart3, Users, CheckCircle2, Calendar, ChevronRight } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { PROGRAMS } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function card(dark) {
  return `rounded-2xl border p-5 transition-all duration-200 ${
    dark ? 'bg-[#101F18] border-emerald-900/50 hover:border-emerald-700/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow'
  }`
}

function ReportCard({ icon: Icon, title, description, onClick, dark }) {
  return (
    <button
      onClick={onClick}
      className={`${card(dark)} w-full text-left hover:scale-[1.02] transform transition-transform duration-200 cursor-pointer`}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: GOLD + '1A', border: `1.5px solid ${GOLD}33` }}
        >
          <Icon size={20} style={{ color: GOLD }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}>{title}</h3>
          <p className={`text-xs mt-1 ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>{description}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-500 text-xs font-semibold">
            Generate <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </button>
  )
}

function FacultyLoadReport({ term, dark, faculty, termAssignments, subjectsById }) {
  const ta = useMemo(() => termAssignments(term.ay, term.sem), [term, termAssignments])
  
  const report = faculty.map(f => {
    const fac_ta = ta.filter(a => a.faculty_id === f.id && a.status === 'approved')
    const totalUnits = fac_ta.reduce((sum, a) => {
      const subj = subjectsById[a.subject_id]
      return sum + (subj?.units || 0)
    }, 0)
    
    return {
      name: f.name,
      specialization: f.specialization || 'General',
      currentUnits: totalUnits,
      maxUnits: f.max_units || 18,
      loadStatus: totalUnits >= (f.max_units || 18) ? 'Overloaded' : totalUnits >= ((f.max_units || 18) * 0.75) ? 'Near Capacity' : totalUnits > 0 ? 'Balanced' : 'Underloaded',
      assignmentCount: fac_ta.length,
      programs: [...new Set(fac_ta.map(a => subjectsById[a.subject_id]?.program_code).filter(Boolean))].join(', ') || 'N/A',
    }
  }).sort((a, b) => b.currentUnits - a.currentUnits)

  return (
    <div className={`${card(dark)} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-bold ${dark ? 'text-white' : 'text-[#10241A]'}`}
          style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Faculty Load Report</h3>
        <span className={`text-xs px-2 py-1 rounded-lg ${dark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
          AY {term.ay} • {term.sem}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${dark ? 'text-emerald-50' : 'text-gray-900'}`}>
          <thead>
            <tr className={`border-b ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
              <th className="text-left py-2 px-3 font-semibold">Faculty</th>
              <th className="text-left py-2 px-3 font-semibold">Specialization</th>
              <th className="text-center py-2 px-3 font-semibold">Units</th>
              <th className="text-center py-2 px-3 font-semibold">Load Status</th>
              <th className="text-center py-2 px-3 font-semibold">Assignments</th>
              <th className="text-left py-2 px-3 font-semibold">Programs</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row, idx) => (
              <tr key={idx} className={`border-b ${dark ? 'border-emerald-900/15' : 'border-gray-100'} last:border-0`}>
                <td className="py-3 px-3 font-medium">{row.name}</td>
                <td className={`py-3 px-3 text-xs ${dark ? 'text-emerald-200/70' : 'text-gray-600'}`}>{row.specialization}</td>
                <td className="py-3 px-3 text-center font-semibold">{row.currentUnits}/{row.maxUnits}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded font-semibold ${
                    row.loadStatus === 'Overloaded' ? (dark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') :
                    row.loadStatus === 'Near Capacity' ? (dark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700') :
                    row.loadStatus === 'Balanced' ? (dark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700') :
                    (dark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                  }`}>
                    {row.loadStatus}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">{row.assignmentCount}</td>
                <td className={`py-3 px-3 text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>{row.programs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`flex gap-2 pt-4 border-t ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
          dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}>
          <Download size={14} /> Export PDF
        </button>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
          dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}>
          <Download size={14} /> Export Excel
        </button>
      </div>
    </div>
  )
}

function ProgramLoadReport({ term, dark, termAssignments, subjectsById, faculty }) {
  const ta = useMemo(() => termAssignments(term.ay, term.sem), [term, termAssignments])
  
  const report = PROGRAMS.map(p => {
    const prog_ta = ta.filter(a => subjectsById[a.subject_id]?.program_code === p.code && a.status === 'approved')
    const totalUnits = prog_ta.reduce((sum, a) => sum + (subjectsById[a.subject_id]?.units || 0), 0)
    const uniqueFaculty = new Set(prog_ta.map(a => a.faculty_id)).size
    
    return {
      code: p.code,
      label: p.label,
      totalAssignments: prog_ta.length,
      totalUnits,
      uniqueFaculty,
      averageLoad: uniqueFaculty > 0 ? Math.round(totalUnits / uniqueFaculty) : 0,
    }
  }).sort((a, b) => b.totalUnits - a.totalUnits)

  return (
    <div className={`${card(dark)} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-bold ${dark ? 'text-white' : 'text-[#10241A]'}`}
          style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Program Load Report</h3>
        <span className={`text-xs px-2 py-1 rounded-lg ${dark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
          {report.filter(r => r.totalAssignments > 0).length} programs
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${dark ? 'text-emerald-50' : 'text-gray-900'}`}>
          <thead>
            <tr className={`border-b ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
              <th className="text-left py-2 px-3 font-semibold">Program</th>
              <th className="text-center py-2 px-3 font-semibold">Assignments</th>
              <th className="text-center py-2 px-3 font-semibold">Total Units</th>
              <th className="text-center py-2 px-3 font-semibold">Faculty</th>
              <th className="text-center py-2 px-3 font-semibold">Avg Load/Faculty</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row, idx) => (
              <tr key={idx} className={`border-b ${dark ? 'border-emerald-900/15' : 'border-gray-100'} last:border-0`}>
                <td className="py-3 px-3 font-medium">
                  <div>
                    <p className="font-semibold">{row.code}</p>
                    <p className={`text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>{row.label}</p>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">{row.totalAssignments}</td>
                <td className="py-3 px-3 text-center font-semibold">{row.totalUnits}</td>
                <td className="py-3 px-3 text-center">{row.uniqueFaculty}</td>
                <td className="py-3 px-3 text-center font-semibold">{row.averageLoad} units</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`flex gap-2 pt-4 border-t ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
          dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}>
          <Download size={14} /> Export PDF
        </button>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
          dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}>
          <Download size={14} /> Export Excel
        </button>
      </div>
    </div>
  )
}

function ApprovalHistoryReport({ term, dark, termAssignments, subjectsById, facultyById }) {
  const ta = useMemo(() => termAssignments(term.ay, term.sem), [term, termAssignments])
  
  const report = ta.slice(0, 20).map(a => ({
    subject: `${subjectsById[a.subject_id]?.code || 'N/A'} - ${subjectsById[a.subject_id]?.title || ''}`,
    faculty: facultyById[a.faculty_id]?.name || 'Unknown',
    status: a.status,
    submittedAt: new Date(a.submitted_at).toLocaleDateString(),
    approvedAt: a.approved_at ? new Date(a.approved_at).toLocaleDateString() : 'Pending',
  }))

  return (
    <div className={`${card(dark)} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-bold ${dark ? 'text-white' : 'text-[#10241A]'}`}
          style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Approval History</h3>
        <span className={`text-xs px-2 py-1 rounded-lg ${dark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
          Last 20 records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${dark ? 'text-emerald-50' : 'text-gray-900'}`}>
          <thead>
            <tr className={`border-b ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
              <th className="text-left py-2 px-3 font-semibold">Subject</th>
              <th className="text-left py-2 px-3 font-semibold">Faculty</th>
              <th className="text-center py-2 px-3 font-semibold">Status</th>
              <th className="text-center py-2 px-3 font-semibold">Submitted</th>
              <th className="text-center py-2 px-3 font-semibold">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row, idx) => (
              <tr key={idx} className={`border-b ${dark ? 'border-emerald-900/15' : 'border-gray-100'} last:border-0`}>
                <td className="py-3 px-3 font-medium text-xs">{row.subject}</td>
                <td className={`py-3 px-3 text-xs ${dark ? 'text-emerald-200/70' : 'text-gray-600'}`}>{row.faculty}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded font-semibold ${
                    row.status === 'approved' ? (dark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700') :
                    row.status === 'rejected' ? (dark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') :
                    (dark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700')
                  }`}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-xs">{row.submittedAt}</td>
                <td className="py-3 px-3 text-center text-xs">{row.approvedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`flex gap-2 pt-4 border-t ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
          dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}>
          <Download size={14} /> Export PDF
        </button>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const { term, faculty, termAssignments, subjectsById, facultyById } = useData()
  const [selectedReport, setSelectedReport] = useState(null)

  const reports = [
    {
      id: 'faculty-load',
      icon: Users,
      title: 'Faculty Load Report',
      description: 'Detailed breakdown of faculty workload and assignments',
    },
    {
      id: 'program-load',
      icon: BarChart3,
      title: 'Program Load Report',
      description: 'Program-wise distribution of assignments and units',
    },
    {
      id: 'approval-history',
      icon: CheckCircle2,
      title: 'Approval History',
      description: 'Timeline of assignment approvals and rejections',
    },
  ]

  return (
    <div className={`space-y-6 p-6 ${dark ? 'bg-[#0a1410]' : 'bg-gradient-to-br from-emerald-50/40 to-blue-50/40'}`}>
      {!selectedReport ? (
        <>
          {/* Header */}
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-[#10241A]'}`}
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Reports</h1>
            <p className={`text-sm ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>
              Generate and export comprehensive reports for AY {term.ay} · {term.sem}
            </p>
          </div>

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => (
              <ReportCard
                key={report.id}
                icon={report.icon}
                title={report.title}
                description={report.description}
                onClick={() => setSelectedReport(report.id)}
                dark={dark}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Back button */}
          <button
            onClick={() => setSelectedReport(null)}
            className={`flex items-center gap-2 text-sm font-semibold mb-4 ${
              dark ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            ← Back to Reports
          </button>

          {/* Report Display */}
          {selectedReport === 'faculty-load' && (
            <FacultyLoadReport term={term} dark={dark} faculty={faculty} termAssignments={termAssignments} subjectsById={subjectsById} />
          )}
          {selectedReport === 'program-load' && (
            <ProgramLoadReport term={term} dark={dark} termAssignments={termAssignments} subjectsById={subjectsById} faculty={faculty} />
          )}
          {selectedReport === 'approval-history' && (
            <ApprovalHistoryReport term={term} dark={dark} termAssignments={termAssignments} subjectsById={subjectsById} facultyById={facultyById} />
          )}
        </>
      )}
    </div>
  )
}
