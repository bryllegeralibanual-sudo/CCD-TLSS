const CONFIG = {
  pending:   { dot: 'bg-amber-400 animate-pulse', pill: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pending Review' },
  approved:  { dot: 'bg-emerald-500',             pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved'       },
  rejected:  { dot: 'bg-red-400',                 pill: 'bg-red-50 text-red-700 border-red-200',             label: 'Rejected'       },
  withdrawn: { dot: 'bg-gray-400',                pill: 'bg-gray-100 text-gray-500 border-gray-200',         label: 'Withdrawn'      },
  finalized: { dot: 'bg-emerald-500',             pill: 'bg-emerald-50 text-emerald-800 border-emerald-300', label: 'Finalized'      },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const c = CONFIG[status] || CONFIG.withdrawn
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    } ${c.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}
