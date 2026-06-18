export default function Curriculum() {
  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Curriculum</p>
        <h2>Course structure and prospectus</h2>
        <p className="muted">Track modules, topic coverage, and curriculum readiness.</p>
      </article>
      <article className="card">
        <h3>Curriculum folders</h3>
        <ul className="bullet-list">
          <li>Semester 1 – Core Computing</li>
          <li>Semester 2 – Applied Mathematics</li>
          <li>Semester 3 – Data & AI</li>
        </ul>
      </article>
      <article className="card">
        <h3>Prospectus snapshot</h3>
        <p className="muted">All prospectus revisions are synced with the timetable planner and faculty load dashboard.</p>
      </article>
    </section>
  )
}
