import { useMemo, useState } from 'react'
import { AlertTriangle, Building2, Clock3, DoorOpen, FlaskConical, Plus, Search } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'
const OPEN = 450
const CLOSE = 1290
const SLOT = 30
const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ALL_DAYS = [...CLASS_DAYS, 'Saturday']
const HOUR_OPTIONS = Array.from({ length: ((CLOSE - OPEN) / 60) }, (_, index) => OPEN + (index * 60))

const EMPTY = { name: '', type: 'Classroom', capacity: 45, prog: '', status: 'Active', features: '' }

function timeLabel(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function overlaps(a, b) {
  return a.day === b.day && a.start < b.end && b.start < a.end
}

export default function RoomsLabsPage() {
  const { rooms, upsertRoom, subjects, term, savedScheduleForTerm } = useData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('ALL')
  const [program, setProgram] = useState('ALL')
  const [occupancyDay, setOccupancyDay] = useState('Monday')
  const [occupancyRoom, setOccupancyRoom] = useState('ALL')
  const [form, setForm] = useState(EMPTY)

  const roomTypes = useMemo(() => Array.from(new Set([...rooms.map(r => r.type), ...subjects.flatMap(s => [s.lecRoomType, s.labRoomType]).filter(Boolean)])).sort(), [rooms, subjects])
  const requiredTypes = useMemo(() => {
    const map = new Map()
    subjects.forEach(s => [s.lecRoomType, s.labRoomType].filter(Boolean).forEach(t => map.set(t, (map.get(t) || 0) + 1)))
    return map
  }, [subjects])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rooms
      .filter(r => type === 'ALL' || r.type === type)
      .filter(r => program === 'ALL' || r.prog === program || (!r.prog && program === 'SHARED'))
      .filter(r => !q || `${r.name} ${r.type} ${r.prog} ${r.features || ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  }, [program, query, rooms, type])

  const missingTypes = roomTypes.filter(t => (requiredTypes.get(t) || 0) > 0 && !rooms.some(r => r.type === t && r.status !== 'Inactive'))
  const labs = rooms.filter(r => /lab/i.test(r.type)).length
  const totalCapacity = rooms.reduce((sum, r) => sum + Number(r.capacity || 0), 0)
  const savedSchedule = savedScheduleForTerm(term.ay, term.sem)
  const scheduleRows = savedSchedule?.scheduled || []

  const occupancyMap = useMemo(() => {
    const activeDays = Array.from(new Set(scheduleRows.map((row) => row.day))).filter(Boolean)
    const days = activeDays.length ? activeDays : CLASS_DAYS
    const totalSlots = days.length * ((CLOSE - OPEN) / SLOT)

    return rooms.reduce((acc, room) => {
      const roomRows = scheduleRows.filter((row) => String(row.room?.id) === String(room.id))
      const usedSlots = roomRows.reduce((sum, row) => sum + (row.end - row.start) / SLOT, 0)
      const rate = totalSlots ? usedSlots / totalSlots : 0
      let state = 'vacant'
      if (usedSlots > 0 && rate >= 0.75) state = 'fully-occupied'
      else if (usedSlots > 0) state = 'occupied'
      acc[room.id] = { state, rate, usedSlots, totalSlots }
      return acc
    }, {})
  }, [rooms, scheduleRows])

  const occupancySummary = useMemo(() => {
    return Object.values(occupancyMap).reduce((acc, item) => {
      if (item.state === 'fully-occupied') acc.fullyOccupied += 1
      else if (item.state === 'occupied') acc.occupied += 1
      else acc.vacant += 1
      return acc
    }, { vacant: 0, occupied: 0, fullyOccupied: 0 })
  }, [occupancyMap])

  const occupancyRooms = useMemo(() => {
    return visible
      .filter(room => room.status !== 'Inactive')
      .filter(room => occupancyRoom === 'ALL' || String(room.id) === String(occupancyRoom))
  }, [occupancyRoom, visible])

  const vacancySuggestions = useMemo(() => {
    return occupancyRooms.flatMap(room => {
      const roomRows = scheduleRows.filter(row => String(row.room?.id) === String(room.id))
      const blocks = []
      let blockStart = null
      HOUR_OPTIONS.forEach(start => {
        const candidate = { day: occupancyDay, start, end: start + 60 }
        const isVacant = !roomRows.some(row => overlaps(row, candidate))
        if (isVacant && blockStart === null) blockStart = start
        if ((!isVacant || start === HOUR_OPTIONS[HOUR_OPTIONS.length - 1]) && blockStart !== null) {
          const blockEnd = isVacant && start === HOUR_OPTIONS[HOUR_OPTIONS.length - 1] ? start + 60 : start
          if (blockEnd - blockStart >= 120) blocks.push({ room, start: blockStart, end: blockEnd })
          blockStart = null
        }
      })
      return blocks
    }).sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.room.name.localeCompare(b.room.name)).slice(0, 6)
  }, [occupancyDay, occupancyRooms, scheduleRows])

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    upsertRoom({ ...form, features: form.features.split(',').map(v => v.trim()).filter(Boolean).join(', ') })
    setForm(EMPTY)
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Building2 size={19} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Rooms and Labs</p>
              <p className="mt-0.5 text-xs text-emerald-100/70">Capacity, program ownership, equipment notes, and scheduling readiness</p>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Spaces</p><p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{rooms.length}</p></div>
            <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Labs</p><p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{labs}</p></div>
            <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Capacity</p><p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{totalCapacity}</p></div>
            <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Missing Types</p><p className="mt-1 text-2xl font-black text-red-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{missingTypes.length}</p></div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-emerald-950/10 p-4">
            <select value={type} onChange={e => setType(e.target.value)} className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
              <option value="ALL">All types</option>
              {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={program} onChange={e => setProgram(e.target.value)} className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
              <option value="ALL">All ownership</option>
              <option value="SHARED">Shared rooms</option>
              {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
            <div className="relative min-w-64 flex-1">
              <Search size={14} className="absolute left-3 top-3 text-emerald-950/35" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search room, lab, equipment" className="w-full rounded-xl border border-emerald-950/15 bg-white py-2 pl-9 pr-3 text-sm text-emerald-950 outline-none" />
            </div>
          </div>
        </div>

        {missingTypes.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-amber-800"><AlertTriangle size={15} /> Required room types without active rooms</p>
            <p className="mt-1 text-xs font-semibold text-amber-800/75">{missingTypes.join(', ')}</p>
          </div>
        )}

        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-950/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-emerald-950">Current term occupancy</p>
              <p className="text-xs font-semibold text-emerald-950/55">Vacant rooms are easy to spot, while heavily used spaces show as fully occupied.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-black">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">Vacant: {occupancySummary.vacant}</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">Occupied: {occupancySummary.occupied}</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-800">Fully occupied: {occupancySummary.fullyOccupied}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/10 p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-black text-emerald-950"><Clock3 size={15} /> Occupancy by day and hour</p>
              <p className="mt-1 text-xs font-semibold text-emerald-950/55">Green cells are vacant. Red cells show the class using the room.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={occupancyDay} onChange={e => setOccupancyDay(e.target.value)} className="rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">
                {ALL_DAYS.map(day => <option key={day}>{day}</option>)}
              </select>
              <select value={occupancyRoom} onChange={e => setOccupancyRoom(e.target.value)} className="rounded-lg border border-emerald-950/15 px-3 py-2 text-xs font-black text-emerald-950">
                <option value="ALL">All visible rooms</option>
                {visible.filter(room => room.status !== 'Inactive').map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
              <thead className="bg-emerald-950/[0.04] text-[10px] uppercase text-emerald-950/50">
                <tr>
                  <th className="sticky left-0 z-10 min-w-44 border-b border-r border-emerald-950/10 bg-emerald-50 px-3 py-2">Room</th>
                  {HOUR_OPTIONS.map(hour => <th key={hour} className="min-w-28 border-b border-r border-emerald-950/10 px-2 py-2">{timeLabel(hour)}</th>)}
                </tr>
              </thead>
              <tbody>
                {occupancyRooms.map(room => {
                  const roomRows = scheduleRows.filter(row => String(row.room?.id) === String(room.id))
                  return (
                    <tr key={room.id}>
                      <td className="sticky left-0 z-10 border-b border-r border-emerald-950/10 bg-white px-3 py-2">
                        <p className="font-black text-emerald-950">{room.name}</p>
                        <p className="mt-0.5 font-semibold text-emerald-950/45">{room.type}</p>
                      </td>
                      {HOUR_OPTIONS.map(hour => {
                        const cell = { day: occupancyDay, start: hour, end: hour + 60 }
                        const booking = roomRows.find(row => overlaps(row, cell))
                        return (
                          <td key={hour} className="border-b border-r border-emerald-950/10 p-1.5 align-top">
                            {booking ? (
                              <div className="min-h-12 rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
                                <p className="truncate font-black">{booking.subject?.code}</p>
                                <p className="mt-0.5 truncate font-semibold">{booking.assignment?.section}</p>
                                <p className="mt-0.5 font-semibold opacity-75">{timeLabel(booking.start)}-{timeLabel(booking.end)}</p>
                              </div>
                            ) : (
                              <div className="flex min-h-12 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 font-black text-emerald-700">Vacant</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {occupancyRooms.length === 0 && (
                  <tr><td colSpan={HOUR_OPTIONS.length + 1} className="px-4 py-8 text-center text-sm font-bold text-emerald-950/45">No active rooms match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-emerald-950/10 p-4">
            <p className="text-xs font-black uppercase text-emerald-950/45">Best vacancy blocks on {occupancyDay}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {vacancySuggestions.map(item => (
                <div key={`${item.room.id}-${item.start}-${item.end}`} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-black text-emerald-950">{item.room.name}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-800">{timeLabel(item.start)} - {timeLabel(item.end)}</p>
                  <p className="mt-1 text-[10px] font-black uppercase text-emerald-700/60">{Math.round((item.end - item.start) / 60)} hr open block</p>
                </div>
              ))}
              {vacancySuggestions.length === 0 && <p className="text-xs font-semibold text-emerald-950/50">No 2-hour vacant block found for the current filters.</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {visible.map(room => {
            const demand = requiredTypes.get(room.type) || 0
            const occupancy = occupancyMap[room.id] || { state: 'vacant', rate: 0, usedSlots: 0, totalSlots: 0 }
            const statusTone = occupancy.state === 'fully-occupied'
              ? 'bg-red-100 text-red-800'
              : occupancy.state === 'occupied'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            const statusLabel = occupancy.state === 'fully-occupied'
              ? 'Fully occupied'
              : occupancy.state === 'occupied'
                ? 'Occupied'
                : 'Vacant'
            return (
              <article key={room.id} className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: /lab/i.test(room.type) ? `${GOLD}24` : 'rgba(15,107,60,0.09)' }}>
                    {/lab/i.test(room.type) ? <FlaskConical size={20} style={{ color: '#92620A' }} /> : <DoorOpen size={20} style={{ color: MID_GREEN }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-emerald-950">{room.name}</p>
                    <p className="mt-1 text-xs font-bold text-emerald-950/55">{room.type} - {room.capacity} seats</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${room.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{room.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusTone}`}>{statusLabel}</span>
                  <span className="rounded-full bg-emerald-950/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-950/65">{occupancy.usedSlots > 0 ? `${Math.round(occupancy.rate * 100)}% booked` : 'No classes yet'}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950/[0.08]">
                  <div className={`h-full rounded-full ${occupancy.state === 'fully-occupied' ? 'bg-red-500' : occupancy.state === 'occupied' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(6, occupancy.rate * 100))}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-950/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-950/65">{room.prog ? programLabel(room.prog) : 'Shared'}</span>
                </div>
                <p className="mt-3 min-h-8 text-xs font-semibold text-emerald-950/50">{room.features || 'No equipment notes yet.'}</p>
              </article>
            )
          })}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}><Plus size={15} /> Add Room or Lab</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Room name" className="rounded-xl border border-emerald-950/15 px-3 py-2 text-sm outline-none" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
            {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" min="0" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Capacity" className="rounded-xl border border-emerald-950/15 px-3 py-2 text-sm outline-none" />
          <select value={form.prog} onChange={e => setForm({ ...form, prog: e.target.value })} className="rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
            <option value="">Shared</option>
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-emerald-950/15 px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
            <option>Active</option>
            <option>Maintenance</option>
            <option>Inactive</option>
          </select>
          <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="Equipment notes, comma separated" rows={4} className="resize-none rounded-xl border border-emerald-950/15 px-3 py-2 text-sm outline-none" />
          <button type="submit" className="rounded-xl px-3 py-2 text-sm font-black text-white" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>Save Space</button>
        </form>
      </aside>
    </div>
  )
}
