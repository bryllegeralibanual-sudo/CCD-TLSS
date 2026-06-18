import { NavLink } from 'react-router-dom'
import { Briefcase, ClipboardCheck, LayoutDashboard, GraduationCap, CalendarDays } from 'lucide-react'

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin/loads', label: 'Load Assignment', icon: Briefcase },
    { to: '/scheduler', label: 'Scheduler (legacy)', icon: CalendarDays },
  ],
  program_head: [{ to: '/head/approvals', label: 'Approvals', icon: ClipboardCheck }],
  registrar: [
    { to: '/registrar', label: 'Finalize Loads', icon: LayoutDashboard },
    { to: '/scheduler', label: 'Scheduler (legacy)', icon: CalendarDays },
  ],
  teacher: [{ to: '/teacher', label: 'My Load', icon: GraduationCap }],
}

export default function Sidebar({ role }) {
  const items = NAV_BY_ROLE[role] || []
  return (
    <aside className="w-60 min-w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">CCD TLSS</h2>
        <p className="text-xs text-gray-500 mt-0.5">Teacher Load &amp; Scheduling System</p>
      </div>
      <nav className="p-2 flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-[#E6F1FB] text-[#185FA5] font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}