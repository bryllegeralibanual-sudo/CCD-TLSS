export default function Badge({ tone = 'blue', children }) {
  const tones = {
    blue: 'badge badge--blue',
    green: 'badge badge--green',
    amber: 'badge badge--amber',
    red: 'badge badge--red',
    gray: 'badge badge--gray',
  }

  return <span className={tones[tone] || tones.blue}>{children}</span>
}
