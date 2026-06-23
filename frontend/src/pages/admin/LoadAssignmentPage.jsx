import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, getSections, programLabel } from '../../data/programs'
import { canTeachProgram, getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

export default function LoadAssignmentPage() {
  const { account } = useAuth()
  const { term, isTermFinalized, faculty, subjects, assignments, subjectsById, facultyById, createAssignment, withdrawAssignment, checkCompatibility } = useData()

  const allSections = useMemo(() => getSections(), [])
  const [progCode, setProgCode] = useState(PROGRAMS[0].code)
  const [yr, setYr] = useState(1)
  const [sectionLbl, setSectionLbl] = useState('A')
  const [subjectId, setSubjectId] = useState('')
  const [facultyId, setFacultyId] = useState('')

  const finalized = isTermFinalized(term.ay, term.sem)
  const sectionsForProg = allSections.filter((s) => s.prog === progCode && s.yr === yr)
  const section = `${progCode} ${yr}${sectionLbl}`

  const subjectOptions = subjects.filter((s) => s.prog === progCode && s.yr === yr && s.sem === term.sem)
  const facultyOptions = faculty.filter((f) => canTeachProgram(f, progCode))

  const check = subjectId && facultyId ? checkCompatibility({ facultyId: Number(facultyId), subjectId: Number(subjectId), section }) : null
  const selectedFaculty = facultyId ? facultyById[Number(facultyId)] : null
  const [feedback, setFeedback] = useState(null)

  async function handleSubmit() {
    if (!subjectId || !facultyId) return
    const result = await createAssignment({ facultyId: Number(facultyId), subjectId: Number(subjectId), section }, account)
    if (result.ok) {
      setFeedback({ type: 'success', text: `Submitted for Program Head review: ${subjectsById[Number(subjectId)].code} → ${facultyById[Number(facultyId)].ln}.` })
      setSubjectId('')
      setFacultyId('')
    } else {
      setFeedback({ type: 'error', text: result.blockers.join(' ') })
    }
  }

  const termAssignments = assignments.filter((a) => a.ay === term.ay && subjectsById[a.subjectId]?.sem === term.sem)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Assign a subject load</h2>
        {finalized && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            {term.ay} {term.sem} semester is finalized. New assignments are disabled until it's reopened by the Registrar.
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="Program">
            <select className={selectCls} value={progCode} onChange={(e) => { setProgCode(e.target.value); setSubjectId(''); setFacultyId(''); setSectionLbl('A') }}>
              {PROGRAMS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Year level">
            <select className={selectCls} value={yr} onChange={(e) => { setYr(Number(e.target.value)); setSubjectId('') }}>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select className={selectCls} value={sectionLbl} onChange={(e) => setSectionLbl(e.target.value)}>
              {sectionsForProg.map((s) => <option key={s.lbl} value={s.lbl}>{s.full}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <select className={selectCls} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">— Select —</option>
              {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.code} – {s.title}</option>)}
            </select>
          </Field>
          <Field label="Faculty">
            <select className={selectCls} value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
              <option value="">— Select —</option>
              {facultyOptions.map((f) => <option key={f.id} value={f.id}>{f.ln}, {f.fn}</option>)}
            </select>
          </Field>
        </div>

        {selectedFaculty && (
          <p className="text-xs text-gray-500 mt-3">
            {selectedFaculty.fn} {selectedFaculty.ln} · {selectedFaculty.spec || 'No specialization on file'} · current load {getFacultyUnits(assignments.filter((a) => a.ay === term.ay), subjectsById, selectedFaculty.id, term.sem)}/{getFacultyMaxUnits(selectedFaculty)} units
          </p>
        )}

        {check && (
          <div className="mt-3 space-y-1">
            {check.blockers.map((b, i) => (
              <p key={i} className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{b}</p>
            ))}
            {check.notes.map((n, i) => (
              <p key={i} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">{n}</p>
            ))}
          </div>
        )}

        {feedback && (
          <p className={`text-xs mt-3 px-3 py-1.5 rounded-lg border ${feedback.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
            {feedback.text}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!subjectId || !facultyId || finalized || (check && !check.ok)}
          className="mt-4 rounded-lg bg-[#185FA5] text-white px-4 py-2 text-sm font-medium hover:bg-[#0C447C] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit for Program Head review
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Assignments — {term.ay} · {term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'} semester</h2>
        {termAssignments.length === 0 ? (
          <p className="text-sm text-gray-400">No assignments submitted yet for this term.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Faculty</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Comment</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {termAssignments.map((a) => {
                const subj = subjectsById[a.subjectId]
                const fac = facultyById[a.facultyId]
                return (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3"><span className="font-medium">{subj.code}</span> <span className="text-gray-500">{subj.title}</span></td>
                    <td className="py-2 pr-3">{a.section} <span className="text-gray-400">({programLabel(subj.prog)})</span></td>
                    <td className="py-2 pr-3">{fac.ln}, {fac.fn}</td>
                    <td className="py-2 pr-3"><StatusBadge status={a.status} /></td>
                    <td className="py-2 pr-3 text-gray-500">{a.comment || '—'}</td>
                    <td className="py-2 text-right">
                      {(a.status === 'pending' || a.status === 'rejected') && !finalized && (
                        <button onClick={() => withdrawAssignment(a.id)} className="text-xs text-red-600 hover:underline">Withdraw</button>
                      )}
                    </td>
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

const selectCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]'

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}