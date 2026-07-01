import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, XCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'
import { useTheme } from '../../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

export default function ApprovalsPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const {
    term, isTermFinalized, subjectsById, facultyById,
    pendingForProgramHead, decidedForProgramHead,
    approveAssignment, rejectAssignment,
  } = useData()
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [rejectComment, setRejectComment] = useState('')

  const finalized = isTermFinalized(term.ay, term.sem)
  const pending = pendingForProgramHead(account)
  const decided = decidedForProgramHead(account)
  const selected = pending.filter(item => selectedIds.has(item.id))

  const groupedPending = useMemo(() => {
    return pending.reduce((groups, assignment) => {
      const subject = subjectsById[assignment.subjectId]
      const program = subject?.prog || 'Unassigned'
      const section = assignment.section || 'Unsectioned'
      const key = `${program}|${section}`
      if (!groups[key]) groups[key] = { program, section, items: [] }
      groups[key].items.push(assignment)
      return groups
    }, {})
  }, [pending, subjectsById])

  const groups = useMemo(() => Object.values(groupedPending).sort((a, b) => (
    a.program.localeCompare(b.program) || a.section.localeCompare(b.section)
  )), [groupedPending])

  function toggle(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function approveSelected() {
    if (finalized || selected.length === 0) return
    selected.forEach(item => approveAssignment(item.id, account))
    setSelectedIds(new Set())
    setRejectComment('')
  }

  function rejectSelected() {
    if (finalized || selected.length === 0 || !rejectComment.trim()) return
    selected.forEach(item => rejectAssignment(item.id, account, rejectComment.trim()))
    setSelectedIds(new Set())
    setRejectComment('')
  }

  function selectAll() {
    setSelectedIds(new Set(pending.map(item => item.id)))
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section className={`overflow-hidden rounded-2xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <ClipboardCheck size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Load Approval</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">
              AY {term.ay} - {term.sem} Semester - {account.programs?.map(programLabel).join(', ')}
            </p>
          </div>
          <span className="rounded-lg px-3 py-2 text-xs font-black" style={{ background: GOLD, color: FOREST }}>
            {pending.length} pending
          </span>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            {finalized && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-amber-800">
                  <AlertTriangle size={15} /> This term has already been finalized.
                </p>
              </div>
            )}

            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-950/10 p-12 text-center">
                <CheckCircle2 size={34} className="text-emerald-700/40" />
                <p className="text-sm font-bold text-emerald-950/50">No load assignments are waiting for review.</p>
              </div>
            ) : groups.map(group => (
              <div key={`${group.program}-${group.section}`} className="overflow-hidden rounded-xl border border-emerald-950/10">
                <div className="flex items-center justify-between gap-3 border-b border-emerald-950/10 bg-emerald-950/[0.03] px-4 py-3">
                  <div>
                    <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{group.section}</p>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-950/50">{programLabel(group.program)}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{group.items.length}</span>
                </div>
                <div className="divide-y divide-emerald-950/10">
                  {group.items.map(item => {
                    const subject = subjectsById[item.subjectId]
                    const faculty = facultyById[item.facultyId]
                    return (
                      <label key={item.id} className="flex cursor-pointer items-start gap-3 p-4 hover:bg-emerald-950/[0.02]">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggle(item.id)}
                          disabled={finalized}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{subject?.code} <span className="font-semibold text-emerald-950/55">{subject?.title}</span></p>
                          <p className="mt-1 text-xs font-semibold text-emerald-950/60">{faculty ? `${faculty.fn} ${faculty.ln}` : 'TBA Faculty'}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <aside className="flex flex-col gap-3">
            <div className={`rounded-xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} p-4`}>
              <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>Decision</p>
              <p className="mt-2 text-xs font-semibold text-emerald-950/55">
                Approve teaching loads first. After all needed loads are approved, Admin can generate and submit the conflict-free schedule for a separate schedule approval.
              </p>

              <button type="button" onClick={selectAll} disabled={finalized || pending.length === 0} className={`mt-4 w-full rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'} disabled:opacity-45`}>
                Select all pending loads
              </button>

              <textarea
                value={rejectComment}
                onChange={event => setRejectComment(event.target.value)}
                disabled={finalized || selected.length === 0}
                rows={4}
                placeholder="Required reason when rejecting selected loads"
                className="mt-3 w-full resize-y rounded-lg border border-emerald-950/15 px-3 py-2 text-sm outline-none disabled:bg-slate-50"
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={rejectSelected} disabled={finalized || selected.length === 0 || !rejectComment.trim()} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-45">
                  <XCircle size={14} /> Reject
                </button>
                <button type="button" onClick={approveSelected} disabled={finalized || selected.length === 0} className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-45" style={{ background: MID_GREEN }}>
                  <CheckCircle2 size={14} /> Approve
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-950/10 bg-emerald-950/[0.03] p-4">
              <p className="text-xs font-black uppercase text-emerald-950/45">Review Summary</p>
              <p className={`mt-2 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{selected.length}</p>
              <p className="text-xs font-semibold text-emerald-950/55">selected load(s)</p>
              <p className="mt-3 text-sm font-black" style={{ color: GOLD }}>{decided.length} previous decision(s)</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
