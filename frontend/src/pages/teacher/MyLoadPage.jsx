import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import { getFacultyMaxUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

export default function MyLoadPage() {
  const { account } = useAuth()
  const { term, facultyById, subjectsById, assignmentsForFaculty } = useData()

  const fac = facultyById[account.facultyId]
  const mine = assignmentsForFaculty(account.facultyId).filter((a) => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem)
  const approvedUnits = mine
    .filter((a) => a.status === 'approved')
    .reduce((sum, a) => sum + subjectsById[a.subjectId].lec + subjectsById[a.subjectId].lab, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">{fac.fn} {fac.ln}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{fac.spec} · {fac.type} · {term.ay} {term.sem} semester</p>
        <p className="text-xs text-gray-500 mt-2">Approved load: {approvedUnits}/{getFacultyMaxUnits(fac)} units</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">My subjects this term</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-gray-400">No subjects assigned to you yet for this term.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Units</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((a) => {
                const subj = subjectsById[a.subjectId]
                return (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{subj.code} — {subj.title}</td>
                    <td className="py-2 pr-3">{a.section} <span className="text-gray-400">({programLabel(subj.prog)})</span></td>
                    <td className="py-2 pr-3">{subj.lec + subj.lab}</td>
                    <td className="py-2 pr-3"><StatusBadge status={a.status} /></td>
                    <td className="py-2 text-gray-500">{a.comment || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}