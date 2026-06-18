import { CalendarDays, ClipboardList, LayoutDashboard, Users, BookOpen, FileBarChart2, AlertTriangle, Wrench } from 'lucide-react'

const items = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Faculty', icon: Users },
  { label: 'Curriculum', icon: BookOpen },
  { label: 'Load Assignment', icon: ClipboardList },
  { label: 'Scheduler', icon: CalendarDays },
  { label: 'Conflicts', icon: AlertTriangle },
  { label: 'Reports', icon: FileBarChart2 },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">CCD TLSS</p>
        <h2>Timetable Core</h2>
        <p className="muted">Plan faculty loads, resolve conflicts, and publish schedules.</p>
      </div>
      <nav className="nav-stack">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${active === label ? 'active' : ''}`}
            onClick={() => onNavigate(label)}
            type="button"
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <Wrench size={16} />
        <strong>Live scheduling</strong>
        <span>Automated conflict checks and faculty coverage insights.</span>
      </div>
    </aside>
  )
}
