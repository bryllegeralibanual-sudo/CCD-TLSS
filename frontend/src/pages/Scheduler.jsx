import { useAppContext } from '../context/useAppContext.js'
import Badge from '../components/Badge'

export default function Scheduler() {
  const { schedule } = useAppContext()

  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Scheduler</p>
        <h2>Timetable generation</h2>
        <p className="muted">Review the current timetable flow, next generation steps, and published blocks.</p>
      </article>
      <article className="card">
        <h3>Generation steps</h3>
        <ol className="step-list">
          <li>Validate faculty availability</li>
          <li>Balance room capacity</li>
          <li>Publish timetable board</li>
        </ol>
      </article>
      <article className="card">
        <h3>Current timetable</h3>
        {schedule.map((item) => (
          <div key={item.id} className="mini-row">
            <strong>{item.subject}</strong>
            <span>{item.day} {item.slot}</span>
            <Badge tone="blue">{item.room}</Badge>
          </div>
        ))}
      </article>
    </section>
  )
}
