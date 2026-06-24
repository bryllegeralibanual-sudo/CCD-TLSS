import { useMemo, useState } from 'react'
import { AlertTriangle, Camera, Mail, Search, Users } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'
import { getFacultyMaxUnits, getFacultyUnits } from '../../data/validation'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function initials(faculty) {
  return `${faculty.fn?.[0] || ''}${faculty.ln?.[0] || ''}`.toUpperCase()
}

function avatarUrl(faculty) {
  return faculty.photo || faculty.picture || faculty.image || ''
}

function LoadBar({ used, max }) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0
  const color = used > max ? '#DC2626' : pct >= 85 ? '#D97706' : MID_GREEN
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-extrabold text-emerald-950/60">Current load</span>
        <span className="font-black" style={{ color }}>{used}/{max} units</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-950/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function FacultyPage() {
  const { term, faculty, assignments, subjectsById } = useData()
  const [program, setProgram] = useState('ALL')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faculty
      .map(f => {
        const used = getFacultyUnits(assignments, subjectsById, f.id, term.sem)
        const max = getFacultyMaxUnits(f)
        const current = assignments
          .filter(a => a.facultyId === f.id && a.ay === term.ay && a.status !== 'withdrawn' && subjectsById[a.subjectId]?.sem === term.sem)
          .map(a => ({ ...a, subject: subjectsById[a.subjectId] }))
        return { ...f, used, max, current }
      })
      .filter(f => program === 'ALL' || f.prog === program || (f.shared || []).includes(program))
      .filter(f => !q || `${f.fn} ${f.ln} ${f.email} ${f.spec} ${f.prog}`.toLowerCase().includes(q))
      .sort((a, b) => programLabel(a.prog).localeCompare(programLabel(b.prog)) || a.ln.localeCompare(b.ln))
  }, [assignments, faculty, program, query, subjectsById, term.ay, term.sem])

  const byProgram = useMemo(() => {
    const groups = new Map()
    rows.forEach(f => {
      const key = f.prog || 'Unassigned'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(f)
    })
    return Array.from(groups.entries())
  }, [rows])

  const overloaded = rows.filter(f => f.used > f.max).length
  const nearCapacity = rows.filter(f => f.used <= f.max && f.max && f.used / f.max >= 0.85).length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Users size={19} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Faculty Directory</p>
            <p className="mt-0.5 text-xs text-emerald-100/70">Specializations, program coverage, current teaching loads, and profile photos</p>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Faculty</p><p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{rows.length}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Overloaded</p><p className="mt-1 text-2xl font-black text-red-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{overloaded}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Near Capacity</p><p className="mt-1 text-2xl font-black text-amber-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{nearCapacity}</p></div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-emerald-950/45">Term</p><p className="mt-1 text-lg font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{term.sem}</p></div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-emerald-950/10 p-4">
          <select value={program} onChange={e => setProgram(e.target.value)} className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
            <option value="ALL">All programs</option>
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
          <div className="relative min-w-64 flex-1">
            <Search size={14} className="absolute left-3 top-3 text-emerald-950/35" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search faculty, email, specialization" className="w-full rounded-xl border border-emerald-950/15 bg-white py-2 pl-9 pr-3 text-sm text-emerald-950 outline-none" />
          </div>
        </div>
      </div>

      {byProgram.map(([code, people]) => (
        <section key={code} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{programLabel(code)}</h2>
            <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: `${GOLD}24`, color: FOREST }}>{people.length} faculty</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {people.map(f => {
              const img = avatarUrl(f)
              return (
                <article key={f.id} className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-emerald-900/10">
                      {img ? <img src={img} alt={`${f.fn} ${f.ln}`} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-black text-white" style={{ background: `linear-gradient(135deg, ${FOREST}, ${MID_GREEN})` }}>{initials(f)}</div>}
                      {!img && <Camera size={13} className="absolute bottom-1 right-1 text-white/75" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-emerald-950">{f.ln}, {f.fn}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-emerald-950/55">{f.spec || 'Specialization not set'}</p>
                      <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-emerald-950/45"><Mail size={11} /> {f.email}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <LoadBar used={f.used} max={f.max} />
                    {f.used > f.max && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-red-700"><AlertTriangle size={12} /> Over max load</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-emerald-950/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-950/65">{programLabel(f.prog)}</span>
                    {(f.shared || []).filter(p => p !== f.prog).map(p => <span key={p} className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">{programLabel(p)}</span>)}
                  </div>
                  <div className="mt-3 border-t border-emerald-950/10 pt-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-emerald-950/40">Current loads</p>
                    {f.current.length === 0 ? <p className="mt-1 text-xs font-semibold text-emerald-950/40">No active load this term.</p> : (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {f.current.slice(0, 3).map(a => <p key={a.id} className="truncate text-xs text-emerald-950/65"><span className="font-black">{a.subject?.code}</span> - {a.section}</p>)}
                        {f.current.length > 3 && <p className="text-xs font-bold text-emerald-700">+{f.current.length - 3} more</p>}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
