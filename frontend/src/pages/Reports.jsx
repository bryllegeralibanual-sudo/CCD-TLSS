import Badge from '../components/Badge'

export default function Reports() {
  return (
    <section className="page-grid">
      <article className="card card--highlight">
        <p className="eyebrow">Reports</p>
        <h2>Department insights</h2>
        <p className="muted">Share preparedness metrics, capacity health, and schedule compliance.</p>
      </article>
      <article className="card report-card"><h3>Coverage</h3><strong>94%</strong><Badge tone="green">On target</Badge></article>
      <article className="card report-card"><h3>Faculty Utilization</h3><strong>82%</strong><Badge tone="blue">Stable</Badge></article>
      <article className="card report-card"><h3>Risk Index</h3><strong>3</strong><Badge tone="amber">Moderate</Badge></article>
    </section>
  )
}
