import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import { useTheme } from '../../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function timeLabel(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

export default function ApprovalsPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const {
    term, savedScheduleForTerm, getPendingSchedulesForPH,
    approveScheduleForTerm, rejectScheduleForTerm,
  } = useData()
  const [reason, setReason] = useState('')

  const savedSchedule = savedScheduleForTerm(term.ay, term.sem)
  const pendingSchedules = getPendingSchedulesForPH(account)
  const schedule = pendingSchedules[0] || savedSchedule
  const isPending = schedule?.status === 'pending_approval'

  const rows = useMemo(() => {
    const programs = account.programs || []
    return (schedule?.scheduled || [])
      .filter(row => programs.length === 0 || programs.includes(row.subject?.prog))
      .sort((a, b) => a.assignment.section.localeCompare(b.assignment.section) || a.day.localeCompare(b.day) || a.start - b.start)
  }, [account.programs, schedule])

  function approve() {
    if (!isPending) return
    approveScheduleForTerm(term.ay, term.sem, account)
    setReason('')
  }

  function reject() {
    if (!isPending || !reason.trim()) return
    rejectScheduleForTerm(term.ay, term.sem, account, reason.trim())
    setReason('')
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section className={`overflow-hidden rounded-2xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <CalendarDays size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Schedule Approval</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">
              AY {term.ay} - {term.sem} Semester - {account.programs?.map(programLabel).join(', ')}
            </p>
          </div>
          {schedule && (
            <span className={`rounded-lg px-3 py-2 text-xs font-black ${isPending ? 'bg-amber-100 text-amber-800' : schedule.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : schedule.finalized ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
              {(schedule.status || 'draft').replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {!schedule ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Clock3 size={34} className="text-emerald-950/20" />
            <p className="text-sm font-bold text-emerald-950/50">No generated schedule has been submitted yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-xl border border-emerald-950/10">
              <div className="border-b border-emerald-950/10 bg-emerald-950/[0.03] px-4 py-3">
                <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>Submitted Schedule</p>
                <p className="mt-1 text-xs font-semibold text-emerald-950/50">
                  {rows.length} class slot(s) in your program scope
                </p>
              </div>
              <div className="max-h-[34rem] overflow-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead className={`sticky top-0 ${dark ? 'bg-[#101F18]' : 'bg-white'}`}>
                    <tr className="border-b border-emerald-950/10 text-left text-[11px] uppercase text-emerald-950/45">
                      {['Section', 'Subject', 'Day', 'Time', 'Room', 'Faculty'].map(header => (
                        <th key={header} className="px-4 py-3 font-black">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.assignment.id}-${row.kind}-${row.day}-${row.start}`} className={index % 2 ? 'bg-emerald-950/[0.015]' : 'bg-white'}>
                        <td className={`px-4 py-3 font-bold ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{row.assignment.section}</td>
                        <td className="px-4 py-3">
                          <span className={`font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>{row.subject.code}</span>
                          <span className="ml-2 text-xs font-semibold text-emerald-950/50">{row.kind}</span>
                        </td>
                        <td className="px-4 py-3 text-emerald-950/70">{row.day}</td>
                        <td className="px-4 py-3 text-emerald-950/70">{timeLabel(row.start)} - {timeLabel(row.end)}</td>
                        <td className="px-4 py-3 text-emerald-950/70">{row.room?.name || 'TBA'}</td>
                        <td className="px-4 py-3 text-emerald-950/70">{row.faculty ? `${row.faculty.fn} ${row.faculty.ln}` : 'TBA'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="flex flex-col gap-3">
              {schedule.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-red-800"><AlertTriangle size={15} /> Returned for changes</p>
                  <p className="mt-2 text-xs font-semibold text-red-700">{schedule.rejectionReason}</p>
                </div>
              )}

              <div className={`rounded-xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} p-4`}>
                <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>Decision</p>
                <p className="mt-2 text-xs font-semibold text-emerald-950/55">
                  Approve the generated schedule if it is ready for Registrar finalization. Reject it when the Admin needs to adjust conflicts, rooms, time blocks, or program concerns.
                </p>

                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  disabled={!isPending}
                  rows={4}
                  placeholder="Required reason when rejecting"
                  className="mt-4 w-full resize-y rounded-lg border border-emerald-950/15 px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                />

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={reject} disabled={!isPending || !reason.trim()} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-45">
                    <XCircle size={14} /> Reject
                  </button>
                  <button type="button" onClick={approve} disabled={!isPending} className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-45" style={{ background: MID_GREEN }}>
                    <CheckCircle2 size={14} /> Approve
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-950/10 bg-emerald-950/[0.03] p-4">
                <p className="text-xs font-black uppercase text-emerald-950/45">Summary</p>
                <p className={`mt-2 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{schedule.scheduled?.length || 0}</p>
                <p className="text-xs font-semibold text-emerald-950/55">total generated class slots</p>
                <p className="mt-3 text-sm font-black" style={{ color: GOLD }}>{schedule.unscheduled?.length || 0} exception(s)</p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  )
}
