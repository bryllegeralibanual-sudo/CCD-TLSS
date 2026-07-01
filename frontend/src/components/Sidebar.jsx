import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, CalendarDays, ClipboardCheck,
  ShieldCheck, GraduationCap, LogOut, ChevronRight, X,
  BookOpen, Users, Building2, MapPin, AlertCircle, UserCog,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import ccdLogo from '../assets/images/ccd-logo.webp'
import ccdBg from '../assets/images/ccd-bg.webp'

const GOLD = '#D9B44A'
const NAV = {
  admin:        [
    { section: 'Overview', items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/approvals', label: 'Approval Status', icon: ClipboardCheck, badge: false },
    ] },
    { section: 'Faculty', items: [
      { to: '/admin/faculty', label: 'Faculty', icon: Users },
      { to: '/admin/loads', label: 'Load Assignment', icon: Briefcase },
    ] },
    { section: 'Resources', items: [
      { to: '/admin/curriculum', label: 'Curriculum Prospectus', icon: BookOpen },
      { to: '/admin/rooms', label: 'Rooms & Labs', icon: Building2 },
    ] },
    { section: 'Scheduling', items: [
      { to: '/scheduler', label: 'Schedule Generator', icon: CalendarDays },
      { to: '/admin/room-assignment', label: 'Room Assignment', icon: MapPin },
    ] },
    { section: 'Administration', items: [
      { to: '/admin/users', label: 'User Management', icon: UserCog },
    ] },
  ],
  program_head: [
    { section: 'Program Head', items: [
      { to: '/head/approvals', label: 'Schedule Approval', icon: ClipboardCheck, badge: true },
      { to: '/head/faculty', label: 'Faculty', icon: Users },
      { to: '/head/curriculum', label: 'Curriculum', icon: BookOpen },
    ] },
  ],
  registrar:    [
    { section: 'Registrar', items: [
      { to: '/registrar', label: 'Finalize Schedule', icon: ShieldCheck },
      { to: '/scheduler', label: 'Scheduler', icon: CalendarDays },
    ] },
  ],
  teacher:      [{ section: 'Faculty', items: [{ to: '/teacher', label: 'My Load', icon: GraduationCap }] }],
}
const ROLE_LABELS = { admin:'Administrator', program_head:'Program Head', registrar:'Registrar', teacher:'Faculty' }
const initials = (n='') => n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()

export default function Sidebar({ open, onClose }) {
  const { account, logout } = useAuth()
  const { term, getPendingSchedulesForPH } = useData()
  const pendingCount = account?.role === 'program_head' ? getPendingSchedulesForPH(account).length : 0
  const groups = NAV[account?.role] || []

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col overflow-hidden w-[260px] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto lg:shrink-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundImage:`linear-gradient(160deg,rgba(3,56,38,0.97) 0%,rgba(5,83,53,0.93) 55%,rgba(3,56,38,0.97) 100%),url(${ccdBg})`, backgroundSize:'cover', backgroundPosition:'center' }}>
        <style>{`
          @keyframes sb-aurora1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(20px,-14px) scale(1.08);}}
          @keyframes sb-aurora2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-16px,16px) scale(1.05);}}
          @keyframes sb-in{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);}}
          .sb-a1{animation:sb-aurora1 18s ease-in-out infinite;}
          .sb-a2{animation:sb-aurora2 22s ease-in-out infinite;}
          .sb-item{animation:sb-in .28s ease both;}
          @media(prefers-reduced-motion:reduce){.sb-a1,.sb-a2,.sb-item{animation:none;}}
        `}</style>
        <div className="sb-a1 absolute -top-20 -left-10 w-60 h-60 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none"/>
        <div className="sb-a2 absolute bottom-10 -right-10 w-56 h-56 rounded-full bg-emerald-700/30 blur-3xl pointer-events-none"/>
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1.4px)',backgroundSize:'14px 14px'}}/>
        <button onClick={onClose} className="lg:hidden absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10" aria-label="Close sidebar"><X size={16}/></button>

        {/* HEADER */}
        <div className="relative z-10 p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 hover:scale-105 transition-transform duration-300" style={{boxShadow:`0 0 0 2.5px ${GOLD},0 4px 12px rgba(0,0,0,0.3)`}}>
              <img src={ccdLogo} alt="CCD" className="w-full h-full object-cover"/>
            </div>
            <div className="min-w-0">
              <p className="text-white font-extrabold uppercase tracking-tight leading-tight text-sm truncate" style={{fontFamily:"'EB Garamond',Georgia,serif"}}>City College of Davao</p>
              <p className="text-[10px] mt-0.5 truncate" style={{color:'rgba(220,252,231,0.65)'}}>AY {term.ay} · {term.sem==='1st'?'1st':term.sem==='2nd'?'2nd':'Summer'} Semester</p>
            </div>
          </div>
          <div className="mt-3 px-2 py-1.5 rounded-lg" style={{backgroundColor:'rgba(217,180,74,0.12)',border:'1px solid rgba(217,180,74,0.2)'}}>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{color:GOLD}}>{ROLE_LABELS[account?.role]||'User'} Portal</p>
          </div>
        </div>

        {/* NAV */}
        <nav className="relative z-10 flex-1 p-3 space-y-0.5 overflow-y-auto">
          {groups.map((group, groupIndex) => (
            <div key={group.section}>
              <p className="text-[9px] uppercase tracking-widest font-bold px-3 py-2" style={{color:'rgba(220,252,231,0.4)'}}>{group.section}</p>
              {group.items.map(({to,label,icon:Icon,badge},i)=>(
                <NavLink key={to} to={to} onClick={onClose}
                  className={({isActive})=>`sb-item flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive?'text-white':'text-white/65 hover:text-white hover:bg-white/8'}`}
                  style={({isActive})=>isActive?{backgroundColor:'rgba(217,180,74,0.14)',borderLeft:`3px solid ${GOLD}`,paddingLeft:'0.625rem'}:{animationDelay:`${(groupIndex + i)*0.05}s`}}>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'rgba(255,255,255,0.07)'}}><Icon size={15}/></span>
                    <span className="text-sm font-medium truncate">{label}</span>
                  </span>
                  {badge&&pendingCount>0
                    ?<span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1.5" style={{backgroundColor:GOLD,color:'#033826'}}>{pendingCount}</span>
                    :<ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0"/>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* USER */}
        <div className="relative z-10 p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{backgroundColor:'rgba(255,255,255,0.05)'}}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{background:'linear-gradient(135deg,#0F6B3C,#1FA84F)',boxShadow:`0 0 0 2px ${GOLD}`}}>{initials(account?.name)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{account?.name}</p>
              <p className="text-[10px] truncate" style={{color:'rgba(220,252,231,0.55)'}}>{account?.email}</p>
            </div>
            <button onClick={logout} aria-label="Log out" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"><LogOut size={13}/></button>
          </div>
        </div>
      </aside>
    </>
  )
}
