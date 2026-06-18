export default function Topbar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Academic Operations</p>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      <button className="primary-button" type="button">Generate Report</button>
    </header>
  )
}
