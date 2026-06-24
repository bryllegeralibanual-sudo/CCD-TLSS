import {
  ShieldCheck, Lock, Unlock, AlertTriangle, CheckCircle2, BookOpen,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'
import StatusBadge from '../../components/StatusBadge'

// ─── Design tokens ────────────────────────────────────────────────────────────
const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(3,56,38,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: MID_GREEN }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  )
}

// Mini stat card for the program summary
function ProgramRow({ prog, data, total }) {
  const approved = data?.approved || 0
  const pending  = data?.pending  || 0
  const rejected = data?.rejected || 0
  const pct      = total > 0 ? Math.round((approved / total) * 100) : 0
  const allDone  = total > 0 && pending === 0

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 12,
      border: `1.5px solid ${allDone ? 'rgba(16,185,129,0.22)' : 'rgba(3,56,38,0.10)'}`,
      background: allDone ? 'rgba(16,185,129,0.04)' : 'rgba(3,56,38,0.025)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: FOREST }}>{prog.label}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 2 }}>{prog.name}</p>
        </div>
        {allDone
          ? <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
          : pending > 0
            ? <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, padding: '2px 8px' }}>{pending} pending</span>
            : null
        }
      </div>
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(3,56,38,0.45)' }}>{approved} approved of {total}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#059669' : MID_GREEN }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 99,
            background: pct === 100
              ? 'linear-gradient(90deg,#059669,#10B981)'
              : `linear-gradient(90deg,${FOREST},${MID_GREEN})`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        {rejected > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#DC2626' }}>{rejected} rejected</p>
        )}
      </div>
    </div>
  )
}

export default function RegistrarPage() {
  const { account } = useAuth()
  const {
    term, isTermFinalized,
    registrarSummary, getFinalizeBlockers,
    finalizeTerm, reopenTerm,
    termAssignments, subjectsById, facultyById,
  } = useData()

  const finalized  = isTermFinalized(term.ay, term.sem)
  const summary    = registrarSummary(term.ay, term.sem)
  const blockers   = getFinalizeBlockers(term.ay, term.sem)
  const allForTerm = termAssignments(term.ay, term.sem)
  const semLabel   = term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'
  const canFinalize = blockers.length === 0 && !finalized

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Status + finalize card ──────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        {/* Green header band */}
        <div style={{
          background: finalized
            ? 'linear-gradient(105deg,#065F46 0%,#059669 100%)'
            : `linear-gradient(105deg,${FOREST} 0%,${MID_GREEN} 100%)`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.05, pointerEvents: 'none' }} />
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {finalized ? <Lock size={16} style={{ color: '#fff' }} /> : <ShieldCheck size={16} style={{ color: '#fff' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif", letterSpacing: '-0.01em' }}>
              {finalized ? 'Term Finalized' : 'Finalize Term'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(220,252,231,0.65)', marginTop: 1 }}>
              AY {term.ay} · {semLabel} Semester
            </p>
          </div>

          {/* Finalize / Reopen button lives in the header */}
          {finalized ? (
            <button
              onClick={() => reopenTerm(term.ay, term.sem)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 9,
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.3)',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <Unlock size={13} /> Reopen term
            </button>
          ) : (
            <button
              onClick={() => finalizeTerm(term.ay, term.sem, account)}
              disabled={!canFinalize}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 9,
                fontSize: 12, fontWeight: 700,
                cursor: canFinalize ? 'pointer' : 'not-allowed',
                background: canFinalize
                  ? `linear-gradient(105deg,${GOLD} 0%,#C9A030 100%)`
                  : 'rgba(255,255,255,0.12)',
                color: canFinalize ? FOREST : 'rgba(255,255,255,0.35)',
                border: 'none',
                boxShadow: canFinalize ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <Lock size={13} /> Finalize term
            </button>
          )}
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Finalized success banner */}
          {finalized && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#065F46' }}>
                  All loads are locked for AY {term.ay} {semLabel} Semester.
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#047857' }}>
                  The schedule can now be generated in the Scheduler. Reopen the term to make further changes.
                </p>
              </div>
            </div>
          )}

          {/* Blockers */}
          {!finalized && blockers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {blockers.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 9, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <AlertTriangle size={13} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>{b}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ready state */}
          {!finalized && blockers.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(3,56,38,0.05)', border: '1px solid rgba(3,56,38,0.12)' }}>
              <CheckCircle2 size={14} style={{ color: MID_GREEN, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: FOREST }}>
                Every submitted load this term has been approved by the Program Heads. Ready to finalize.
              </p>
            </div>
          )}

          {/* Program progress grid */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Program Status
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {PROGRAMS.map(p => {
                const data  = summary[p.code] || {}
                const total = (data.pending || 0) + (data.approved || 0) + (data.rejected || 0)
                return <ProgramRow key={p.code} prog={p} data={data} total={total} />
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── All assignments table ───────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: allForTerm.length > 0 ? '1px solid rgba(3,56,38,0.08)' : 'none' }}>
          <SectionHeader
            icon={BookOpen}
            title="All Submitted Loads This Term"
            sub={`${allForTerm.length} assignments · ${allForTerm.filter(a => a.status === 'approved').length} approved`}
          />
        </div>

        {allForTerm.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: 8 }}>
            <BookOpen size={28} style={{ color: 'rgba(3,56,38,0.15)' }} />
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(3,56,38,0.35)', fontWeight: 500 }}>No loads submitted yet for this term.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(3,56,38,0.03)', borderBottom: '1px solid rgba(3,56,38,0.08)' }}>
                  {['Subject', 'Section', 'Faculty', 'Status'].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allForTerm.map((a, idx) => {
                  const subj = subjectsById[a.subjectId]
                  const fac  = facultyById[a.facultyId]
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: idx < allForTerm.length - 1 ? '1px solid rgba(3,56,38,0.06)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,180,74,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: FOREST }}>{subj?.code}</span>
                        <span style={{ color: 'rgba(3,56,38,0.5)', marginLeft: 5, fontSize: 12 }}>{subj?.title}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'rgba(3,56,38,0.65)', whiteSpace: 'nowrap' }}>
                        {a.section}
                        <span style={{ color: 'rgba(3,56,38,0.35)', fontSize: 11, marginLeft: 4 }}>({programLabel(subj?.prog)})</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: FOREST, whiteSpace: 'nowrap' }}>
                        {fac?.fn} {fac?.ln}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}