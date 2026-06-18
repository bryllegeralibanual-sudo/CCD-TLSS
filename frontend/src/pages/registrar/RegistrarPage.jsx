import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

export default function RegistrarPage() {
  const { account } = useAuth()
  const { term, isTermFinalized, registrarSummary, getFinalizeBlockers, finalizeTerm, reopenTerm, termAssignments, subjectsById, facultyById } = useData()

  const finalized = isTermFinalized(term.ay, term.sem)
  const summary = registrarSummary(term.ay, term.sem)
  const blockers = getFinalizeBlockers(term.ay, term.sem)
  const allForTerm = termAssignments(term.ay, term.sem)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{term.ay} · {term.sem} semester</h2>
            <p className="text-xs text-gray-500 mt-0.5">Status by program</p>
          </div>
          {finalized ? (
            <button onClick={() => reopenTerm(term.ay, term.sem)} className="text-xs rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
              Reopen term
            </button>
          ) : (
            <button
              onClick={() => finalizeTerm(term.ay, term.sem, account)}
              disabled={blockers.length > 0}
              className="text-xs rounded-lg bg-[#185FA5] text-white px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finalize term
            </button>
          )}
        </div>

        {finalized && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">
            This term is finalized. All loads are locked — the schedule can now be generated in the Scheduler.
          </p>
        )}
        {!finalized && blockers.length > 0 && (
          <div className="mt-3 space-y-1">
            {blockers.map((b, i) => (
              <p key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{b}</p>
            ))}
          </div>
        )}
        {!finalized && blockers.length === 0 && (
          <p className="text-xs text-gray-500 mt-3">Every submitted load this term has been approved. Ready to finalize.</p>
        )}

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3">Program</th>
              <th className="py-2 pr-3">Pending</th>
              <th className="py-2 pr-3">Approved</th>
              <th className="py-2">Rejected</th>
            </tr>
          </thead>
          <tbody>
            {PROGRAMS.map((p) => (
              <tr key={p.code} className="border-b border-gray-100">
                <td className="py-2 pr-3">{p.label}</td>
                <td className="py-2 pr-3">{summary[p.code]?.pending || 0}</td>
                <td className="py-2 pr-3">{summary[p.code]?.approved || 0}</td>
                <td className="py-2">{summary[p.code]?.rejected || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">All submitted loads this term</h2>
        {allForTerm.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Faculty</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {allForTerm.map((a) => {
                const subj = subjectsById[a.subjectId]
                const fac = facultyById[a.facultyId]
                return (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{subj.code} — {subj.title}</td>
                    <td className="py-2 pr-3">{a.section} <span className="text-gray-400">({programLabel(subj.prog)})</span></td>
                    <td className="py-2 pr-3">{fac.fn} {fac.ln}</td>
                    <td className="py-2"><StatusBadge status={a.status} /></td>
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