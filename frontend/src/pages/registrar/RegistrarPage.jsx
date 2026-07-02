import { useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Lock, Unlock } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'
import ConfirmDialog from '../../components/ConfirmDialog'

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

export default function RegistrarPage() {
  const { account } = useAuth()
  const { dark } = useTheme()
  const {
    term, savedScheduleForTerm, getScheduleFinalizeBlockers,
    finalizeScheduleForTerm, reopenScheduleForTerm,
  } = useData()

  const schedule = savedScheduleForTerm(term.ay, term.sem)
  const blockers = getScheduleFinalizeBlockers(term.ay, term.sem)
  const finalized = Boolean(schedule?.finalized)
  const canFinalize = schedule?.status === 'approved' && !finalized && blockers.length === 0

  const [confirm, setConfirm] = useState(null)

  function finalize() {
    setConfirm({
      title: 'Finalize Schedule',
      message: 'Finalize the approved schedule for Registrar release? This locks the schedule for the term.',
      onConfirm: () => { setConfirm(null); finalizeScheduleForTerm(term.ay, term.sem, account) },
    })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section className={`overflow-hidden rounded-2xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ background: finalized ? 'linear-gradient(105deg,#065F46,#059669)' : `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            {finalized ? <Lock size={20} className="text-white" /> : <CalendarDays size={20} className="text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {finalized ? 'Schedule Finalized' : 'Finalize Approved Schedule'}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">AY {term.ay} - {term.sem} Semester</p>
          </div>
          {schedule && (
            <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
              {(schedule.status || 'draft').replace(/_/g, ' ')}
            </span>
          )}
          {finalized ? (
            <button type="button" onClick={() => reopenScheduleForTerm(term.ay, term.sem, account)} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
              <Unlock size={14} /> Reopen
            </button>
          ) : (
            <button type="button" onClick={finalize} disabled={!canFinalize} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'} disabled:opacity-45`} style={{ background: GOLD }}>
              <Lock size={14} /> Finalize
            </button>
          )}
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-xl border border-emerald-950/10">
            <div className="border-b border-emerald-950/10 bg-emerald-950/[0.03] px-4 py-3">
              <p className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>Generated Schedule</p>
              <p className="mt-1 text-xs font-semibold text-emerald-950/50">
                Finalized schedules are ready to release to students after enrollment.
              </p>
            </div>

            {!schedule ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center">
                <CalendarDays size={34} className="text-emerald-950/20" />
                <p className="text-sm font-bold text-emerald-950/50">No generated schedule has been saved yet.</p>
              </div>
            ) : (
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
                    {(schedule.scheduled || []).map((row, index) => (
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
            )}
          </div>

          <aside className="flex flex-col gap-3">
            {finalized && (
              <div className={`rounded-xl border border-emerald-200 ${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'} p-4`}>
                <p className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 size={15} /> Ready for student release</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">The schedule is locked and can be given to students after enrollment.</p>
              </div>
            )}

            {!finalized && blockers.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-amber-800"><AlertTriangle size={15} /> Cannot finalize yet</p>
                {blockers.map(blocker => (
                  <p key={blocker} className="mt-2 text-xs font-semibold text-amber-700">{blocker}</p>
                ))}
              </div>
            )}

            {!finalized && canFinalize && (
              <div className={`rounded-xl border border-emerald-200 ${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'} p-4`}>
                <p className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 size={15} /> Approved by Program Head</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">Registrar can now finalize this generated schedule.</p>
              </div>
            )}

            <div className={`rounded-xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} p-4`}>
              <p className="text-xs font-black uppercase text-emerald-950/45">Schedule Summary</p>
              <p className={`mt-2 text-2xl font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`} style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{schedule?.scheduled?.length || 0}</p>
              <p className="text-xs font-semibold text-emerald-950/55">generated class slots</p>
              <p className="mt-3 text-sm font-black" style={{ color: GOLD }}>{schedule?.unscheduled?.length || 0} exception(s)</p>
            </div>
          </aside>
        </div>
      </section>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        variant={confirm?.variant || 'default'}
        confirmLabel="Finalize"
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
