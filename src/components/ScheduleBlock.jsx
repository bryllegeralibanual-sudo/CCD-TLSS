export default function ScheduleBlock({ item }) {
  return (
    <article className="schedule-block">
      <strong>{item.subject}</strong>
      <span>{item.day} · {item.slot}</span>
      <small>{item.faculty}</small>
      <em>{item.room}</em>
    </article>
  )
}
