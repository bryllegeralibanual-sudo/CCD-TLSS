import { useState } from 'react'
import Badge from '../components/Badge'

export default function LoadAssignment() {
  const [dragged, setDragged] = useState(null)

  const assignments = [
    { id: 1, name: 'AI Lab', faculty: 'Ms. Leena Rao', status: 'Ready' },
    { id: 2, name: 'Algorithms', faculty: 'Prof. Daniel Cruz', status: 'Needs review' },
  ]

  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Load Assignment</p>
        <h2>Faculty workload workspace</h2>
        <p className="muted">Drag cards to balance teaching effort and departmental capacity.</p>
      </article>
      <article className="card">
        <h3>Dropzone</h3>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => setDragged(null)}
        >
          Drop a course card here to assign or rebalance workload.
        </div>
      </article>
      <article className="card">
        <h3>Assignments</h3>
        {assignments.map((item) => (
          <div
            key={item.id}
            className="assignment-card"
            draggable
            onDragStart={() => setDragged(item.name)}
          >
            <strong>{item.name}</strong>
            <span>{item.faculty}</span>
            <Badge tone={item.status === 'Ready' ? 'green' : 'amber'}>{item.status}</Badge>
          </div>
        ))}
        {dragged && <p className="muted">Dragging: {dragged}</p>}
      </article>
    </section>
  )
}
