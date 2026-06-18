import { useAppContext } from '../context/useAppContext.js'
import Badge from '../components/Badge'

export default function Faculty() {
  const { faculty } = useAppContext()

  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Faculty</p>
        <h2>Faculty roster and workload</h2>
        <p className="muted">Review engagement, availability, and current capacity across departments.</p>
      </article>
      <div className="faculty-grid">
        {faculty.map((person) => (
          <article className="card faculty-card" key={person.id}>
            <Badge tone="blue">{person.availability}</Badge>
            <h3>{person.name}</h3>
            <p className="muted">{person.role}</p>
            <strong>{person.load}% load</strong>
          </article>
        ))}
      </div>
    </section>
  )
}
