import { useState } from 'react'
import { ChevronDown, ChevronUp, Download, Printer } from 'lucide-react'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function timeLabel(minutes) {
  if (!minutes && minutes !== 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`
}

export default function ScheduleViewByProgram({ schedule, term, programs, facultyById = {} }) {
  const [expandedSections, setExpandedSections] = useState(new Set())

  if (!schedule?.scheduled || schedule.scheduled.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800">No scheduled courses to display.</p>
      </div>
    )
  }

  // Group scheduled items by program, then by section, then by course code
  const groupedByProgram = {}
  const programLabels = Object.fromEntries(programs.map(item => [item.code, item.label]))

  schedule.scheduled.forEach(row => {
    const program = row.subject.prog || 'UNSPECIFIED'
    const section = row.assignment.section
    const courseCode = row.subject.code

    if (!groupedByProgram[program]) {
      groupedByProgram[program] = {}
    }
    if (!groupedByProgram[program][section]) {
      groupedByProgram[program][section] = {}
    }
    if (!groupedByProgram[program][section][courseCode]) {
      groupedByProgram[program][section][courseCode] = []
    }
    groupedByProgram[program][section][courseCode].push(row)
  })

  const programOrder = programs.map(item => item.code).concat(Object.keys(groupedByProgram).filter(code => !programs.some(item => item.code === code)))
  const programKeys = programOrder.filter(code => groupedByProgram[code])

  const toggleSection = section => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="space-y-4">
      {/* Header with export options */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black" style={{ fontFamily: "'EB Garamond',Georgia,serif", color: FOREST }}>
            Schedule by Program
          </h2>
          <p className="mt-1 text-xs font-semibold text-emerald-950/55">
            {term.ay} Academic Year - Semester {term.sem}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: GOLD, color: FOREST }}
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Programs */}
      <div className="space-y-6">
        {programKeys.map(program => {
          const sections = Object.keys(groupedByProgram[program]).sort()
          const programLabelText = programLabels[program] || program
          const totalCourses = sections.reduce((sum, section) => {
            return sum + Object.keys(groupedByProgram[program][section]).length
          }, 0)

          return (
            <div key={program} className="overflow-hidden rounded-lg border border-emerald-950/10 bg-white shadow-sm">
              <div className="px-4 py-4" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black" style={{ color: FOREST }}>{programLabelText}</p>
                    <p className="text-xs font-semibold text-emerald-950/55">{sections.length} section{sections.length !== 1 ? 's' : ''}, {totalCourses} course{totalCourses !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {sections.map(section => {
                  const courses = Object.keys(groupedByProgram[program][section]).sort()
                  const sectionKey = `${program}-${section}`
                  const isExpanded = expandedSections.has(sectionKey)
                  const sectionCourseCount = courses.length

                  return (
                    <div key={sectionKey} className="rounded-2xl border border-emerald-950/10 bg-emerald-50">
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="w-full px-4 py-3 text-left font-black text-emerald-950"
                        style={{ backgroundColor: GOLD }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{programLabelText} / {section}</span>
                          <span className="text-xs font-semibold text-emerald-950/70">{sectionCourseCount} course{sectionCourseCount !== 1 ? 's' : ''}</span>
                          {isExpanded ? <ChevronUp size={18} style={{ color: FOREST }} /> : <ChevronDown size={18} style={{ color: FOREST }} />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="overflow-x-auto p-4">
                          <table className="w-full min-w-[920px] border-collapse text-xs">
                            <thead>
                              <tr className="bg-emerald-950/[0.04] text-[10px] uppercase text-emerald-950/60">
                                <th className="border border-emerald-950/10 px-3 py-2 text-left">Course Code</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-left">Description</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-center">Units</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-left">Time</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-left">Days</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-left">Room</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-left">Faculty</th>
                                <th className="border border-emerald-950/10 px-3 py-2 text-center">Students</th>
                              </tr>
                            </thead>
                            <tbody>
                              {courses.map(courseCode => {
                                const courseRows = groupedByProgram[program][section][courseCode]
                                const firstRow = courseRows[0]
                                const subject = firstRow.subject
                                const description = subject.title || subject.code
                                const totalUnits = (subject.lec || 0) + (subject.lab || 0)
                                const studentCount = firstRow.assignment.studentCount || ''
                                const faculty = firstRow.assignment.facultyId ? facultyById[firstRow.assignment.facultyId] : null
                                const facultyName = faculty ? `${faculty.ln}, ${faculty.fn}` : 'Unassigned'

                                return courseRows.map((row, idx) => (
                                  <tr key={`${section}-${courseCode}-${idx}`} className="hover:bg-emerald-50/30">
                                    {idx === 0 ? (
                                      <>
                                        <td className="border border-emerald-950/10 px-3 py-2 font-semibold">{courseCode}</td>
                                        <td className="border border-emerald-950/10 px-3 py-2 text-xs">{description}</td>
                                        <td className="border border-emerald-950/10 px-3 py-2 text-center font-semibold">{totalUnits}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="border border-emerald-950/10 px-3 py-2"></td>
                                        <td className="border border-emerald-950/10 px-3 py-2"></td>
                                        <td className="border border-emerald-950/10 px-3 py-2"></td>
                                      </>
                                    )}
                                    <td className="border border-emerald-950/10 px-3 py-2 font-semibold">{row.kind === 'Lecture' ? 'LEC' : 'LAB'} {timeLabel(row.start)} - {timeLabel(row.end)}</td>
                                    <td className="border border-emerald-950/10 px-3 py-2">{row.day}</td>
                                    <td className="border border-emerald-950/10 px-3 py-2 font-semibold">{row.room?.name && row.room.name !== 'TBA' ? row.room.name : 'TBA'}</td>
                                    <td className="border border-emerald-950/10 px-3 py-2">{idx === 0 ? facultyName : ''}</td>
                                    {idx === 0 ? (
                                      <td className="border border-emerald-950/10 px-3 py-2 text-center font-semibold">{studentCount}</td>
                                    ) : (
                                      <td className="border border-emerald-950/10 px-3 py-2"></td>
                                    )}
                                  </tr>
                                ))
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 rounded-lg border border-emerald-950/10 bg-white p-4">
        <p className="text-xs font-semibold" style={{ color: FOREST }}>
          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-800">TBA</span>
          <span className="ml-2">= Room to be assigned in the dedicated room assignment page</span>
        </p>
        <p className="mt-2 text-xs font-semibold" style={{ color: FOREST }}>
          LEC = Lecture | LAB = Laboratory
        </p>
      </div>
    </div>
  )
}
