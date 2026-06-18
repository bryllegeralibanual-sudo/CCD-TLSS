import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

export default function ApprovalsPage() {
  const { account } = useAuth()
  const { term, isTermFinalized, subjectsById, facultyById, pendingForProgramHead, decidedForProgramHead, approveAssignment, rejectAssignment, checkCompatibility } = useData()

  const finalized = isTermFinalized(term.ay, term.sem)
  const pending = pendingForProgramHead(account)
  const decided = decidedForProgramHead(account)
  const [rejecting, setRejecting] = useState(null)
  const [comment, setComment] = useState('')

  function handleApprove(id) {
    approveAssignment(id, account)
  }

  function handleRejectConfirm(id) {
    if (!comment.trim()) return
    rejectAssignment(id, account, comment.trim())
    setRejecting(null)
    setComment('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Pending your review</h2>
        <p className="text-xs text-gray-500 mb-4">{account.programs.map(programLabel).join(', ')} · {term.ay} {term.sem} semester</p>

        {finalized && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            This term is already finalized by the Registrar — no further decisions are needed.
          </p>
        )}

        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing waiting on you right now.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => {
              const subj = subjectsById[a.subjectId]
              const fac = facultyById[a.facultyId]
              const check = checkCompatibility({ facultyId: a.facultyId, subjectId: a.subjectId, section: a.section, excludeId: a.id })
              return (
                <div key={a.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{subj.code} — {subj.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.section} · {fac.fn} {fac.ln} ({fac.spec || 'no specialization on file'})</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  {check && (
                    <div className="mt-2 space-y-1">
                      {check.notes.map((n, i) => (
                        <p key={i} className="text-xs text-gray-500">· {n}</p>
                      ))}
                    </div>
                  )}

                  {rejecting === a.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Reason for rejecting (required, the Admin will see this)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectConfirm(a.id)} disabled={!comment.trim()} className="text-xs rounded-lg bg-red-600 text-white px-3 py-1.5 disabled:opacity-40">
                          Confirm reject
                        </button>
                        <button onClick={() => { setRejecting(null); setComment('') }} className="text-xs rounded-lg border border-gray-300 px-3 py-1.5">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    !finalized && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleApprove(a.id)} className="text-xs rounded-lg bg-green-600 text-white px-3 py-1.5 hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={() => setRejecting(a.id)} className="text-xs rounded-lg border border-red-300 text-red-700 px-3 py-1.5 hover:bg-red-50">
                          Reject
                        </button>
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Your past decisions — this term</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-gray-400">No decisions made yet this term.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Faculty</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Comment</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((a) => {
                const subj = subjectsById[a.subjectId]
                const fac = facultyById[a.facultyId]
                return (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{subj.code} — {subj.title}</td>
                    <td className="py-2 pr-3">{fac.fn} {fac.ln}</td>
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