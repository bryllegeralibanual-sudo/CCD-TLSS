import Badge from '../components/Badge'

export default function Conflicts() {
  const conflicts = [
    { id: 1, issue: 'Room A-101 double booked at 09:00', level: 'High' },
    { id: 2, issue: 'Faculty load exceeds threshold by 4%', level: 'Medium' },
  ]

  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Conflicts</p>
        <h2>Conflict monitor</h2>
        <p className="muted">Identify blockers, urgency, and quick actions to resolve scheduling issues.</p>
      </article>
      <article className="card">
        {conflicts.map((item) => (
          <div key={item.id} className="conflict-row">
            <div>
              <strong>{item.issue}</strong>
              <p className="muted">Needs attention before publication.</p>
            </div>
            <Badge tone={item.level === 'High' ? 'red' : 'amber'}>{item.level}</Badge>
          </div>
        ))}
      </article>
    </section>
  )
}
