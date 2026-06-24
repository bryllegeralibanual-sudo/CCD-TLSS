import { useMemo, useState } from 'react'
import { BookOpen, Filter, GraduationCap, Search } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { useAuth } from '../../auth/AuthContext'
import { PROGRAMS, SEM_LABELS, YEAR_LABELS, programLabel } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-emerald-900/10 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950/45">{label}</p>
      <p className="mt-1 text-2xl font-extrabold leading-none" style={{ color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>{value}</p>
    </div>
  )
}

export default function CurriculumPage() {
  const { subjects } = useData()
  const { account } = useAuth()
  const isHeadView = account?.role === 'program_head'
  const headPrograms = account?.programs || []
  
  const [program, setProgram] = useState(isHeadView ? (headPrograms[0] || PROGRAMS[0].code) : PROGRAMS[0].code)
  const [sem, setSem] = useState('ALL')
  const [year, setYear] = useState('ALL')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return subjects
      .filter(s => s.prog === program)
      .filter(s => sem === 'ALL' || s.sem === sem)
      .filter(s => year === 'ALL' || s.yr === Number(year))
      .filter(s => !q || `${s.code} ${s.title} ${s.prereq || ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.yr - b.yr || String(a.sem).localeCompare(String(b.sem)) || a.code.localeCompare(b.code))
  }, [program, query, sem, subjects, year])

  const summary = useMemo(() => {
    const list = subjects.filter(s => s.prog === program)
    return {
      total: list.length,
      lec: list.reduce((sum, s) => sum + (s.lec || 0), 0),
      lab: list.reduce((sum, s) => sum + (s.lab || 0), 0),
      labs: new Set(list.map(s => s.labRoomType).filter(Boolean)).size,
    }
  }, [program, subjects])

  const grouped = useMemo(() => {
    const out = new Map()
    filtered.forEach(subject => {
      const key = `${subject.yr}|${subject.sem}`
      if (!out.has(key)) out.set(key, [])
      out.get(key).push(subject)
    })
    return Array.from(out.entries())
  }, [filtered])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <BookOpen size={19} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>Curriculum Prospectus</p>
            <p className="mt-0.5 text-xs text-emerald-100/70">{programLabel(program)} subject map by year and semester</p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-4">
          <Stat label="Subjects" value={summary.total} />
          <Stat label="Lecture Units" value={summary.lec} />
          <Stat label="Lab Units" value={summary.lab} />
          <Stat label="Lab Types" value={summary.labs} />
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-emerald-950/10 p-4">
          {!isHeadView && (
            <div className="min-w-56 flex-1">
              <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-emerald-950/50">Program</label>
              <select value={program} onChange={e => setProgram(e.target.value)} className="w-full rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
                {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-emerald-950/50">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
              <option value="ALL">All years</option>
              {[1, 2, 3, 4].map(y => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-emerald-950/50">Semester</label>
            <select value={sem} onChange={e => setSem(e.target.value)} className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.03] px-3 py-2 text-sm font-bold text-emerald-950 outline-none">
              <option value="ALL">All semesters</option>
              {Object.entries(SEM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="relative min-w-64 flex-1">
            <Search size={14} className="absolute left-3 top-3 text-emerald-950/35" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search code, title, prerequisite" className="w-full rounded-xl border border-emerald-950/15 bg-white py-2 pl-9 pr-3 text-sm text-emerald-950 outline-none" />
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-10 text-center">
          <Filter size={26} className="mx-auto text-emerald-700/40" />
          <p className="mt-2 text-sm font-bold text-emerald-950/50">No prospectus subjects match the current filters.</p>
        </div>
      ) : grouped.map(([key, items]) => {
        const [yr, semester] = key.split('|')
        const units = items.reduce((sum, s) => sum + (s.lec || 0) + (s.lab || 0), 0)
        return (
          <section key={key} className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} style={{ color: MID_GREEN }} />
                <h2 className="text-sm font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>{YEAR_LABELS[yr]} - {SEM_LABELS[semester] || semester}</h2>
              </div>
              <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ color: FOREST, background: `${GOLD}24` }}>{items.length} subjects - {units} units</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-emerald-950/[0.04] text-[11px] uppercase tracking-wider text-emerald-950/50">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Descriptive Title</th>
                    <th className="px-4 py-3">Lec</th>
                    <th className="px-4 py-3">Lab</th>
                    <th className="px-4 py-3">Prerequisite</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(subject => (
                    <tr key={subject.id} className="border-t border-emerald-950/10">
                      <td className="px-4 py-3 font-black text-emerald-950">{subject.code}</td>
                      <td className="px-4 py-3 text-emerald-950/75">{subject.title}</td>
                      <td className="px-4 py-3 font-bold text-emerald-950/70">{subject.lec || 0}</td>
                      <td className="px-4 py-3 font-bold text-emerald-950/70">{subject.lab || 0}</td>
                      <td className="px-4 py-3 text-xs text-emerald-950/50">{subject.prereq || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
