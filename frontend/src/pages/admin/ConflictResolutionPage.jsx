import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, RefreshCw, Send, AlertCircle,
  XCircle, Calendar,
} from 'lucide-react'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'

function timeLabel(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

export default function ConflictResolutionPage() {
  const { dark } = useTheme()
  const { term, savedScheduleForTerm, getScheduleConflicts, suggestAlternativeTimeSlots } = useData()
  const [selectedAlternatives, setSelectedAlternatives] = useState({})
  const [showSuggestions, setShowSuggestions] = useState({})
  const [resolutionNotes, setResolutionNotes] = useState('')

  const savedSchedule = savedScheduleForTerm(term.ay, term.sem)
  const scheduleStatus = savedSchedule?.status
  const isApproved = scheduleStatus === 'approved'
  
  const conflicts = useMemo(() => getScheduleConflicts(term.ay, term.sem), [term, getScheduleConflicts])
  const hasConflicts = conflicts.length > 0
  const resolvedConflicts = useMemo(
    () => conflicts.filter(c => selectedAlternatives[c.id]),
    [conflicts, selectedAlternatives]
  )
  const unresolvedConflicts = conflicts.length - resolvedConflicts.length

  if (!savedSchedule) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="flex items-center gap-2 text-lg font-black text-amber-900">
            <AlertTriangle size={20} /> No schedule available
          </p>
          <p className="mt-2 text-sm text-amber-800">Create and approve a schedule first.</p>
        </div>
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <p className="flex items-center gap-2 text-lg font-black text-blue-900">
            <AlertTriangle size={20} /> Schedule not approved
          </p>
          <p className="mt-2 text-sm text-blue-800">
            Current status: <span className="font-bold">{scheduleStatus}</span>
          </p>
        </div>
      </div>
    )
  }

  if (!hasConflicts) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="flex items-center gap-2 text-lg font-black text-green-900">
            <CheckCircle2 size={20} /> No conflicts detected
          </p>
          <p className="mt-2 text-sm text-green-800">
            All room assignments are conflict-free! Ready for room assignment or program head final approval.
          </p>
        </div>
      </div>
    )
  }

  function handleSubmitResolution() {
    if (unresolvedConflicts > 0) {
      alert(`Please resolve all ${unresolvedConflicts} conflict(s) before submitting.`)
      return
    }
    // TODO: Submit to PH for approval with resolutionNotes
    alert('Conflict resolutions submitted to Program Head for approval')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className={`overflow-hidden rounded-2xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <AlertCircle size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              Room Conflict Resolution
            </p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">
              AY {term.ay} - {term.sem} Semester • Resolve double-booked rooms before final approval
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Total Conflicts</p>
            <p className="mt-1 text-2xl font-black text-red-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {conflicts.length}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Unresolved</p>
            <p className="mt-1 text-2xl font-black text-amber-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {unresolvedConflicts}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Resolved</p>
            <p className="mt-1 text-2xl font-black text-green-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {resolvedConflicts.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {conflicts.map((conflict, idx) => {
          const [row1, row2] = conflict.rows
          const alternatives = suggestAlternativeTimeSlots(row2, savedSchedule)
          const selectedAlt = selectedAlternatives[conflict.id]
          const isResolved = !!selectedAlt

          return (
            <div key={conflict.id} className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-red-900">
                    Conflict #{idx + 1}: {conflict.room.name} - Double Booked
                  </p>
                  <p className="mt-1 text-xs text-red-800/75">
                    Both classes scheduled at the same time in the same room
                  </p>
                </div>
                {isResolved ? (
                  <CheckCircle2 size={24} className="shrink-0 text-green-600" />
                ) : (
                  <XCircle size={24} className="shrink-0 text-red-600" />
                )}
              </div>

              <div className={`mb-4 space-y-3 rounded-lg ${dark ? 'bg-[#101F18]' : 'bg-white'} p-4`}>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Class 1 */}
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                    <p className="text-xs font-bold uppercase text-red-800">Class 1</p>
                    <p className="mt-1 text-sm font-bold text-red-900">{row1.subject.code}</p>
                    <p className="text-xs text-red-800">
                      {row1.day} • {timeLabel(row1.start)} - {timeLabel(row1.end)}
                    </p>
                    <p className="mt-1 text-xs text-red-800">
                      Faculty: {row1.faculty?.ln}, {row1.faculty?.fn}
                    </p>
                  </div>

                  {/* Class 2 */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <p className="text-xs font-bold uppercase text-amber-800">Class 2 (NEEDS MOVE)</p>
                    <p className="mt-1 text-sm font-bold text-amber-900">{row2.subject.code}</p>
                    <p className="text-xs text-amber-800">
                      {row2.day} • {timeLabel(row2.start)} - {timeLabel(row2.end)}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Faculty: {row2.faculty?.ln}, {row2.faculty?.fn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative Time Slots */}
              {!isResolved && (
                <div>
                  <button
                    onClick={() => setShowSuggestions(prev => ({ ...prev, [conflict.id]: !prev[conflict.id] }))}
                    className={`mb-3 flex items-center gap-2 rounded-lg ${dark ? 'bg-emerald-900/30' : 'bg-emerald-100'} px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-200`}
                  >
                    <RefreshCw size={12} /> {showSuggestions[conflict.id] ? 'Hide' : 'Show'} Alternative Times ({alternatives.length})
                  </button>

                  {showSuggestions[conflict.id] && (
                    <div className={`grid gap-2 rounded-lg ${dark ? 'bg-[#101F18]' : 'bg-white'} p-3 md:grid-cols-2`}>
                      {alternatives.slice(0, 6).map((alt, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedAlternatives(prev => ({ ...prev, [conflict.id]: alt }))}
                          className={`rounded-lg border-2 border-emerald-200 ${dark ? 'bg-emerald-900/20' : 'bg-emerald-50'} p-2 text-left text-xs hover:${dark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}
                        >
                          <p className="font-bold text-emerald-900">{alt.day}</p>
                          <p className="text-emerald-800">
                            {timeLabel(alt.start)} - {timeLabel(alt.end)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isResolved && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-black text-green-900">✓ Resolution Selected</p>
                  <p className="mt-1 text-sm text-green-800">
                    Move to: <span className="font-bold">{selectedAlt.day}, {timeLabel(selectedAlt.start)} - {timeLabel(selectedAlt.end)}</span>
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Notes & Submit */}
      {hasConflicts && (
        <div className={`mt-6 rounded-2xl border border-emerald-950/10 ${dark ? 'bg-[#101F18]' : 'bg-white'} p-5 shadow-sm`}>
          <label className={`text-sm font-black ${dark ? 'text-emerald-50' : 'text-emerald-950'}`}>
            <Calendar size={14} className="mb-1 inline" /> Notes for Program Head
          </label>
          <textarea
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
            placeholder="Explain any special considerations or reasons for these moves..."
            rows={4}
            className="mt-2 w-full rounded-lg border border-emerald-950/15 bg-emerald-50/50 p-3 text-sm outline-none"
          />

          {unresolvedConflicts === 0 && (
            <button
              onClick={handleSubmitResolution}
              className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white hover:opacity-90"
              style={{ background: MID_GREEN }}
            >
              <Send size={14} /> Submit Resolutions to Program Head
            </button>
          )}

          {unresolvedConflicts > 0 && (
            <p className="mt-4 text-xs font-bold text-red-700">
              ⚠ Resolve all {unresolvedConflicts} conflict(s) before submitting
            </p>
          )}
        </div>
      )}
    </div>
  )
}
