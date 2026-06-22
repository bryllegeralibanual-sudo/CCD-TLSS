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

// ─── Skill: UI UX Pro Max ───────────────────────────────────────────────────
// Applied: Motion-Driven style (300-400ms, Intersection Observer entrance anims)
// Typography: EB Garamond (headings) / system sans (body) — academic + clean
// Key effects: scroll entrance, hover feedback (150-300ms), submit loading state
// Checklist: cursor-pointer on all clickables, focus rings, prefers-reduced-motion
// ────────────────────────────────────────────────────────────────────────────

const ROLE_QUICK_ACCESS = [
  { role: 'admin',        label: 'Administrator', icon: ShieldCheck, email: 'admin@ccd.edu.ph',          password: 'admin123'     },
  { role: 'program_head', label: 'Program Head',  icon: Users,       email: 'head.btvted@ccd.edu.ph',   password: 'head123'      },
  { role: 'registrar',    label: 'Registrar',     icon: FileText,    email: 'registrar@ccd.edu.ph',     password: 'registrar123' },
  { role: 'teacher',      label: 'Faculty',       icon: GraduationCap, email: 'romel.salazar@ccd.edu.ph', password: 'teacher123' },
]

const FEATURES = [
  { icon: User,          label: 'Smart Workload Distribution' },
  { icon: CalendarCheck2,label: 'Automated Scheduling' },
  { icon: CheckCircle2,  label: 'Conflict Detection' },
  { icon: GraduationCap, label: 'Academic Planning' },
  { icon: BarChart3,     label: 'Reports & Analytics' },
]

const TRUST_BADGES = [
  { icon: Lock,      label: 'Secure Authentication' },
  { icon: UserCheck, label: 'Role-Based Access' },
  { icon: ShieldCheck,label: 'Data Protection' },
]

// Live clock — updates every second for a "live" feel
function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// Intersection Observer hook for scroll/mount entrance animations
function useReveal(threshold = 0.15) {
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

// Mini calendar — current month, today highlighted
function MiniCalendar() {
  const now = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const todayDate = now.getDate()
  const monthName = now.toLocaleString('en-PH', { month: 'long' }).toUpperCase()
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div
      className="absolute top-4 right-4 rounded-2xl overflow-hidden"
      style={{
        width: 200,
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
        transform: 'rotate(3deg)',
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <button className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150 p-1 rounded">
          <ChevronLeft size={13} />
        </button>
        <span className="text-xs font-bold text-gray-700 tracking-wider">{monthName} {year}</span>
        <button className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150 p-1 rounded">
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-7 px-2 pt-1.5 pb-0.5">
        {days.map(d => (
          <div key={d} className="text-center text-gray-400 font-semibold" style={{ fontSize: 7.5 }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-2 pb-2.5 gap-y-0.5">
        {cells.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer"
            style={{
              height: 22,
              fontSize: 10,
              fontWeight: d === todayDate ? 700 : 400,
              color:  d === todayDate ? '#fff' : d ? '#374151' : 'transparent',
              background: d === todayDate ? '#16a34a' : 'transparent',
            }}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// Animated stat counter
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal(0.1)
  useEffect(() => {
    if (!visible) return
    const numTarget = parseInt(target.replace(/\D/g, ''))
    const duration  = 1200
    const steps     = 40
    const increment = numTarget / steps
    let current = 0
    const id = setInterval(() => {
      current += increment
      if (current >= numTarget) { setCount(numTarget); clearInterval(id) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(id)
  }, [visible, target])
  return (
    <span ref={ref} className="text-sm font-extrabold text-gray-800 leading-none tabular-nums">
      {count}{suffix}
    </span>
  )
}

// Semester overview card with animated counters
function SemesterCard() {
  const stats = [
    { icon: Users,        value: '120', suffix: '+', label: 'Faculty Members'   },
    { icon: CalendarDays, value: '350', suffix: '+', label: 'Classes Scheduled' },
    { icon: BarChart3,    value: '96',  suffix: '%', label: 'Faculty Availability' },
    { icon: GraduationCap,value: '12',  suffix: '',  label: 'Academic Programs' },
  ]
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        zIndex: 10,
        minWidth: 248,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">This Semester Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-200 hover:scale-[1.03] cursor-default"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100">
              <s.icon size={12} className="text-emerald-700" />
            </span>
            <div>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
              <p className="text-gray-500 leading-tight mt-0.5" style={{ fontSize: 9 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Laptop mockup — schedule grid with subtle shimmer on active cells
function LaptopMockup() {
  const colors = ['#bbf7d0','#a5f3fc','#fde68a','#fca5a5','#c4b5fd']
  const rows = [
    [1,0,2,0,3],
    [0,4,0,1,0],
    [2,0,0,3,4],
    [0,1,2,0,0],
  ]
  const [activeCell, setActiveCell] = useState(null)
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ width: 164, boxShadow: '0 10px 32px rgba(0,0,0,0.45)', border: '2px solid #334155' }}
    >
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ background: '#0f172a' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="ml-1 text-[7px] text-slate-400 font-mono">schedule.tlss</span>
      </div>
      <div className="p-2" style={{ background: '#f8fafc' }}>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {['M','T','W','T','F'].map((d, i) => (
            <div key={i} className="text-center font-bold text-gray-400" style={{ fontSize: 7 }}>{d}</div>
          ))}
          {rows.flatMap((row, ri) =>
            row.map((c, ci) => {
              const key = `${ri}-${ci}`
              const isActive = activeCell === key
              return (
                <div
                  key={key}
                  onMouseEnter={() => c && setActiveCell(key)}
                  onMouseLeave={() => setActiveCell(null)}
                  className="rounded transition-all duration-200 cursor-pointer"
                  style={{
                    height: 14,
                    background: c ? colors[c - 1] : '#e2e8f0',
                    opacity: c ? 1 : 0.4,
                    transform: isActive ? 'scaleY(1.15)' : 'scaleY(1)',
                    boxShadow: isActive ? `0 2px 8px ${colors[c-1]}88` : 'none',
                  }}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// Trend chart with animated bars
function TrendGraphic() {
  const [ref, visible] = useReveal(0.1)
  const barHeights = [28,38,32,48,44,58,52,68]
  return (
    <div ref={ref} className="relative flex items-end gap-1" style={{ height: 80, width: 116 }}>
      {barHeights.map((h, i) => (
        <div
          key={i}
          className="rounded-t flex-1 transition-all"
          style={{
            height: visible ? h : 4,
            background: 'rgba(255,255,255,0.22)',
            transitionDuration: `${400 + i * 60}ms`,
            transitionDelay: visible ? `${i * 40}ms` : '0ms',
          }}
        />
      ))}
      <svg
        className="absolute"
        style={{ bottom: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}
        viewBox="0 0 116 80"
        fill="none"
      >
        <path
          d="M4 70 Q28 55 52 40 Q76 22 112 8"
          stroke="#EAB308"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="160"
          strokeDashoffset={visible ? 0 : 160}
          style={{ transition: 'stroke-dashoffset 1.2s ease 0.3s' }}
        />
        <polygon
          points="112,2 118,12 104,10"
          fill="#EAB308"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 1.4s' }}
        />
      </svg>
    </div>
  )
}

// Building SVG
function BuildingSVG() {
  return (
    <svg viewBox="0 0 240 140" width="100%" height="130" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(94,232,160,0.28))' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="30" y="35" width="140" height="105" rx="3" fill="rgba(255,255,255,0.16)" stroke="rgba(94,232,160,0.2)" strokeWidth="1" />
      <rect x="45" y="22" width="110" height="18" rx="2" fill="rgba(255,255,255,0.12)" />
      {[42,62,82,102].flatMap(y =>
        [55,80,105,130,155].map(x => (
          <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" rx="1" fill="rgba(94,232,160,0.35)" />
        ))
      )}
      <rect x="102" y="108" width="36" height="32" rx="1" fill="rgba(255,255,255,0.12)" stroke="rgba(217,180,74,0.4)" strokeWidth="1" />
      <polygon points="30,35 120,8 210,35" fill="none" stroke="rgba(217,180,74,0.3)" strokeWidth="1" />
      <text x="120" y="32" textAnchor="middle" fill="rgba(217,180,74,0.9)" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">CCD</text>
      <line x1="10" y1="140" x2="230" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <line x1="205" y1="20" x2="205" y2="38" stroke="rgba(217,180,74,0.6)" strokeWidth="2" />
      <circle cx="205" cy="18" r="3" fill="rgba(217,180,74,0.8)" />
    </svg>
  )
}

export default function Login() {
  const { account, login, error } = useAuth()
  const location   = useLocation()
  const now        = useLiveClock()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember,     setRemember]     = useState(false)
  const [dark,         setDark]         = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [forgotOpen,   setForgotOpen]   = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [fieldFocus,   setFieldFocus]   = useState(null) // 'email' | 'password'
  const [emailTouched, setEmailTouched] = useState(false)
  const emailRef = useRef(null)

  // Entrance reveal refs
  const [heroRef,  heroVisible]  = useReveal(0.05)
  const [formRef,  formVisible]  = useReveal(0.05)

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

  function pickRole(item) {
    setSelectedRole(item.role)
    setEmail(item.email)
    setPassword(item.password)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    // Simulate slight delay so loading state is visible
    await new Promise(r => setTimeout(r, 600))
    const ok = login(email, password)
    if (!ok) setIsLoading(false)
    else setLoginSuccess(true)
  }

  const active    = ROLE_QUICK_ACCESS.find((r) => r.role === selectedRole)
  const dateLabel = now.toLocaleDateString('en-PH',  { month: 'long', day: 'numeric', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-PH',  { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-3 sm:p-6 transition-colors duration-500 ${dark ? 'bg-[#0A1410]' : 'bg-[#F3F4EF]'}`}>
      {/* ──── Global styles + skill-applied animations ──── */}
      <style>{`
        /* Skill: EB Garamond for display headings (academic + prestigious) */
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700;800&display=swap');

        /* Skill: Motion-Driven — 150-400ms, GPU-accelerated, prefers-reduced-motion respected */
        @media (prefers-reduced-motion: no-preference) {
          .aurora-1       { animation: aurora1 17s ease-in-out infinite; }
          .aurora-2       { animation: aurora2 21s ease-in-out infinite; }
          .particle       { animation: particleRise linear infinite; }
          .float-cal      { animation: floatCal 4s ease-in-out infinite; }
          .float-card     { animation: floatCard 5s ease-in-out infinite; }
          .reveal         { animation: revealUp .55s cubic-bezier(.16,1,.3,1) both; }
          .reveal-d1      { animation-delay: .06s; }
          .reveal-d2      { animation-delay: .12s; }
          .reveal-d3      { animation-delay: .18s; }
          .reveal-d4      { animation-delay: .24s; }
          .shimmer        { animation: shimmer 2.5s linear infinite; }
          .spin-slow      { animation: spin 8s linear infinite; }
        }
        @keyframes aurora1    { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(26px,-18px) scale(1.1);} }
        @keyframes aurora2    { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-22px,20px) scale(1.06);} }
        @keyframes particleRise { 0%{transform:translateY(0);opacity:0;} 12%{opacity:.65;} 88%{opacity:.3;} 100%{transform:translateY(-150px);opacity:0;} }
        @keyframes floatCal   { 0%,100%{transform:rotate(3deg) translateY(0);} 50%{transform:rotate(3deg) translateY(-7px);} }
        @keyframes floatCard  { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
        @keyframes revealUp   { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer    { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        @keyframes spin       { to{transform:rotate(360deg);} }

        /* Skill: cursor-pointer on all clickable elements */
        button, [role="button"], label[for] { cursor: pointer; }

        /* Skill: Focus rings — keyboard nav */
        :focus-visible { outline: 2px solid #10b981; outline-offset: 2px; border-radius: 6px; }

        /* Skill: Hover states 150-300ms smooth */
        .role-btn { transition: all 200ms ease; }
        .role-btn:hover { transform: translateY(-1px); }
        .role-btn:active { transform: translateY(0) scale(0.98); }

        /* Input field glow on focus */
        .field-wrap input:focus { box-shadow: 0 0 0 3px rgba(16,185,129,0.18); }

        /* Headline uses academic serif */
        .headline-serif { font-family: 'EB Garamond', Georgia, serif; }

        /* Skill: Smooth hover on feature list items */
        .feature-item { transition: transform 200ms ease, opacity 200ms ease; }
        .feature-item:hover { transform: translateX(3px); opacity: 1 !important; }

        /* Success pulse */
        @keyframes successPop { 0%{transform:scale(0.8);opacity:0;} 60%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
        .success-pop { animation: successPop 0.45s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="relative w-full max-w-[1180px] overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-black/5">
        {/* ambient glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute rounded-full blur-3xl bg-emerald-400/20" style={{ top: '28%', left: '46%', width: 420, height: 420 }} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row">

          {/* ═══════════════ LEFT PANEL ═══════════════ */}
          <div
            className="relative hidden md:flex md:w-[58%] min-h-[680px] flex-col overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #083D2E 0%, #0A4A35 50%, #0C523B 100%)' }}
          >
            {/* campus photo layer */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage:"url('/campus-photo.jpg')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.18, mixBlendMode:'luminosity' }} />
            {/* dot grid */}
            <div className="absolute top-0 left-0 w-2/3 h-1/2 opacity-[0.10] pointer-events-none"
              style={{ backgroundImage:'radial-gradient(circle, #ffffff 1px, transparent 1.4px)', backgroundSize:'16px 16px' }} />
            {/* aurora blobs */}
            <div className="aurora-1 absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />
            <div className="aurora-2 absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-800/50 blur-3xl pointer-events-none" />
            {/* particles */}
            {[
              {left:'10%',bottom:'8%', size:4, duration:'9s',  delay:'0s'  },
              {left:'24%',bottom:'4%', size:3, duration:'11s', delay:'1.2s'},
              {left:'46%',bottom:'14%',size:5, duration:'8s',  delay:'2.4s'},
              {left:'66%',bottom:'6%', size:3, duration:'10s', delay:'0.6s'},
              {left:'82%',bottom:'18%',size:4, duration:'12s', delay:'3s'  },
            ].map((p,i) => (
              <span key={i} className="particle absolute rounded-full bg-emerald-200/80 pointer-events-none"
                style={{ left:p.left, bottom:p.bottom, width:p.size, height:p.size, animationDuration:p.duration, animationDelay:p.delay }} />
            ))}

            {/* TOP: logo + calendar + hero */}
            <div ref={heroRef} className="relative z-10 p-8 pb-0">
              <div className="relative">
                {/* Floating calendar */}
                <div className="float-cal absolute" style={{ top:-16, right:-12 }}>
                  <MiniCalendar />
                </div>

                {/* Logo + name */}
                <div className={`flex items-center gap-3 ${heroVisible ? 'reveal' : 'opacity-0'}`}>
                  <div className="w-[72px] h-[72px] shrink-0 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105"
                    style={{ boxShadow:'0 0 0 3px rgba(217,180,74,0.65), 0 8px 20px rgba(0,0,0,0.3)' }}>
                    <img src={ccdLogo} className="w-full h-full object-cover" alt="CCD Logo" />
                  </div>
                  <div>
                    <h2 className="headline-serif text-white font-extrabold uppercase tracking-tight text-xl leading-tight">City College<br/>of Davao</h2>
                    <p className="uppercase tracking-[0.12em] mt-1 text-xs font-semibold" style={{ color:'#E6C25C' }}>Excellence • Integrity • Service</p>
                  </div>
                </div>

                {/* Hero headline — EB Garamond (skill: academic serif) */}
                <div className={`mt-6 ${heroVisible ? 'reveal reveal-d1' : 'opacity-0'}`}>
                  <h1 className="headline-serif text-white font-extrabold uppercase tracking-tight leading-[1.05]" style={{ fontSize:'2.6rem' }}>Teacher Load &amp;</h1>
                  <h1 className="headline-serif font-extrabold uppercase tracking-tight leading-[1.05]" style={{ fontSize:'2.6rem', color:'#5EE8A0' }}>Scheduling System</h1>
                  <div className="w-12 h-1 rounded-full mt-3 mb-3" style={{ backgroundColor:'#D9B44A' }} />
                  <p className="text-white/90 font-medium text-sm leading-relaxed">Optimizing Faculty Workloads.<br/>Enhancing Academic Excellence.</p>
                </div>

                {/* Features — Skill: hover translates right, smooth 200ms */}
                <ul className={`mt-5 space-y-2 max-w-[230px] ${heroVisible ? 'reveal reveal-d2' : 'opacity-0'}`}>
                  {FEATURES.map((f,i) => (
                    <li key={f.label} className="feature-item flex items-center gap-2.5" style={{ opacity: 0.9 }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
                        style={{ backgroundColor:'rgba(255,255,255,0.15)' }}>
                        <f.icon size={13} className="text-white" />
                      </span>
                      <span className="text-white/90 text-sm">{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* MIDDLE: semester card + laptop + building + trend */}
            <div className="relative z-10 flex-1 flex flex-col px-8 pb-0 mt-3" style={{ minHeight:300 }}>
              <div className="float-card self-center" style={{ zIndex:15, marginTop:'16px' }}>
                <SemesterCard />
              </div>

              <div className="relative flex-1 flex items-end gap-3">
                <div className="shrink-0" style={{ zIndex:5 }}>
                  <LaptopMockup />
                </div>
                <div className="flex-1 self-end flex items-end justify-center" style={{ height:130, zIndex:5 }}>
                  <BuildingSVG />
                </div>
                <div className="shrink-0" style={{ zIndex:5 }}>
                  <TrendGraphic />
                </div>
              </div>
            </div>

            {/* BOTTOM: academic term + live clock */}
            <div className="relative z-10 px-8 pb-6 mt-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border transition-all duration-300 hover:bg-white/[0.15]"
                style={{ backgroundColor:'rgba(255,255,255,0.1)', borderColor:'rgba(255,255,255,0.15)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor:'rgba(255,255,255,0.15)' }}>
                    <CalendarDays size={18} className="text-white" />
                  </span>
                  <div>
                    <p className="uppercase tracking-wide text-xs" style={{ color:'rgba(220,252,231,0.7)' }}>Current Academic Term</p>
                    <p className="headline-serif text-white font-bold text-base leading-tight">AY 2026–2027</p>
                    <p className="text-xs" style={{ color:'rgba(220,252,231,0.8)' }}>1st Semester</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor:'rgba(94,232,160,0.2)', color:'#5EE8A0', border:'1px solid rgba(94,232,160,0.35)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONGOING
                </span>
              </div>

              {/* Live clock — updates every second */}
              <div className="flex items-center gap-2 mt-3 text-xs" style={{ color:'rgba(220,252,231,0.7)' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Online
                <span className="opacity-60">•</span>
                <span className="tabular-nums">{dateLabel} • {timeLabel}</span>
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT PANEL ═══════════════ */}
          <div ref={formRef} className={`relative flex-1 min-h-[680px] backdrop-blur-xl p-6 sm:p-10 flex flex-col justify-center ${dark ? 'bg-[#0F1C16]/85 text-[#E8EDE9]' : 'bg-white/80 text-[#10241A]'}`}>

            {/* Light / Dark toggle */}
            <div className="absolute top-5 right-5 sm:top-7 sm:right-7 flex items-center rounded-full p-1 gap-1"
              style={{ backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#F1F2EE' }}>
              {[
                { label:'Light', icon:<Sun size={12}/>, isDark:false },
                { label:'Dark',  icon:<Moon size={12}/>, isDark:true  },
              ].map(({label,icon,isDark}) => (
                <button key={label} onClick={() => setDark(isDark)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    dark === isDark
                      ? isDark ? 'bg-emerald-700 text-white shadow' : 'bg-white shadow text-gray-800'
                      : isDark ? 'text-emerald-200/60' : 'text-gray-400'
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className={`w-full max-w-[360px] mx-auto ${formVisible ? 'reveal' : 'opacity-0'}`}>

              {/* Avatar icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 transition-all duration-300 ${dark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                <UserRound size={22} className="text-emerald-600" />
              </div>

              <h2 className={`headline-serif text-2xl font-extrabold mb-1.5 ${formVisible ? 'reveal reveal-d1' : 'opacity-0'}`}>
                Welcome <span className="text-emerald-600">Back!</span> <span aria-hidden>👋</span>
              </h2>
              <p className={`text-sm mb-6 ${dark ? 'text-emerald-200/70' : 'text-gray-500'} ${formVisible ? 'reveal reveal-d2' : 'opacity-0'}`}>
                Sign in to access your Teacher Load &amp; Scheduling System dashboard.
              </p>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className={`space-y-3.5 ${formVisible ? 'reveal reveal-d2' : 'opacity-0'}`} noValidate>

                {/* Email field */}
                <div className="field-wrap">
                  <label htmlFor="login-email" className={`text-xs font-medium block mb-1.5 ${dark ? 'text-emerald-200/70' : 'text-gray-500'}`}>
                    CCD Email
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    fieldFocus === 'email'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                      : emailTouched && !emailValid
                        ? 'border-red-400'
                        : dark ? 'border-emerald-900' : 'border-gray-200'
                  }`}>
                    <Mail size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      fieldFocus === 'email' ? 'text-emerald-500' : dark ? 'text-emerald-200/60' : 'text-gray-400'
                    }`} />
                    <input
                      ref={emailRef}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={onFieldChange(setEmail, 'email')}
                      onFocus={() => setFieldFocus('email')}
                      onBlur={() => setFieldFocus(null)}
                      placeholder="name@ccd.edu.ph"
                      className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none bg-transparent ${dark ? 'text-[#E8EDE9] placeholder:text-emerald-200/30' : 'placeholder:text-gray-400'}`}
                    />
                  </div>
                  {/* Inline validation */}
                  {emailTouched && !emailValid && email && (
                    <p className="text-xs text-red-500 mt-1 transition-all duration-200">Please enter a valid email address.</p>
                  )}
                </div>

                {/* Password field */}
                <div className="field-wrap">
                  <label htmlFor="login-password" className={`text-xs font-medium block mb-1.5 ${dark ? 'text-emerald-200/70' : 'text-gray-500'}`}>
                    Password
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    fieldFocus === 'password'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                      : dark ? 'border-emerald-900' : 'border-gray-200'
                  }`}>
                    <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      fieldFocus === 'password' ? 'text-emerald-500' : dark ? 'text-emerald-200/60' : 'text-gray-400'
                    }`} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={onFieldChange(setPassword, 'password')}
                      onFocus={() => setFieldFocus('password')}
                      onBlur={() => setFieldFocus(null)}
                      placeholder="••••••••"
                      className={`w-full rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none bg-transparent ${dark ? 'text-[#E8EDE9] placeholder:text-emerald-200/30' : 'placeholder:text-gray-400'}`}
                    />
                    {/* Skill: toggle must be accessible & always have cursor-pointer */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 cursor-pointer ${dark ? 'text-emerald-200/60 hover:text-emerald-200' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${dark ? 'text-emerald-200/70' : 'text-gray-500'}`}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-emerald-600 cursor-pointer" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setForgotOpen(v => !v)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 cursor-pointer">
                    Forgot password?
                  </button>
                </div>

                {forgotOpen && (
                  <div className={`text-xs rounded-xl px-3 py-2.5 transition-all duration-200 ${dark ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    Password resets go through your Program Head or the Registrar's office — no self-service reset yet.
                  </div>
                )}

                {/* Skill: Submit feedback — show loading → success state */}
                {error && !isLoading && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || loginSuccess}
                  className="w-full rounded-xl text-white text-sm font-semibold py-3 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-80"
                  style={{ background:'linear-gradient(90deg, #0F6B3C, #1FA84F)', boxShadow:'0 10px 24px -8px rgba(15,107,60,0.55)' }}
                >
                  {isLoading ? (
                    <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                  ) : loginSuccess ? (
                    <span className="success-pop flex items-center gap-2"><CheckCircle2 size={15}/> Success!</span>
                  ) : (
                    <><LogIn size={15} /> {active ? `Continue as ${active.label}` : 'Sign in'}</>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className={`flex items-center gap-3 my-5 ${formVisible ? 'reveal reveal-d3' : 'opacity-0'}`}>
                <span className={`h-px flex-1 ${dark ? 'bg-emerald-900' : 'bg-gray-200'}`} />
                <span className={`text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-400'}`}>or continue as</span>
                <span className={`h-px flex-1 ${dark ? 'bg-emerald-900' : 'bg-gray-200'}`} />
              </div>

              {/* Role quick-access — Skill: hover/active transforms, cursor-pointer */}
              <div className={`grid grid-cols-2 gap-2.5 ${formVisible ? 'reveal reveal-d3' : 'opacity-0'}`}>
                {ROLE_QUICK_ACCESS.map((item) => {
                  const isActive = selectedRole === item.role
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => pickRole(item)}
                      className={`role-btn flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left cursor-pointer ${
                        isActive
                          ? dark ? 'border-emerald-400 bg-emerald-500/15' : 'border-emerald-400 bg-emerald-50'
                          : dark ? 'bg-[#13241C] border-emerald-900 hover:bg-emerald-500/10' : 'bg-white border-gray-200 hover:bg-emerald-50/60'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isActive ? 'bg-emerald-500 text-white' : dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <item.icon size={14} />
                      </span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className={`text-xs mt-2 ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>Demo accounts only — mock data, no live backend yet.</p>

              {/* Help link */}
              <a
                href="mailto:admin@ccd.edu.ph"
                className={`mt-5 flex items-center gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${formVisible ? 'reveal reveal-d4' : 'opacity-0'} ${dark ? 'border-emerald-900 hover:bg-emerald-500/10' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Headset size={15} />
                </span>
                <span>
                  <span className="block text-xs font-semibold">Need help?</span>
                  <span className="block text-xs text-emerald-600">Contact System Administrator</span>
                </span>
                <ChevronRight size={15} className={`ml-auto transition-transform duration-200 group-hover:translate-x-1 ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`} />
              </a>

              {/* Trust badges */}
              <div className={`flex items-center justify-between gap-3 mt-5 flex-wrap ${formVisible ? 'reveal reveal-d4' : 'opacity-0'}`}>
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className={`flex items-center gap-1.5 text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-500'}`}>
                    <b.icon size={13} className="text-emerald-600" />
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <div
          className={`relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-10 py-4 border-t ${dark ? 'border-emerald-900' : 'border-gray-100'}`}
          style={{ backgroundColor: dark ? '#0F1C16' : '#FFFFFF' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden transition-transform duration-200 hover:scale-110 cursor-default"
              style={{ boxShadow:'0 0 0 2px rgba(217,180,74,0.5)' }}>
              <img src={btvtedCrest} className="w-full h-full object-cover" alt="CCD Crest" />
            </div>
            <div>
              <p className={`text-xs ${dark ? 'text-emerald-200/60' : 'text-gray-400'}`}>Teacher Load &amp; Scheduling System (TLSS) v1.0</p>
              <p className="text-xs font-medium text-emerald-600">Developed by: Brylle G. Banual and Carmi Alexandra Quirante</p>
            </div>
          </div>

          <p className="hidden md:block text-sm italic text-emerald-600 text-center max-w-xs">
            "Empowering educators. Building better futures."
          </p>

          <div className={`text-xs text-right ${dark ? 'text-emerald-200/50' : 'text-gray-400'}`}>
            <p>© 2026 City College of Davao</p>
            <p>All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}