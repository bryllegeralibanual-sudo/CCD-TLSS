import { useState, useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Mail, Lock, Eye, EyeOff, Sun, Moon, ShieldCheck, Users, FileText, GraduationCap,
  CalendarCheck2, CalendarDays, CheckCircle2, User, BarChart3, LogIn, UserCheck,
  UserRound, Headset, ChevronRight, ChevronLeft, Loader2,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { roleHome } from '../auth/ProtectedRoute'
import btvtedCrest from '../assets/images/btvted-crest.png'
import ccdLogo from '../assets/images/ccd-logo.png'

// ─── UI UX Pro Max Skill Applied ──────────────────────────────────────────────
// Responsive: mobile-first, 375 / 768 / 1024 / 1280+ breakpoints
// Touch: 44px min tap targets, touch-action: manipulation, 8px+ spacing
// Motion: 150-300ms, prefers-reduced-motion, GPU-accelerated transforms only
// Forms: inline validation, loading state, success state
// A11y: focus rings, aria-labels, cursor-pointer, contrast 4.5:1
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_QUICK_ACCESS = [
  { role: 'admin',        label: 'Administrator', icon: ShieldCheck,   email: 'admin@ccd.edu.ph',           password: 'admin123'     },
  { role: 'program_head', label: 'Program Head',  icon: Users,         email: 'head.btvted@ccd.edu.ph',    password: 'head123'      },
  { role: 'registrar',    label: 'Registrar',     icon: FileText,      email: 'registrar@ccd.edu.ph',      password: 'registrar123' },
  { role: 'teacher',      label: 'Faculty',       icon: GraduationCap, email: 'romel.salazar@ccd.edu.ph',  password: 'teacher123'   },
]

const FEATURES = [
  { icon: User,           label: 'Smart Workload Distribution' },
  { icon: CalendarCheck2, label: 'Automated Scheduling'        },
  { icon: CheckCircle2,   label: 'Conflict Detection'          },
  { icon: GraduationCap,  label: 'Academic Planning'           },
  { icon: BarChart3,      label: 'Reports & Analytics'         },
]

const TRUST_BADGES = [
  { icon: Lock,       label: 'Secure Authentication' },
  { icon: UserCheck,  label: 'Role-Based Access'     },
  { icon: ShieldCheck,label: 'Data Protection'       },
]

// Live clock — ticks every second
function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// Viewport width hook for responsive logic
function useViewport() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// Intersection Observer reveal hook
function useReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, visible]
}

// Animated stat counter
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal(0.05)
  useEffect(() => {
    if (!visible) return
    const numTarget = parseInt(target)
    const steps = 36
    let current = 0
    const inc = numTarget / steps
    const id = setInterval(() => {
      current += inc
      if (current >= numTarget) { setCount(numTarget); clearInterval(id) }
      else setCount(Math.floor(current))
    }, 1100 / steps)
    return () => clearInterval(id)
  }, [visible, target])
  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar() {
  const now        = new Date()
  const year       = now.getFullYear()
  const month      = now.getMonth()
  const todayDate  = now.getDate()
  const monthName  = now.toLocaleString('en-PH', { month: 'long' }).toUpperCase()
  const firstDay   = new Date(year, month, 1).getDay()
  const totalDays  = new Date(year, month + 1, 0).getDate()
  const days       = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const cells      = [...Array(firstDay).fill(null), ...Array.from({length: totalDays}, (_,i) => i+1)]

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      width: 196, background: 'rgba(255,255,255,0.97)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer" aria-label="Previous month">
          <ChevronLeft size={13} />
        </button>
        <span className="text-xs font-bold text-gray-700 tracking-wider">{monthName} {year}</span>
        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer" aria-label="Next month">
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-7 px-2 pt-1.5 pb-0.5">
        {days.map(d => <div key={d} className="text-center text-gray-400 font-semibold" style={{ fontSize: 7.5 }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 px-2 pb-2.5 gap-y-0.5">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center rounded-full" style={{
            height: 22, fontSize: 10,
            fontWeight: d === todayDate ? 700 : 400,
            color:  d === todayDate ? '#fff' : d ? '#374151' : 'transparent',
            background: d === todayDate ? '#16a34a' : 'transparent',
          }}>{d || ''}</div>
        ))}
      </div>
    </div>
  )
}

// ── Semester Overview Card ─────────────────────────────────────────────────────
function SemesterCard({ compact = false }) {
  const stats = [
    { icon: Users,         value: '120', suffix: '+', label: 'Faculty Members'     },
    { icon: CalendarDays,  value: '350', suffix: '+', label: 'Classes Scheduled'   },
    { icon: BarChart3,     value: '96',  suffix: '%', label: 'Faculty Availability'},
    { icon: GraduationCap, value: '12',  suffix: '',  label: 'Academic Programs'   },
  ]
  return (
    <div className="rounded-2xl p-4" style={{
      background: 'rgba(255,255,255,0.97)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
      backdropFilter: 'blur(12px)',
      minWidth: compact ? 200 : 240,
    }}>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">This Semester Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-xl px-2.5 py-2 hover:scale-[1.03] transition-transform duration-200 cursor-default"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100">
              <s.icon size={12} className="text-emerald-700" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-gray-800 leading-none">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-gray-500 leading-tight mt-0.5" style={{ fontSize: 9 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Laptop Mockup ──────────────────────────────────────────────────────────────
function LaptopMockup({ width = 164 }) {
  const colors = ['#bbf7d0','#a5f3fc','#fde68a','#fca5a5','#c4b5fd']
  const rows = [[1,0,2,0,3],[0,4,0,1,0],[2,0,0,3,4],[0,1,2,0,0]]
  const [activeCell, setActiveCell] = useState(null)
  return (
    <div className="rounded-xl overflow-hidden" style={{
      width, boxShadow: '0 10px 32px rgba(0,0,0,0.45)', border: '2px solid #334155', flexShrink: 0,
    }}>
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ background: '#0f172a' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="ml-1 text-slate-400 font-mono" style={{ fontSize: 6 }}>schedule.tlss</span>
      </div>
      <div className="p-2" style={{ background: '#f8fafc' }}>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          {['M','T','W','T','F'].map((d,i) => (
            <div key={i} className="text-center font-bold text-gray-400" style={{ fontSize: 7 }}>{d}</div>
          ))}
          {rows.flatMap((row, ri) => row.map((c, ci) => {
            const key = `${ri}-${ci}`
            return (
              <div key={key} onMouseEnter={() => c && setActiveCell(key)} onMouseLeave={() => setActiveCell(null)}
                className="rounded transition-all duration-200"
                style={{
                  height: 14, background: c ? colors[c-1] : '#e2e8f0', opacity: c ? 1 : 0.4,
                  transform: activeCell === key ? 'scaleY(1.18)' : 'scaleY(1)',
                }}
              />
            )
          }))}
        </div>
      </div>
    </div>
  )
}

// ── Trend Graphic ──────────────────────────────────────────────────────────────
function TrendGraphic({ width = 116, height = 80 }) {
  const [ref, visible] = useReveal(0.05)
  const bars = [28,38,32,48,44,58,52,68]
  return (
    <div ref={ref} className="relative flex items-end gap-1 shrink-0" style={{ height, width }}>
      {bars.map((h, i) => (
        <div key={i} className="rounded-t flex-1 transition-all"
          style={{
            height: visible ? h : 4, background: 'rgba(255,255,255,0.22)',
            transitionDuration: `${400 + i * 55}ms`, transitionDelay: visible ? `${i * 35}ms` : '0ms',
          }} />
      ))}
      <svg className="absolute" style={{ inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        viewBox={`0 0 ${width} ${height}`} fill="none">
        <path d={`M4 ${height-10} Q${width*0.24} ${height-25} ${width*0.45} ${height-40} Q${width*0.67} ${height-58} ${width-4} ${height-72}`}
          stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" fill="none"
          strokeDasharray="200" strokeDashoffset={visible ? 0 : 200}
          style={{ transition: 'stroke-dashoffset 1.2s ease 0.3s' }} />
        <polygon points={`${width-4},${height-78} ${width+2},${height-68} ${width-12},${height-70}`}
          fill="#EAB308" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 1.4s' }} />
      </svg>
    </div>
  )
}

// ── Building SVG ───────────────────────────────────────────────────────────────
function BuildingSVG({ height = 130 }) {
  return (
    <svg viewBox="0 0 240 140" width="100%" height={height} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(94,232,160,0.28))' }} preserveAspectRatio="xMidYMid meet">
      <rect x="30" y="35" width="140" height="105" rx="3" fill="rgba(255,255,255,0.16)" stroke="rgba(94,232,160,0.2)" strokeWidth="1" />
      <rect x="45" y="22" width="110" height="18" rx="2" fill="rgba(255,255,255,0.12)" />
      {[42,62,82,102].flatMap(y => [55,80,105,130,155].map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" rx="1" fill="rgba(94,232,160,0.35)" />
      )))}
      <rect x="102" y="108" width="36" height="32" rx="1" fill="rgba(255,255,255,0.12)" stroke="rgba(217,180,74,0.4)" strokeWidth="1" />
      <polygon points="30,35 120,8 210,35" fill="none" stroke="rgba(217,180,74,0.3)" strokeWidth="1" />
      <text x="120" y="32" textAnchor="middle" fill="rgba(217,180,74,0.9)" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">CCD</text>
      <line x1="10" y1="140" x2="230" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <line x1="205" y1="20" x2="205" y2="38" stroke="rgba(217,180,74,0.6)" strokeWidth="2" />
      <circle cx="205" cy="18" r="3" fill="rgba(217,180,74,0.8)" />
    </svg>
  )
}

// ── Mobile Header Banner (shown only on mobile/small tablet) ───────────────────
function MobileBanner({ dark }) {
  const now = useLiveClock()
  return (
    <div className="relative overflow-hidden rounded-2xl mb-5 p-5"
      style={{ background: 'linear-gradient(135deg, #083D2E 0%, #0A4A35 55%, #0C523B 100%)' }}>
      {/* bg dots */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px' }} />
      <div className="relative z-10 flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0"
          style={{ boxShadow: '0 0 0 2px rgba(217,180,74,0.65)' }}>
          <img src={ccdLogo} className="w-full h-full object-cover" alt="CCD Logo" />
        </div>
        <div>
          <p className="text-white font-extrabold uppercase tracking-tight text-sm leading-tight">City College of Davao</p>
          <p className="text-xs font-semibold mt-0.5 uppercase tracking-wide" style={{ color: '#E6C25C', fontSize: 10 }}>Excellence • Integrity • Service</p>
        </div>
      </div>
      <h1 className="text-white font-extrabold uppercase tracking-tight leading-tight" style={{ fontSize: '1.35rem', fontFamily: "'EB Garamond',Georgia,serif" }}>
        Teacher Load &amp; <span style={{ color: '#5EE8A0' }}>Scheduling System</span>
      </h1>
      <div className="w-8 h-0.5 rounded-full mt-2 mb-2" style={{ backgroundColor: '#D9B44A' }} />
      {/* Mini stats row */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {[['120+','Faculty'],['350+','Classes'],['96%','Available']].map(([val,lbl]) => (
          <div key={lbl} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="text-white font-extrabold text-xs">{val}</span>
            <span className="text-xs" style={{ color: 'rgba(220,252,231,0.75)', fontSize: 10 }}>{lbl}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: 'rgba(220,252,231,0.65)', fontSize: 10 }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        System Online • AY 2026–2027 • 1st Semester
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Login() {
  const { account, login, error } = useAuth()
  const location   = useLocation()
  const now        = useLiveClock()
  const vw         = useViewport()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember,     setRemember]     = useState(false)
  const [dark,         setDark]         = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [forgotOpen,   setForgotOpen]   = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [fieldFocus,   setFieldFocus]   = useState(null)
  const [emailTouched, setEmailTouched] = useState(false)

  const [formRef, formVisible] = useReveal(0.02)

  // Breakpoint helpers
  const isMobile  = vw < 640           // < sm
  const isTablet  = vw >= 640 && vw < 1024  // sm – lg
  const isDesktop = vw >= 1024          // lg+

  if (account) {
    const dest = location.state?.from?.pathname || roleHome(account.role)
    return <Navigate to={dest} replace />
  }

  function onFieldChange(setter, field) {
    return (e) => {
      setSelectedRole(null)
      setter(e.target.value)
      if (field === 'email') setEmailTouched(true)
    }
  }
  function pickRole(item) { setSelectedRole(item.role); setEmail(item.email); setPassword(item.password) }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const ok = login(email, password)
    if (!ok) setIsLoading(false)
    else setLoginSuccess(true)
  }

  const active     = ROLE_QUICK_ACCESS.find(r => r.role === selectedRole)
  const dateLabel  = now.toLocaleDateString('en-PH',  { month: 'long', day: 'numeric', year: 'numeric' })
  const timeLabel  = now.toLocaleTimeString('en-PH',  { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen w-full flex items-start justify-center transition-colors duration-500 ${
      isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5 items-center'
    } ${dark ? 'bg-[#0A1410]' : 'bg-[#F3F4EF]'}`}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700;800&display=swap');

        @media (prefers-reduced-motion: no-preference) {
          .aurora-1   { animation: aurora1 17s ease-in-out infinite; }
          .aurora-2   { animation: aurora2 21s ease-in-out infinite; }
          .particle   { animation: particleRise linear infinite; }
          .float-cal  { animation: floatCal 4s ease-in-out infinite; }
          .float-card { animation: floatCard 5s ease-in-out infinite; }
          .reveal     { animation: revealUp .55s cubic-bezier(.16,1,.3,1) both; }
          .reveal-d1  { animation-delay: .07s; }
          .reveal-d2  { animation-delay: .14s; }
          .reveal-d3  { animation-delay: .21s; }
          .reveal-d4  { animation-delay: .28s; }
        }

        @keyframes aurora1      { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(26px,-18px) scale(1.1);} }
        @keyframes aurora2      { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-22px,20px) scale(1.06);} }
        @keyframes particleRise { 0%{transform:translateY(0);opacity:0;} 12%{opacity:.65;} 88%{opacity:.3;} 100%{transform:translateY(-150px);opacity:0;} }
        @keyframes floatCal     { 0%,100%{transform:rotate(3deg) translateY(0);} 50%{transform:rotate(3deg) translateY(-7px);} }
        @keyframes floatCard    { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
        @keyframes revealUp     { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        @keyframes successPop   { 0%{transform:scale(0.8);opacity:0;} 60%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }

        /* Skill: cursor-pointer + touch-action on all interactive elements */
        button, [role="button"] { cursor: pointer; touch-action: manipulation; }

        /* Skill: visible focus rings for keyboard nav */
        :focus-visible { outline: 2px solid #10b981; outline-offset: 2px; border-radius: 6px; }

        /* Smooth hover transitions */
        .role-btn { transition: all 200ms ease; }
        .role-btn:hover  { transform: translateY(-1px); }
        .role-btn:active { transform: translateY(0) scale(0.98); }

        .feature-item { transition: transform 200ms ease; }
        .feature-item:hover { transform: translateX(3px); }

        .success-pop { animation: successPop 0.45s cubic-bezier(.16,1,.3,1) both; }

        /* Skill: min 44px touch targets on mobile */
        @media (max-width: 639px) {
          .touch-target { min-height: 44px; min-width: 44px; }
          .role-btn     { min-height: 52px; }
        }
      `}</style>

      {/* ════════════════════════════ CARD SHELL ═════════════════════════════ */}
      <div className={`relative w-full overflow-hidden shadow-2xl ring-1 ring-black/5 ${
        isMobile  ? 'rounded-2xl max-w-[440px]' :
        isTablet  ? 'rounded-3xl max-w-[680px]' :
                    'rounded-[28px] max-w-[1180px]'
      }`}>

        {/* ambient glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute rounded-full blur-3xl bg-emerald-400/20" style={{ top:'28%', left:'46%', width:420, height:420 }} />
        </div>

        {/* ══ LAYOUT: stacked on mobile/tablet, side-by-side on desktop ══ */}
        <div className={`relative z-10 flex ${isDesktop ? 'flex-row' : 'flex-col'}`}>

          {/* ═══════════ LEFT / TOP BRAND PANEL ═══════════════════════════ */}
          {isDesktop ? (
            /* ─── DESKTOP: full left panel ─────────────────────────────── */
            <div className="relative flex md:w-[57%] min-h-[700px] flex-col overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#083D2E 0%,#0A4A35 50%,#0C523B 100%)' }}>
              {/* bg layers */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"url('/campus-photo.jpg')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.18, mixBlendMode:'luminosity' }} />
              <div className="absolute top-0 left-0 w-2/3 h-1/2 opacity-[0.10] pointer-events-none" style={{ backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize:'16px 16px' }} />
              <div className="aurora-1 absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />
              <div className="aurora-2 absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-800/50 blur-3xl pointer-events-none" />
              {[{l:'10%',b:'8%',s:4,dur:'9s',del:'0s'},{l:'24%',b:'4%',s:3,dur:'11s',del:'1.2s'},{l:'46%',b:'14%',s:5,dur:'8s',del:'2.4s'},{l:'66%',b:'6%',s:3,dur:'10s',del:'0.6s'},{l:'82%',b:'18%',s:4,dur:'12s',del:'3s'}].map((p,i) => (
                <span key={i} className="particle absolute rounded-full bg-emerald-200/80 pointer-events-none"
                  style={{ left:p.l, bottom:p.b, width:p.s, height:p.s, animationDuration:p.dur, animationDelay:p.del }} />
              ))}

              {/* TOP */}
              <div className="relative z-10 p-8 pb-0">
                <div className="relative">
                  {/* Floating calendar */}
                  <div className="float-cal absolute" style={{ top:-16, right:-12, zIndex:10 }}>
                    <MiniCalendar />
                  </div>
                  {/* Logo */}
                  <div className="reveal flex items-center gap-3">
                    <div className="w-[72px] h-[72px] shrink-0 rounded-full overflow-hidden hover:scale-105 transition-transform duration-300"
                      style={{ boxShadow:'0 0 0 3px rgba(217,180,74,0.65),0 8px 20px rgba(0,0,0,0.3)' }}>
                      <img src={ccdLogo} className="w-full h-full object-cover" alt="CCD Logo" />
                    </div>
                    <div>
                      <h2 style={{ fontFamily:"'EB Garamond',Georgia,serif" }} className="text-white font-extrabold uppercase tracking-tight text-xl leading-tight">City College<br/>of Davao</h2>
                      <p className="uppercase tracking-[0.12em] mt-1 text-xs font-semibold" style={{ color:'#E6C25C' }}>Excellence • Integrity • Service</p>
                    </div>
                  </div>
                  {/* Headline */}
                  <div className="reveal reveal-d1 mt-6">
                    <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'2.55rem' }} className="text-white font-extrabold uppercase tracking-tight leading-[1.05]">Teacher Load &amp;</h1>
                    <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'2.55rem', color:'#5EE8A0' }} className="font-extrabold uppercase tracking-tight leading-[1.05]">Scheduling System</h1>
                    <div className="w-12 h-1 rounded-full mt-3 mb-3" style={{ backgroundColor:'#D9B44A' }} />
                    <p className="text-white/90 font-medium text-sm leading-relaxed">Optimizing Faculty Workloads.<br/>Enhancing Academic Excellence.</p>
                  </div>
                  {/* Features */}
                  <ul className="reveal reveal-d2 mt-5 space-y-2 max-w-[230px]">
                    {FEATURES.map(f => (
                      <li key={f.label} className="feature-item flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor:'rgba(255,255,255,0.15)' }}>
                          <f.icon size={13} className="text-white" />
                        </span>
                        <span className="text-white/90 text-sm">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* MIDDLE */}
              <div className="relative z-10 flex-1 flex flex-col px-8 pb-0 mt-3" style={{ minHeight: 280 }}>
                <div className="float-card self-center mt-4" style={{ zIndex:15 }}>
                  <SemesterCard />
                </div>
                <div className="relative flex-1 flex items-end gap-3">
                  <LaptopMockup width={160} />
                  <div className="flex-1 self-end" style={{ height: 125 }}>
                    <BuildingSVG height={125} />
                  </div>
                  <TrendGraphic width={112} height={76} />
                </div>
              </div>

              {/* BOTTOM */}
              <div className="relative z-10 px-8 pb-6 mt-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border hover:bg-white/[0.15] transition-colors duration-200"
                  style={{ backgroundColor:'rgba(255,255,255,0.1)', borderColor:'rgba(255,255,255,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:'rgba(255,255,255,0.15)' }}>
                      <CalendarDays size={18} className="text-white" />
                    </span>
                    <div>
                      <p className="uppercase tracking-wide text-xs" style={{ color:'rgba(220,252,231,0.7)' }}>Current Academic Term</p>
                      <p style={{ fontFamily:"'EB Garamond',Georgia,serif" }} className="text-white font-bold text-base leading-tight">AY 2026–2027</p>
                      <p className="text-xs" style={{ color:'rgba(220,252,231,0.8)' }}>1st Semester</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor:'rgba(94,232,160,0.2)', color:'#5EE8A0', border:'1px solid rgba(94,232,160,0.35)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONGOING
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color:'rgba(220,252,231,0.7)' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  System Online
                  <span className="opacity-60">•</span>
                  <span className="tabular-nums">{dateLabel} • {timeLabel}</span>
                </div>
              </div>
            </div>

          ) : (
            /* ─── MOBILE & TABLET: compact top banner ───────────────────── */
            <div className={`relative overflow-hidden ${isTablet ? 'rounded-t-3xl' : 'rounded-t-2xl'}`}
              style={{ background: 'linear-gradient(135deg,#083D2E 0%,#0A4A35 55%,#0C523B 100%)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize:'14px 14px' }} />
              <div className="aurora-1 absolute -top-16 -left-10 w-64 h-64 rounded-full bg-emerald-300/25 blur-3xl pointer-events-none" />

              {isTablet ? (
                /* Tablet: two-column banner with semester card */
                <div className="relative z-10 flex gap-6 p-7 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0"
                        style={{ boxShadow:'0 0 0 2.5px rgba(217,180,74,0.65)' }}>
                        <img src={ccdLogo} className="w-full h-full object-cover" alt="CCD Logo" />
                      </div>
                      <div>
                        <p style={{ fontFamily:"'EB Garamond',Georgia,serif" }} className="text-white font-extrabold uppercase tracking-tight text-lg leading-tight">City College of Davao</p>
                        <p className="text-xs font-semibold mt-0.5 uppercase tracking-wide" style={{ color:'#E6C25C', fontSize:10 }}>Excellence • Integrity • Service</p>
                      </div>
                    </div>
                    <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'1.85rem' }} className="text-white font-extrabold uppercase tracking-tight leading-tight">
                      Teacher Load &amp; <span style={{ color:'#5EE8A0' }}>Scheduling System</span>
                    </h1>
                    <div className="w-10 h-0.5 rounded-full mt-2.5 mb-2.5" style={{ backgroundColor:'#D9B44A' }} />
                    <ul className="space-y-1.5">
                      {FEATURES.slice(0,4).map(f => (
                        <li key={f.label} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor:'rgba(255,255,255,0.15)' }}>
                            <f.icon size={11} className="text-white" />
                          </span>
                          <span className="text-white/85 text-xs">{f.label}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-1.5 mt-4 text-xs" style={{ color:'rgba(220,252,231,0.65)', fontSize:10 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      System Online • AY 2026–2027 • 1st Semester
                    </div>
                  </div>
                  {/* Mini semester card on tablet */}
                  <div className="shrink-0">
                    <SemesterCard compact />
                  </div>
                </div>
              ) : (
                /* Mobile: single-column compact banner */
                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0"
                      style={{ boxShadow:'0 0 0 2px rgba(217,180,74,0.65)' }}>
                      <img src={ccdLogo} className="w-full h-full object-cover" alt="CCD Logo" />
                    </div>
                    <div>
                      <p style={{ fontFamily:"'EB Garamond',Georgia,serif" }} className="text-white font-extrabold uppercase tracking-tight text-base leading-tight">City College of Davao</p>
                      <p className="font-semibold uppercase tracking-wide" style={{ color:'#E6C25C', fontSize:9 }}>Excellence • Integrity • Service</p>
                    </div>
                  </div>
                  <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'1.3rem' }} className="text-white font-extrabold uppercase tracking-tight leading-snug">
                    Teacher Load &amp; <span style={{ color:'#5EE8A0' }}>Scheduling System</span>
                  </h1>
                  <div className="w-8 h-0.5 rounded-full my-2" style={{ backgroundColor:'#D9B44A' }} />
                  <div className="flex gap-2 flex-wrap">
                    {[['120+','Faculty'],['350+','Classes'],['96%','Available']].map(([val,lbl]) => (
                      <div key={lbl} className="flex items-center gap-1 rounded-lg px-2 py-1"
                        style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.15)' }}>
                        <span className="text-white font-extrabold text-xs">{val}</span>
                        <span style={{ color:'rgba(220,252,231,0.75)', fontSize:10 }}>{lbl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5" style={{ color:'rgba(220,252,231,0.65)', fontSize:10 }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    System Online • AY 2026–2027 • 1st Semester
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ RIGHT / BOTTOM FORM PANEL ═══════════════════════ */}
          <div ref={formRef} className={`relative flex-1 backdrop-blur-xl flex flex-col justify-center ${
            isMobile  ? 'p-5'     :
            isTablet  ? 'p-7'     :
                        'p-8 xl:p-10'
          } ${dark ? 'bg-[#0F1C16]/90 text-[#E8EDE9]' : 'bg-white/85 text-[#10241A]'}`}
            style={{ minHeight: isDesktop ? 700 : 'auto' }}
          >
            {/* Light/Dark toggle */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center rounded-full p-1 gap-1 z-10"
              style={{ backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#F1F2EE' }}>
              {[{label:'Light',icon:<Sun size={11}/>,val:false},{label:'Dark',icon:<Moon size={11}/>,val:true}].map(({label,icon,val}) => (
                <button key={label} onClick={() => setDark(val)} aria-label={`${label} mode`}
                  className={`touch-target flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    dark === val
                      ? val ? 'bg-emerald-700 text-white shadow' : 'bg-white shadow text-gray-800'
                      : val  ? 'text-emerald-200/60' : 'text-gray-400'
                  }`}>
                  {icon}
                  <span className={isMobile ? 'sr-only' : ''}>{label}</span>
                </button>
              ))}
            </div>

            {/* Form container — max-width constrained on large screens */}
            <div className={`w-full mx-auto ${isDesktop ? 'max-w-[380px]' : isTablet ? 'max-w-[420px]' : 'max-w-full'} ${formVisible ? 'reveal' : 'opacity-0'}`}>

              {/* Avatar */}
              <div className={`rounded-full flex items-center justify-center mb-4 ${
                isMobile ? 'w-10 h-10' : 'w-12 h-12'
              } ${dark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                <UserRound size={isMobile ? 18 : 22} className="text-emerald-600" />
              </div>

              <h2 style={{ fontFamily:"'EB Garamond',Georgia,serif" }}
                className={`font-extrabold mb-1.5 ${formVisible ? 'reveal reveal-d1' : 'opacity-0'} ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Welcome <span className="text-emerald-600">Back!</span> <span aria-hidden>👋</span>
              </h2>
              <p className={`mb-5 ${dark ? 'text-emerald-200/70' : 'text-gray-500'} ${formVisible ? 'reveal reveal-d1' : 'opacity-0'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Sign in to your Teacher Load &amp; Scheduling System dashboard.
              </p>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className={`space-y-3 ${formVisible ? 'reveal reveal-d2' : 'opacity-0'}`} noValidate>

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className={`font-medium block mb-1 ${dark ? 'text-emerald-200/70' : 'text-gray-500'} ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    CCD Email
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    fieldFocus === 'email'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                      : emailTouched && !emailValid && email
                        ? 'border-red-400'
                        : dark ? 'border-emerald-900' : 'border-gray-200'
                  } ${dark ? 'bg-[#13241C]' : 'bg-white'}`}>
                    <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${fieldFocus === 'email' ? 'text-emerald-500' : dark ? 'text-emerald-200/60' : 'text-gray-400'}`} />
                    <input id="login-email" type="email" autoComplete="email" value={email}
                      onChange={onFieldChange(setEmail, 'email')}
                      onFocus={() => setFieldFocus('email')} onBlur={() => setFieldFocus(null)}
                      placeholder="name@ccd.edu.ph"
                      className={`touch-target w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none bg-transparent ${dark ? 'text-[#E8EDE9] placeholder:text-emerald-200/30' : 'placeholder:text-gray-400'}`}
                    />
                  </div>
                  {emailTouched && !emailValid && email && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className={`font-medium block mb-1 ${dark ? 'text-emerald-200/70' : 'text-gray-500'} text-xs`}>
                    Password
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    fieldFocus === 'password'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                      : dark ? 'border-emerald-900' : 'border-gray-200'
                  } ${dark ? 'bg-[#13241C]' : 'bg-white'}`}>
                    <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${fieldFocus === 'password' ? 'text-emerald-500' : dark ? 'text-emerald-200/60' : 'text-gray-400'}`} />
                    <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                      value={password} onChange={onFieldChange(setPassword, 'password')}
                      onFocus={() => setFieldFocus('password')} onBlur={() => setFieldFocus(null)}
                      placeholder="••••••••"
                      className={`touch-target w-full rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none bg-transparent ${dark ? 'text-[#E8EDE9] placeholder:text-emerald-200/30' : 'placeholder:text-gray-400'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className={`touch-target absolute right-0 top-0 h-full px-3 flex items-center justify-center transition-colors duration-200 ${dark ? 'text-emerald-200/60 hover:text-emerald-200' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${dark ? 'text-emerald-200/70' : 'text-gray-500'}`}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setForgotOpen(v => !v)}
                    className="touch-target text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 px-1">
                    Forgot password?
                  </button>
                </div>

                {forgotOpen && (
                  <div className={`text-xs rounded-xl px-3 py-2.5 ${dark ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    Password resets go through your Program Head or the Registrar's office — no self-service reset yet.
                  </div>
                )}

                {error && !isLoading && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                )}

                {/* Submit — Skill: loading feedback, 44px+ touch target */}
                <button type="submit" disabled={isLoading || loginSuccess}
                  className="touch-target w-full rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-80"
                  style={{
                    fontSize: isMobile ? '0.875rem' : '0.9rem',
                    padding: isMobile ? '0.8rem' : '0.75rem',
                    background: 'linear-gradient(90deg,#0F6B3C,#1FA84F)',
                    boxShadow: '0 10px 24px -8px rgba(15,107,60,0.55)',
                  }}>
                  {isLoading   ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> :
                   loginSuccess ? <span className="success-pop flex items-center gap-2"><CheckCircle2 size={15}/> Success!</span> :
                   <><LogIn size={15} /> {active ? `Continue as ${active.label}` : 'Sign in'}</>}
                </button>
              </form>

              {/* Divider */}
              <div className={`flex items-center gap-3 my-4 ${formVisible ? 'reveal reveal-d3' : 'opacity-0'}`}>
                <span className={`h-px flex-1 ${dark ? 'bg-emerald-900' : 'bg-gray-200'}`} />
                <span className={`text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-400'}`}>or continue as</span>
                <span className={`h-px flex-1 ${dark ? 'bg-emerald-900' : 'bg-gray-200'}`} />
              </div>

              {/* Role buttons — 2 columns always, larger tap targets on mobile */}
              <div className={`grid grid-cols-2 gap-2 ${formVisible ? 'reveal reveal-d3' : 'opacity-0'}`}>
                {ROLE_QUICK_ACCESS.map(item => {
                  const isActive = selectedRole === item.role
                  return (
                    <button key={item.role} type="button" onClick={() => pickRole(item)}
                      className={`role-btn touch-target flex items-center gap-2 rounded-xl border px-3 text-left ${
                        isActive
                          ? dark ? 'border-emerald-400 bg-emerald-500/15' : 'border-emerald-400 bg-emerald-50'
                          : dark ? 'bg-[#13241C] border-emerald-900 hover:bg-emerald-500/10' : 'bg-white border-gray-200 hover:bg-emerald-50/60'
                      }`}
                      style={{ paddingTop: isMobile ? '0.7rem' : '0.6rem', paddingBottom: isMobile ? '0.7rem' : '0.6rem' }}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isActive ? 'bg-emerald-500 text-white' : dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <item.icon size={13} />
                      </span>
                      <span className="text-xs font-medium leading-tight">{item.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className={`text-xs mt-2 ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>Demo accounts only — mock data, no live backend yet.</p>

              {/* Help link */}
              <a href="mailto:admin@ccd.edu.ph"
                className={`mt-4 flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 ${formVisible ? 'reveal reveal-d4' : 'opacity-0'} ${dark ? 'border-emerald-900 hover:bg-emerald-500/10' : 'border-gray-200 hover:bg-gray-50'}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Headset size={14} />
                </span>
                <span>
                  <span className="block text-xs font-semibold">Need help?</span>
                  <span className="block text-xs text-emerald-600">Contact System Administrator</span>
                </span>
                <ChevronRight size={14} className={`ml-auto ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`} />
              </a>

              {/* Trust badges */}
              <div className={`flex items-center justify-between gap-2 mt-4 flex-wrap ${formVisible ? 'reveal reveal-d4' : 'opacity-0'}`}>
                {TRUST_BADGES.map(b => (
                  <div key={b.label} className={`flex items-center gap-1.5 text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-500'}`}>
                    <b.icon size={12} className="text-emerald-600" />
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════ FOOTER ════════════════════════════════════════ */}
        <div className={`relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${
          isMobile ? 'px-5 py-3' : 'px-6 sm:px-10 py-4'
        } ${dark ? 'border-emerald-900' : 'border-gray-100'}`}
          style={{ backgroundColor: dark ? '#0F1C16' : '#FFFFFF' }}>
          <div className="flex items-center gap-2.5">
            <div className={`rounded-lg shrink-0 overflow-hidden ${isMobile ? 'w-7 h-7' : 'w-9 h-9'}`}
              style={{ boxShadow:'0 0 0 2px rgba(217,180,74,0.5)' }}>
              <img src={btvtedCrest} className="w-full h-full object-cover" alt="CCD Crest" />
            </div>
            <div>
              <p className={`text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-400'}`}>Teacher Load &amp; Scheduling System (TLSS) v1.0</p>
              <p className="text-xs font-medium text-emerald-600">Developed by: Brylle G. Banual and Carmi Alexandra Quirante</p>
            </div>
          </div>
          <p className="hidden lg:block text-sm italic text-emerald-600 text-center max-w-xs">
            "Empowering educators. Building better futures."
          </p>
          <div className={`hidden sm:block text-xs text-right ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>
            <p>© 2026 City College of Davao</p>
            <p>All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}