import { useMemo, useState } from 'react'
import { AlertTriangle, Building2, DoorOpen, FlaskConical, Plus, Search } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

const EMPTY = { name: '', type: 'Classroom', capacity: 45, prog: '', status: 'Active', features: '' }

export default function RoomsLabsPage() {
  const { rooms, upsertRoom, subjects } = useData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('ALL')
  const [program, setProgram] = useState('ALL')
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

        <div className="grid gap-3 md:grid-cols-2">
          {visible.map(room => {
            const demand = requiredTypes.get(room.type) || 0
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
                  <span className="rounded-full bg-emerald-950/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-950/65">{room.prog ? programLabel(room.prog) : 'Shared'}</span>
                  <span className="rounded-full bg-emerald-950/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-950/65">{demand} subject requirements</span>
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
