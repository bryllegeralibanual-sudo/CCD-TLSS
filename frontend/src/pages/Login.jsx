import { useState, useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Mail, Lock, Eye, EyeOff, Sun, Moon, ShieldCheck, Users, FileText, GraduationCap,
  CalendarCheck2, CalendarDays, CheckCircle2, User, BarChart3, LogIn, UserCheck,
  UserRound, Headset, ChevronRight, Loader2,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { roleHome } from '../auth/ProtectedRoute'
import btvtedCrest from '../assets/images/btvted-crest.png'
import ccdLogo from '../assets/images/ccd-logo.png'
import ccdBg from '../assets/images/ccd-bg.png'

// ─── UI UX Pro Max Skill Applied ──────────────────────────────────────────────
// Responsive: mobile-first, 375 / 768 / 1024 / 1280+ breakpoints
// Touch: 44px min tap targets, touch-action: manipulation, 8px+ spacing
// Motion: 150-300ms, prefers-reduced-motion, GPU-accelerated transforms only
// Forms: inline validation, loading state, success state
// A11y: focus rings, aria-labels, cursor-pointer, contrast 4.5:1
// ─────────────────────────────────────────────────────────────────────────────

// Single gold token — every "gold" accent in the page reads from this one
// value instead of two near-identical hexes drifting apart over time.
const GOLD = '#D9B44A'

const ROLE_QUICK_ACCESS = [
  { role: 'admin',        label: 'Administrator', icon: ShieldCheck,   email: 'admin@ccd.edu.ph',           password: 'admin123'     },
  { role: 'program_head', label: 'Program Head',  icon: Users,         email: 'head.btvted@ccd.edu.ph',    password: 'head123'      },
  { role: 'registrar',    label: 'Registrar',     icon: FileText,      email: 'registrar@ccd.edu.ph',      password: 'registrar123' },
  { role: 'teacher',      label: 'Faculty',       icon: GraduationCap, email: 'romel.salazar@ccd.edu.ph',  password: 'teacher123'   },
]

// Modern feature cards — icon, title, short supporting description.
// Accent color alternates green / gold across the grid for visual rhythm.
const FEATURES = [
  { icon: User,           label: 'Smart Workload Distribution', desc: 'Balanced teaching loads for faculty.' },
  { icon: CalendarCheck2, label: 'Automated Scheduling',         desc: 'Intelligent scheduling with minimal conflict.' },
  { icon: CheckCircle2,   label: 'Conflict Detection',           desc: 'Identify and resolve scheduling conflicts.' },
  { icon: GraduationCap,  label: 'Academic Planning',            desc: 'Streamlined curriculum and term planning.' },
  { icon: BarChart3,      label: 'Reports & Analytics',          desc: 'Real-time insights for better decisions.' },
]

const TRUST_BADGES = [
  { icon: Lock,       label: 'Secure Authentication' },
  { icon: UserCheck,  label: 'Role-Based Access'     },
  { icon: ShieldCheck,label: 'Data Protection'       },
]

// Live clock — ticks once a minute. Nothing on this page needs second-level
// precision, and a faster interval was re-rendering the whole form every
// second just to update a timestamp.
function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
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

// Isolated so the live clock's once-a-minute tick re-renders only this one
// line — not the email/password inputs, focus state, or anything else above.
function LiveStatusLine() {
  const now = useLiveClock()
  const dateLabel = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'rgba(220,252,231,0.7)' }}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      System Online
      <span className="opacity-60">•</span>
      <span className="tabular-nums">{dateLabel} • {timeLabel}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Login() {
  const { account, login, error } = useAuth()
  const location   = useLocation()
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
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen w-full flex items-start justify-center transition-colors duration-500 ${
      isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5 items-center'
    } ${dark ? 'bg-[#0A1410]' : 'bg-[#F3F4EF]'}`}
      style={{
        backgroundImage: dark
          ? `linear-gradient(rgba(4, 20, 14, 0.86), rgba(4, 20, 14, 0.92)), url(${ccdBg})`
          : `linear-gradient(rgba(243, 244, 239, 0.76), rgba(243, 244, 239, 0.86)), url(${ccdBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700;800&family=Great+Vibes&display=swap');

        @media (prefers-reduced-motion: no-preference) {
          .aurora-1   { animation: aurora1 17s ease-in-out infinite; }
          .aurora-2   { animation: aurora2 21s ease-in-out infinite; }
          .particle   { animation: particleRise linear infinite; }
          .reveal     { animation: revealUp .55s cubic-bezier(.16,1,.3,1) both; }
          .reveal-d1  { animation-delay: .07s; }
          .reveal-d2  { animation-delay: .14s; }
          .reveal-d3  { animation-delay: .21s; }
          .reveal-d4  { animation-delay: .28s; }
        }

        @keyframes aurora1      { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(26px,-18px) scale(1.1);} }
        @keyframes aurora2      { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-22px,20px) scale(1.06);} }
        @keyframes particleRise { 0%{transform:translateY(0);opacity:0;} 12%{opacity:.65;} 88%{opacity:.3;} 100%{transform:translateY(-150px);opacity:0;} }
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
        .feature-item:hover { transform: translateY(-3px); }

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
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(3, 56, 38, 0.96) 0%, rgba(5, 83, 53, 0.85) 48%, rgba(5, 83, 53, 0.58) 100%), url(${ccdBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
              {/* bg layers — kept quiet on purpose: the photo + gradient already carry
                  the atmosphere, so ambient effects are a light touch, not a second focal point */}
              <div className="absolute top-0 left-0 w-2/3 h-1/2 opacity-[0.10] pointer-events-none" style={{ backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize:'16px 16px' }} />
              <div className="aurora-1 absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
              <div className="aurora-2 absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-800/35 blur-3xl pointer-events-none" />
              {[{l:'14%',b:'10%',s:4,dur:'9s',del:'0s'},{l:'48%',b:'16%',s:4,dur:'11s',del:'1.6s'},{l:'78%',b:'12%',s:3,dur:'10s',del:'0.8s'}].map((p,i) => (
                <span key={i} className="particle absolute rounded-full bg-emerald-200/55 pointer-events-none"
                  style={{ left:p.l, bottom:p.b, width:p.s, height:p.s, animationDuration:p.dur, animationDelay:p.del }} />
              ))}

              {/* TOP */}
              <div className="relative z-10 p-8 pb-0">
                <div className="relative">
                  {/* Logo */}
                  <div className="reveal flex items-center gap-3">
                    <div className="w-[72px] h-[72px] shrink-0 rounded-full overflow-hidden hover:scale-105 transition-transform duration-300"
                      style={{ boxShadow:'0 0 0 3px rgba(217,180,74,0.65),0 8px 20px rgba(0,0,0,0.3)' }}>
                      <img src={ccdLogo} className="w-full h-full object-cover" alt="CCD Logo" />
                    </div>
                    <div>
                      <h2
                        style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'clamp(1.35rem, 2.1vw, 1.875rem)', textShadow:'0 1px 4px rgba(0,0,0,0.35)' }}
                        className="text-white font-extrabold uppercase tracking-tight leading-tight whitespace-nowrap"
                      >
                        City College of Davao
                      </h2>
                      <p
                        className="mt-1.5 text-lg sm:text-xl leading-none"
                        style={{ color: GOLD, fontFamily: "'Great Vibes', cursive", fontWeight: 700, textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}
                      >
                        Dedicated to Excellence, Committed to Service
                      </p>
                    </div>
                  </div>
                  {/* Headline */}
                  <div className="reveal reveal-d1 mt-6">
                    <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'2.55rem', textShadow:'0 1px 4px rgba(0,0,0,0.35)' }} className="text-white font-extrabold uppercase tracking-tight leading-[1.05]">Teacher Load &amp;</h1>
                    <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'2.55rem', color:'#5EE8A0', textShadow:'0 1px 4px rgba(0,0,0,0.35)' }} className="font-extrabold uppercase tracking-tight leading-[1.05]">Scheduling System</h1>
                    <div className="w-12 h-1 rounded-full mt-3 mb-3" style={{ backgroundColor: GOLD }} />
                    <p className="text-white/90 font-medium text-sm leading-relaxed">Every load capped. Every conflict caught<br/>before enrollment opens.</p>
                  </div>
                  {/* Features — modern cards */}
                  <div className="reveal reveal-d2 grid grid-cols-2 gap-3 mt-5">
                    {FEATURES.map((f, idx) => {
                      const gold = idx % 2 === 1
                      const isLast = idx === FEATURES.length - 1
                      return (
                        <div
                          key={f.label}
                          className={`feature-item rounded-2xl border p-3.5 ${isLast ? 'col-span-2' : ''}`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.14)' }}
                        >
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                            style={{ backgroundColor: gold ? 'rgba(217,180,74,0.2)' : 'rgba(94,232,160,0.18)' }}
                          >
                            <f.icon size={16} style={{ color: gold ? GOLD : '#5EE8A0' }} />
                          </span>
                          <p className="text-white font-bold text-sm leading-tight mb-1">{f.label}</p>
                          <p className="text-white/60 text-xs leading-snug">{f.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* BOTTOM */}
              <div className="relative z-10 px-8 pb-6 mt-4">
                {/* Signature moment: the one card on this page tied to something real —
                    an actual academic term — gets a quiet gold-tinted border instead of
                    the neutral white/15 used everywhere else, so it reads as the page's
                    one deliberate accent rather than just another panel. */}
                <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border hover:bg-white/[0.15] transition-colors duration-200"
                  style={{ backgroundColor:'rgba(255,255,255,0.1)', borderColor:'rgba(217,180,74,0.28)' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:'rgba(217,180,74,0.18)' }}>
                      <CalendarDays size={18} style={{ color: GOLD }} />
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
                <LiveStatusLine />
              </div>
            </div>

          ) : (
            /* ─── MOBILE & TABLET: compact top banner ───────────────────── */
            <div className={`relative overflow-hidden ${isTablet ? 'rounded-t-3xl' : 'rounded-t-2xl'}`}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(3, 56, 38, 0.95) 0%, rgba(5, 83, 53, 0.83) 52%, rgba(5, 83, 53, 0.58) 100%), url(${ccdBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize:'14px 14px' }} />
              <div className="aurora-1 absolute -top-16 -left-10 w-64 h-64 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />

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
                        <p style={{ fontFamily:"'EB Garamond',Georgia,serif", textShadow:'0 1px 4px rgba(0,0,0,0.35)' }} className="text-white font-extrabold uppercase tracking-tight text-lg leading-tight">City College of Davao</p>
                        <p className="mt-0.5" style={{ color: GOLD, fontSize:16, fontFamily: "'Great Vibes', cursive", fontWeight: 700, textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>Dedicated to Excellence, Committed to Service</p>
                      </div>
                    </div>
                    <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'1.85rem', textShadow:'0 1px 4px rgba(0,0,0,0.35)' }} className="text-white font-extrabold uppercase tracking-tight leading-tight">
                      Teacher Load &amp; <span style={{ color:'#5EE8A0' }}>Scheduling System</span>
                    </h1>
                    <div className="w-10 h-0.5 rounded-full mt-2.5 mb-2.5" style={{ backgroundColor: GOLD }} />
                    {/* Features — compact cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {FEATURES.slice(0, 4).map((f, idx) => {
                        const gold = idx % 2 === 1
                        return (
                          <div
                            key={f.label}
                            className="rounded-xl border px-2.5 py-2 flex items-center gap-2"
                            style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.14)' }}
                          >
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: gold ? 'rgba(217,180,74,0.2)' : 'rgba(94,232,160,0.18)' }}
                            >
                              <f.icon size={12} style={{ color: gold ? GOLD : '#5EE8A0' }} />
                            </span>
                            <span className="text-white/85 text-xs leading-tight">{f.label}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 mt-4 text-xs" style={{ color:'rgba(220,252,231,0.65)', fontSize:10 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      System Online • AY 2026–2027 • 1st Semester
                    </div>
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
                      <p style={{ fontFamily:"'EB Garamond',Georgia,serif", textShadow:'0 1px 4px rgba(0,0,0,0.35)' }} className="text-white font-extrabold uppercase tracking-tight text-base leading-tight">City College of Davao</p>
                      <p style={{ color: GOLD, fontSize:15, fontFamily: "'Great Vibes', cursive", fontWeight: 700, textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>Dedicated to Excellence, Committed to Service</p>
                    </div>
                  </div>
                  <h1 style={{ fontFamily:"'EB Garamond',Georgia,serif", fontSize:'1.3rem', textShadow:'0 1px 4px rgba(0,0,0,0.35)' }} className="text-white font-extrabold uppercase tracking-tight leading-snug">
                    Teacher Load &amp; <span style={{ color:'#5EE8A0' }}>Scheduling System</span>
                  </h1>
                  <div className="w-8 h-0.5 rounded-full my-2" style={{ backgroundColor: GOLD }} />
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
            isMobile  ? 'px-5 pb-5 pt-16'     :
            isTablet  ? 'px-7 pb-7 pt-16'     :
                        'p-8 xl:p-10'
          } ${dark ? 'bg-[#0F1C16]/90 text-[#E8EDE9]' : 'bg-[#F7F8F5] text-[#10241A]'}`}
            style={{
              minHeight: isDesktop ? 700 : 'auto',
              backgroundImage: dark
                ? `linear-gradient(rgba(15, 28, 22, 0.88), rgba(15, 28, 22, 0.94)), url(${ccdBg})`
                : `linear-gradient(rgba(247, 248, 245, 0.86), rgba(247, 248, 245, 0.92)), url(${ccdBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
            }}
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

            {/* Form card */}
            <div className={`w-full mx-auto rounded-3xl border px-5 py-6 sm:px-8 sm:py-8 backdrop-blur-2xl backdrop-saturate-150 ${
              isDesktop ? 'max-w-[440px]' : isTablet ? 'max-w-[460px]' : 'max-w-full'
            } ${
              dark
                ? 'border-white/10 bg-[#101F18]/68 shadow-[0_24px_70px_rgba(0,0,0,0.38)]'
                : 'border-white/70 bg-white/62 shadow-[0_24px_70px_rgba(16,36,26,0.16)]'
            } ${formVisible ? 'reveal' : 'opacity-0'}`}>
              <div className="pointer-events-none absolute inset-px rounded-[calc(1.5rem-1px)]"
                style={{
                  background: dark
                    ? 'linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 42%, rgba(16,185,129,0.06))'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(255,255,255,0.30) 46%, rgba(16,185,129,0.08))',
                  boxShadow: dark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.03)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(16,36,26,0.04)',
                }}
              />
              <div className="relative z-10">

              {/* Avatar */}
              <div className={`mx-auto rounded-full flex items-center justify-center mb-4 ${
                isMobile ? 'w-10 h-10' : 'w-12 h-12'
              } ${dark ? 'bg-emerald-500/15' : 'bg-white/70'}`}>
                <UserRound size={isMobile ? 18 : 22} className="text-emerald-600" />
              </div>

              <h2 style={{ fontFamily:"'EB Garamond',Georgia,serif" }}
                className={`text-center font-extrabold mb-1.5 ${formVisible ? 'reveal reveal-d1' : 'opacity-0'} ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Welcome <span className="text-emerald-600">Back!</span> <span aria-hidden>👋</span>
              </h2>
              <p className={`mb-5 text-center ${dark ? 'text-emerald-200/70' : 'text-gray-500'} ${formVisible ? 'reveal reveal-d1' : 'opacity-0'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
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


