import { ChevronDown, Menu, CalendarDays, CheckCircle2, Sun, Moon } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import { useTheme } from '../context/ThemeContext'
import NotificationCenter from './NotificationCenter'

const FOREST    = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD      = '#D9B44A'

const ROLE_LABELS = {
  admin:        'Teacher-in-Charge',
  program_head: 'Program Head',
  registrar:    'Registrar',
  teacher:      'Faculty',
}

const ROLE_BADGE = {
  admin:        { bg: 'rgba(15,107,60,0.12)',  border: 'rgba(15,107,60,0.25)',  color: MID_GREEN  },
  program_head: { bg: 'rgba(217,180,74,0.12)', border: 'rgba(217,180,74,0.30)', color: '#9A7A1A'  },
  registrar:    { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)', color: '#1D4ED8'  },
  teacher:      { bg: 'rgba(107,114,128,0.10)',border: 'rgba(107,114,128,0.2)', color: '#374151'  },
}

const AY_OPTIONS  = ['2024-2025', '2025-2026', '2026-2027']
const SEM_OPTIONS = [
  { value: '1st',    label: '1st Semester' },
  { value: '2nd',    label: '2nd Semester' },
  { value: 'Summer', label: 'Summer Class' },
]

const initials = (n = '') =>
  n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

function TermSelect({ value, onChange, options, prefix, dark }) {
  return (
    <div className="relative flex items-center">
      <select value={value} onChange={onChange} style={{
        appearance: 'none', WebkitAppearance: 'none',
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(3,56,38,0.06)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(3,56,38,0.14)'}`,
        borderRadius: 8,
        color: dark ? '#d1fae5' : FOREST,
        fontSize: 12, fontWeight: 600,
        padding: '5px 28px 5px 10px',
        cursor: 'pointer', outline: 'none',
        transition: 'border-color 0.15s, background 0.15s',
      }}
        onFocus={e  => { e.target.style.borderColor = GOLD; e.target.style.background = 'rgba(217,180,74,0.10)' }}
        onBlur={e   => { e.target.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(3,56,38,0.14)'; e.target.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(3,56,38,0.06)' }}
      >
        {options.map(o =>
          typeof o === 'string'
            ? <option key={o} value={o}>{prefix}{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: dark ? 'rgba(209,250,229,0.5)' : FOREST, opacity: 0.5 }} />
    </div>
  )
}

export default function Topbar({ title, onMenuClick }) {
  const { account }            = useAuth()
  const { term, setTerm, isTermFinalized, getCriticalAlerts, termAssignments } = useData()
  const { dark, setDark }      = useTheme()

  const canEditTerm = account.role === 'admin' || account.role === 'registrar'
  const finalized   = isTermFinalized(term.ay, term.sem)
  const badge       = ROLE_BADGE[account.role] || ROLE_BADGE.teacher
  const semLabel    = SEM_OPTIONS.find(s => s.value === term.sem)?.label ?? term.sem

  const bg     = dark ? '#0F1C16' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(3,56,38,0.10)'
  const text   = dark ? '#d1fae5' : FOREST

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '0 20px', height: 56,
      background: bg, borderBottom: `1px solid ${border}`,
      position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
      transition: 'background 0.3s, border-color 0.3s',
    }}>

      {/* LEFT: hamburger + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {onMenuClick && (
          <button onClick={onMenuClick} aria-label="Open navigation" className="lg:hidden"
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: `1px solid ${border}`, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(3,56,38,0.04)',
              cursor: 'pointer', color: text, flexShrink: 0 }}>
            <Menu size={16} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text,
              fontFamily: "'EB Garamond', Georgia, serif", letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </h1>
          </div>
          {finalized && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2,
              padding: '1px 7px', borderRadius: 99,
              background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle2 size={10} style={{ color: '#059669' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', letterSpacing: '0.03em' }}>Term finalized</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: term + dark toggle + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* Term context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 8px',
          borderRadius: 10, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(3,56,38,0.04)',
          border: `1px solid ${border}` }}>
          <CalendarDays size={13} style={{ color: MID_GREEN, flexShrink: 0 }} />
          {canEditTerm ? (
            <>
              <TermSelect dark={dark} value={term.ay} onChange={e => setTerm(t => ({ ...t, ay: e.target.value }))} options={AY_OPTIONS} prefix="AY " />
              <span style={{ color: dark ? 'rgba(209,250,229,0.25)' : 'rgba(3,56,38,0.25)', fontSize: 12 }}>·</span>
              <TermSelect dark={dark} value={term.sem} onChange={e => setTerm(t => ({ ...t, sem: e.target.value }))} options={SEM_OPTIONS} />
            </>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: text }}>AY {term.ay} · {semLabel}</span>
          )}
        </div>

        {/* Dark mode toggle */}
        <NotificationCenter 
          dark={dark} 
          term={term}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 10,
          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(3,56,38,0.06)',
          border: `1px solid ${border}` }}>
          {[{ v: false, Icon: Sun }, { v: true, Icon: Moon }].map(({ v, Icon }) => (
            <button key={String(v)} onClick={() => setDark(v)} aria-label={v ? 'Dark mode' : 'Light mode'}
              style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
                background: dark === v
                  ? (v ? 'rgba(15,107,60,0.5)' : 'rgba(255,255,255,0.9)')
                  : 'transparent',
                color: dark === v
                  ? (v ? '#6ee7b7' : FOREST)
                  : (dark ? 'rgba(209,250,229,0.35)' : 'rgba(3,56,38,0.35)'),
                boxShadow: dark === v && !v ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              }}>
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: border }} />

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg, ${FOREST}, ${MID_GREEN})`,
            boxShadow: `0 0 0 2px ${GOLD}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '0.05em' }}>
            {initials(account.name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: text, lineHeight: 1,
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {account.name}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99,
              lineHeight: 1.4, background: badge.bg, border: `1px solid ${badge.border}`,
              color: badge.color, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {ROLE_LABELS[account.role] || account.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
