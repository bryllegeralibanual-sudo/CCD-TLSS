import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Menu, CalendarDays, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

// ─── Design tokens — inherit from Login's DNA ─────────────────────────────────
const FOREST   = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD     = '#D9B44A'
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  admin:        'Teacher-in-Charge',
  program_head: 'Program Head',
  registrar:    'Registrar',
  teacher:      'Faculty',
}

const ROLE_BADGE_STYLE = {
  admin:        { bg: 'rgba(15,107,60,0.12)',  border: 'rgba(15,107,60,0.25)',  color: MID_GREEN  },
  program_head: { bg: 'rgba(217,180,74,0.12)', border: 'rgba(217,180,74,0.3)', color: '#9A7A1A'  },
  registrar:    { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.2)', color: '#1D4ED8'  },
  teacher:      { bg: 'rgba(107,114,128,0.10)',border: 'rgba(107,114,128,0.2)',color: '#374151'  },
}

const AY_OPTIONS  = ['2024-2025', '2025-2026', '2026-2027']
const SEM_OPTIONS = [
  { value: '1st',    label: '1st Semester'  },
  { value: '2nd',    label: '2nd Semester'  },
  { value: 'Summer', label: 'Summer Class'  },
]

const initials = (n = '') =>
  n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

// ── Styled native <select> wrapper ──────────────────────────────────────────
function TermSelect({ value, onChange, options, prefix }) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={onChange}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'rgba(3,56,38,0.06)',
          border: '1px solid rgba(3,56,38,0.14)',
          borderRadius: 8,
          color: FOREST,
          fontSize: 12,
          fontWeight: 600,
          padding: '5px 28px 5px 10px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.background = 'rgba(217,180,74,0.07)' }}
        onBlur={e  => { e.target.style.borderColor = 'rgba(3,56,38,0.14)'; e.target.style.background = 'rgba(3,56,38,0.06)' }}
      >
        {options.map(o =>
          typeof o === 'string'
            ? <option key={o} value={o}>{prefix}{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <ChevronDown
        size={12}
        style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: FOREST, opacity: 0.5 }}
      />
    </div>
  )
}

export default function Topbar({ title, onMenuClick }) {
  const { account } = useAuth()
  const { term, setTerm, isTermFinalized } = useData()

  const canEditTerm = account.role === 'admin' || account.role === 'registrar'
  const finalized   = isTermFinalized(term.ay, term.sem)
  const badge       = ROLE_BADGE_STYLE[account.role] || ROLE_BADGE_STYLE.teacher
  const semLabel    = SEM_OPTIONS.find(s => s.value === term.sem)?.label ?? term.sem

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 20px',
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid rgba(3,56,38,0.10)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* ── Left: hamburger (mobile) + page title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Mobile menu toggle — passed in from AppLayout */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="lg:hidden"
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid rgba(3,56,38,0.12)',
              background: 'rgba(3,56,38,0.04)',
              cursor: 'pointer',
              color: FOREST,
              flexShrink: 0,
            }}
          >
            <Menu size={16} />
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          {/* Gold left-rule accent + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: 16,
                borderRadius: 2,
                background: GOLD,
                flexShrink: 0,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: FOREST,
                fontFamily: "'EB Garamond', Georgia, serif",
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Finalized pill — only shows when term is locked */}
          {finalized && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
                padding: '1px 7px',
                borderRadius: 99,
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <CheckCircle2 size={10} style={{ color: '#059669' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', letterSpacing: '0.03em' }}>
                Term finalized
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: term selectors + user chip ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* Term context */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px 4px 8px',
            borderRadius: 10,
            background: 'rgba(3,56,38,0.04)',
            border: '1px solid rgba(3,56,38,0.09)',
          }}
        >
          <CalendarDays size={13} style={{ color: MID_GREEN, flexShrink: 0 }} />

          {canEditTerm ? (
            <>
              <TermSelect
                value={term.ay}
                onChange={e => setTerm(t => ({ ...t, ay: e.target.value }))}
                options={AY_OPTIONS}
                prefix="AY "
              />
              <span style={{ color: 'rgba(3,56,38,0.25)', fontSize: 12 }}>·</span>
              <TermSelect
                value={term.sem}
                onChange={e => setTerm(t => ({ ...t, sem: e.target.value }))}
                options={SEM_OPTIONS}
              />
            </>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: FOREST }}>
              AY {term.ay} · {semLabel}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(3,56,38,0.10)' }} />

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${FOREST}, ${MID_GREEN})`,
              boxShadow: `0 0 0 2px ${GOLD}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
              letterSpacing: '0.05em',
            }}
          >
            {initials(account.name)}
          </div>

          {/* Name + role badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: FOREST,
                lineHeight: 1,
                maxWidth: 140,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {account.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 99,
                lineHeight: 1.4,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.color,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {ROLE_LABELS[account.role] || account.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}