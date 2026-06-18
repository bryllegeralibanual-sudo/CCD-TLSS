export default function LoadBar({ value = 75 }) {
  return (
    <div className="loadbar" aria-label="load bar">
      <div className="loadbar__fill" style={{ width: `${value}%` }} />
    </div>
  )
}
