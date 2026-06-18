import Badge from '../components/Badge'
import LoadBar from '../components/LoadBar'
import ScheduleBlock from '../components/ScheduleBlock'
import { useAppContext } from '../context/useAppContext.js'

export default function Dashboard() {
  const { faculty, schedule } = useAppContext()

  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Overview</p>
        <h2>Department scheduling pulse</h2>
        <p className="muted">Monitor faculty allocation, compliance, and schedule readiness at a glance.</p>
      </article>
      <article className="card stat-grid">
        <div className="stat-card"><Badge tone="blue">Active</Badge><strong>18</strong><span>Current sessions</span></div>
        <div className="stat-card"><Badge tone="green">Healthy</Badge><strong>94%</strong><span>Coverage</span></div>
        <div className="stat-card"><Badge tone="amber">Watch</Badge><strong>3</strong><span>Pending conflicts</span></div>
        <div className="stat-card"><Badge tone="gray">Faculty</Badge><strong>{faculty.length}</strong><span>Assigned teachers</span></div>
      </article>
      <article className="card">
        <div className="section-head"><h3>Faculty load</h3><Badge tone="blue">Updated</Badge></div>
        {faculty.map((person) => (
          <div key={person.id} className="load-row">
            <div>
              <strong>{person.name}</strong>
              <p className="muted">{person.role}</p>
            </div>
            <div className="load-meta"><span>{person.load}%</span><LoadBar value={person.load} /></div>
          </div>
        ))}
      </article>
      <article className="card">
        <div className="section-head"><h3>Upcoming schedule</h3><Badge tone="green">Live</Badge></div>
        <div className="schedule-list">{schedule.map((item) => <ScheduleBlock key={item.id} item={item} />)}</div>
      </article>
    </section>
  )
}
