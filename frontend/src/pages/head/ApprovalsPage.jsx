import { useMemo, useState } from 'react'
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle,
  Info, ChevronDown, ChevronUp, History, Square, CheckSquare,
  MinusSquare, Layers3,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { programLabel } from '../../data/programs'
import { specMatchLabel } from '../../data/validation'
import StatusBadge from '../../components/StatusBadge'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function SectionHeader({ icon: Icon, title, sub, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(3,56,38,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: MID_GREEN }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>{title}</p>
          {sub && <p style={{ margin: 0, fontSize: 11, color: 'rgba(3,56,38,0.45)', marginTop: 1 }}>{sub}</p>}
        </div>
      </div>
      {count !== undefined && (
        <span style={{
          minWidth: 24, height: 24, borderRadius: 99,
          background: count > 0 ? 'rgba(217,180,74,0.15)' : 'rgba(3,56,38,0.07)',
          border: `1px solid ${count > 0 ? 'rgba(217,180,74,0.35)' : 'rgba(3,56,38,0.12)'}`,
          color: count > 0 ? '#92620A' : 'rgba(3,56,38,0.4)',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 8px',
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

function SelectionIcon({ checked, partial }) {
  if (checked) return <CheckSquare size={16} />
  if (partial) return <MinusSquare size={16} />
  return <Square size={16} />
}

function ProgressBar({ selected, total }) {
  const pct = total > 0 ? Math.round((selected / total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.48)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Review progress
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: selected > 0 ? MID_GREEN : 'rgba(3,56,38,0.38)' }}>
          {selected}/{total} selected
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(3,56,38,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 99,
          background: selected === total && total > 0 ? MID_GREEN : GOLD,
          transition: 'width 0.2s ease',
        }} />
      </div>
    </div>
  )
}

function PendingRow({ a, subj, fac, check, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const hasNotes = check?.notes?.length > 0
  const hasBlockers = check?.blockers?.length > 0

  return (
    <div style={{
      borderRadius: 10,
      border: `1.5px solid ${selected ? 'rgba(15,107,60,0.28)' : 'rgba(3,56,38,0.10)'}`,
      background: selected ? 'rgba(16,185,129,0.035)' : '#fff',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(3,56,38,0.04)',
    }}>
      <div style={{
        borderLeft: `3px solid ${hasBlockers ? '#DC2626' : GOLD}`,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <button
          type="button"
          onClick={() => onToggle(a.id)}
          aria-label={selected ? 'Deselect assignment' : 'Select assignment'}
          style={{
            width: 28, height: 28, borderRadius: 7,
            border: `1px solid ${selected ? 'rgba(15,107,60,0.28)' : 'rgba(3,56,38,0.13)'}`,
            background: selected ? 'rgba(15,107,60,0.10)' : 'rgba(3,56,38,0.04)',
            color: selected ? MID_GREEN : 'rgba(3,56,38,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <SelectionIcon checked={selected} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>
              {subj?.code}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(3,56,38,0.62)', fontWeight: 500 }}>
              {subj?.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: FOREST }}>
              {fac?.fn} {fac?.ln}
            </span>
            {(() => {
              if (!fac || !subj) return <span style={{ fontSize: 11, color: 'rgba(3,56,38,0.42)' }}>No specialization on file</span>
              const { level, message } = specMatchLabel(fac, subj)
              const color = level === 'strong' ? '#0F6B3C' : level === 'mismatch' ? '#991B1B' : '#92400E'
              const bg = level === 'strong' ? 'rgba(16,185,129,0.08)' : level === 'mismatch' ? 'rgba(220,38,38,0.07)' : 'rgba(217,180,74,0.12)'
              const border = level === 'strong' ? 'rgba(16,185,129,0.20)' : level === 'mismatch' ? 'rgba(220,38,38,0.18)' : 'rgba(217,180,74,0.25)'
              const icon = level === 'strong' ? '✓' : level === 'mismatch' ? '✗' : '⚠'
              return (
                <span title={message} style={{ fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${border}`, borderRadius: 99, padding: '2px 7px', cursor: 'help' }}>
                  {icon} {fac.spec ? fac.spec.split(',')[0] : 'No specialization'}
                </span>
              )
            })()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusBadge status={a.status} />
          {(hasNotes || hasBlockers) && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-label="Toggle compatibility notes"
              style={{
                width: 28, height: 28, borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(3,56,38,0.05)',
                border: '1px solid rgba(3,56,38,0.10)',
                cursor: 'pointer', color: MID_GREEN,
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {expanded && (hasNotes || hasBlockers) && (
        <div style={{ padding: '0 14px 13px 57px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {check.blockers?.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 11px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.16)' }}>
              <AlertTriangle size={12} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#991B1B' }}>{b}</p>
            </div>
          ))}
          {check.notes?.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 11px', borderRadius: 8, background: 'rgba(3,56,38,0.04)', border: '1px solid rgba(3,56,38,0.10)' }}>
              <Info size={12} style={{ color: MID_GREEN, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: FOREST }}>{n}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionGroup({
  section,
  assignments,
  selectedIds,
  finalized,
  subjectsById,
  facultyById,
  checkCompatibility,
  onToggleAssignment,
  onToggleSection,
  onBulkApprove,
  onOpenReject,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const total = assignments.length
  const selectedCount = assignments.filter(a => selectedIds.has(a.id)).length
  const allSelected = total > 0 && selectedCount === total
  const partiallySelected = selectedCount > 0 && selectedCount < total

  return (
    <div style={{
      borderRadius: 12,
      border: '1.5px solid rgba(3,56,38,0.12)',
      background: '#fff',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(3,56,38,0.05)',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: collapsed ? 'none' : '1px solid rgba(3,56,38,0.08)',
        background: 'rgba(3,56,38,0.025)',
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          type="button"
          onClick={() => onToggleSection(section, assignments)}
          disabled={finalized}
          aria-label={allSelected ? `Deselect all assignments in ${section}` : `Select all assignments in ${section}`}
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: `1px solid ${allSelected || partiallySelected ? 'rgba(15,107,60,0.28)' : 'rgba(3,56,38,0.13)'}`,
            background: allSelected || partiallySelected ? 'rgba(15,107,60,0.10)' : '#fff',
            color: allSelected || partiallySelected ? MID_GREEN : 'rgba(3,56,38,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: finalized ? 'not-allowed' : 'pointer',
            opacity: finalized ? 0.5 : 1,
          }}
        >
          <SelectionIcon checked={allSelected} partial={partiallySelected} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: FOREST, fontFamily: "'EB Garamond',Georgia,serif" }}>
              {section}
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#92620A', background: 'rgba(217,180,74,0.14)', border: '1px solid rgba(217,180,74,0.28)', borderRadius: 99, padding: '2px 8px' }}>
              {total} pending
            </span>
          </div>
          <div style={{ marginTop: 8, maxWidth: 360 }}>
            <ProgressBar selected={selectedCount} total={total} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {selectedCount === 0 ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(3,56,38,0.38)', padding: '7px 2px' }}>
              Select assignments to review
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onBulkApprove(section)}
                disabled={finalized}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 8,
                  fontSize: 12, fontWeight: 800,
                  cursor: finalized ? 'not-allowed' : 'pointer',
                  background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
                  color: '#fff', border: 'none',
                  opacity: finalized ? 0.5 : 1,
                }}
              >
                <CheckCircle2 size={13} /> Approve {selectedCount}
              </button>
              <button
                type="button"
                onClick={() => onOpenReject(section)}
                disabled={finalized}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 8,
                  fontSize: 12, fontWeight: 800,
                  cursor: finalized ? 'not-allowed' : 'pointer',
                  background: 'rgba(220,38,38,0.07)',
                  color: '#B91C1C',
                  border: '1.5px solid rgba(220,38,38,0.22)',
                  opacity: finalized ? 0.5 : 1,
                }}
              >
                <XCircle size={13} /> Reject {selectedCount}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? `Expand ${section}` : `Collapse ${section}`}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid rgba(3,56,38,0.12)',
              background: '#fff',
              color: MID_GREEN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {assignments.map(a => {
            const subj = subjectsById[a.subjectId]
            const fac = facultyById[a.facultyId]
            const check = checkCompatibility({ facultyId: a.facultyId, subjectId: a.subjectId, section: a.section, excludeId: a.id })

            return (
              <PendingRow
                key={a.id}
                a={a}
                subj={subj}
                fac={fac}
                check={check}
                selected={selectedIds.has(a.id)}
                onToggle={onToggleAssignment}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function BulkRejectPanel({ count, section, comment, onCommentChange, onConfirm, onCancel }) {
  return (
    <div style={{
      padding: 14,
      borderRadius: 12,
      background: 'rgba(220,38,38,0.045)',
      border: '1.5px solid rgba(220,38,38,0.18)',
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <XCircle size={14} style={{ color: '#B91C1C' }} />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#991B1B' }}>
          Reject {count} selected assignment{count === 1 ? '' : 's'} in {section}
        </p>
      </div>
      <textarea
        value={comment}
        onChange={e => onCommentChange(e.target.value)}
        placeholder="Reason for rejecting - the Admin-in-Charge will see this"
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '9px 12px', borderRadius: 9,
          fontSize: 12, color: FOREST,
          border: '1.5px solid rgba(220,38,38,0.3)',
          outline: 'none', resize: 'vertical',
          background: '#fff',
          fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!comment.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            fontSize: 12, fontWeight: 800,
            cursor: comment.trim() ? 'pointer' : 'not-allowed',
            background: comment.trim() ? '#DC2626' : 'rgba(220,38,38,0.15)',
            color: comment.trim() ? '#fff' : 'rgba(220,38,38,0.4)',
            border: 'none',
          }}
        >
          <XCircle size={13} /> Confirm rejection
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '7px 14px', borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
            background: '#fff',
            color: 'rgba(3,56,38,0.58)',
            border: '1px solid rgba(3,56,38,0.15)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const { account } = useAuth()
  const {
    term, isTermFinalized,
    subjectsById, facultyById,
    pendingForProgramHead, decidedForProgramHead,
    approveAssignment, rejectAssignment, checkCompatibility,
  } = useData()

  const finalized = isTermFinalized(term.ay, term.sem)
  const pending = pendingForProgramHead(account)
  const decided = decidedForProgramHead(account)

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectComment, setRejectComment] = useState('')

  const groupedPending = useMemo(() => {
    return pending.reduce((groups, assignment) => {
      const key = assignment.section || 'Unsectioned'
      if (!groups[key]) groups[key] = []
      groups[key].push(assignment)
      return groups
    }, {})
  }, [pending])

  const sectionEntries = useMemo(() => {
    return Object.entries(groupedPending).sort(([a], [b]) => a.localeCompare(b))
  }, [groupedPending])

  const validPendingIds = useMemo(() => new Set(pending.map(a => a.id)), [pending])
  const semLabel = term.sem === '1st' ? '1st' : term.sem === '2nd' ? '2nd' : 'Summer'
  const selectedForReject = rejectTarget ? sectionEntries.find(([section]) => section === rejectTarget)?.[1].filter(a => selectedIds.has(a.id)) || [] : []

  function selectedInSection(section) {
    return groupedPending[section]?.filter(a => selectedIds.has(a.id)) || []
  }

  function setCleanSelection(nextIds) {
    setSelectedIds(new Set([...nextIds].filter(id => validPendingIds.has(id))))
  }

  function handleToggleAssignment(id) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCleanSelection(next)
    if (rejectTarget) {
      const targetIds = new Set(groupedPending[rejectTarget]?.map(a => a.id) || [])
      if (!targetIds.has(id) || next.size === 0) {
        setRejectTarget(null)
        setRejectComment('')
      }
    }
  }

  function handleToggleSection(section, assignments) {
    const sectionIds = assignments.map(a => a.id)
    const allSelected = sectionIds.every(id => selectedIds.has(id))
    const next = new Set(selectedIds)

    sectionIds.forEach(id => {
      if (allSelected) next.delete(id)
      else next.add(id)
    })

    setCleanSelection(next)
    if (rejectTarget === section) {
      setRejectTarget(null)
      setRejectComment('')
    }
  }

  function clearSelection(ids) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
  }

  function handleBulkApprove(section) {
    if (finalized) return
    const selected = selectedInSection(section)
    selected.forEach(a => approveAssignment(a.id, account))
    clearSelection(selected.map(a => a.id))
    if (rejectTarget === section) {
      setRejectTarget(null)
      setRejectComment('')
    }
  }

  function handleOpenReject(section) {
    if (finalized) return
    setRejectTarget(section)
    setRejectComment('')
  }

  function handleConfirmReject() {
    if (finalized || !rejectTarget || !rejectComment.trim()) return
    const selected = selectedInSection(rejectTarget)
    selected.forEach(a => rejectAssignment(a.id, account, rejectComment.trim()))
    clearSelection(selected.map(a => a.id))
    setRejectTarget(null)
    setRejectComment('')
  }

  function handleSelectAll() {
    if (pending.length === 0) return
    setCleanSelection(new Set(pending.map(a => a.id)))
  }

  function handleDeselectAll() {
    setSelectedIds(new Set())
  }

  function handleApproveAll() {
    if (finalized || selectedIds.size === 0) return
    pending.forEach(a => {
      if (selectedIds.has(a.id)) {
        approveAssignment(a.id, account)
      }
    })
    setSelectedIds(new Set())
    setRejectTarget(null)
    setRejectComment('')
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{
          background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.05, pointerEvents: 'none' }} />
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardCheck size={16} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'EB Garamond',Georgia,serif" }}>
              Pending Your Review
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(220,252,231,0.65)', marginTop: 1 }}>
              {account.programs?.map(programLabel).join(', ')} - AY {term.ay} - {semLabel} Semester
            </p>
          </div>
          {pending.length > 0 && (
            <div style={{
              minWidth: 28, height: 28, borderRadius: 99,
              background: 'rgba(217,180,74,0.22)', border: `1px solid ${GOLD}60`,
              color: GOLD, fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 8px',
            }}>
              {pending.length}
            </div>
          )}
          {finalized && (
            <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(217,180,74,0.18)', border: `1px solid ${GOLD}50` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>Term Finalized</span>
            </div>
          )}
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {finalized && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                This term is already finalized by the Registrar - no further decisions are needed.
              </p>
            </div>
          )}

          {pending.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(3,56,38,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} style={{ color: MID_GREEN, opacity: 0.5 }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(3,56,38,0.4)' }}>
                All caught up - nothing waiting for your review.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(3,56,38,0.04)', border: '1px solid rgba(3,56,38,0.09)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Layers3 size={14} style={{ color: MID_GREEN, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(3,56,38,0.58)', fontWeight: 600 }}>
                    {sectionEntries.length} section{sectionEntries.length === 1 ? '' : 's'} grouped for bulk review.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {selectedIds.size === 0 ? (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={finalized || pending.length === 0}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 7,
                        fontSize: 11, fontWeight: 700,
                        cursor: finalized ? 'not-allowed' : 'pointer',
                        background: '#fff',
                        color: MID_GREEN,
                        border: `1.5px solid ${MID_GREEN}`,
                        opacity: finalized ? 0.5 : 1,
                      }}
                    >
                      <CheckSquare size={12} /> Select All {pending.length}
                    </button>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.58)' }}>
                        {selectedIds.size} / {pending.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={finalized}
                        style={{
                          padding: '6px 12px', borderRadius: 7,
                          fontSize: 11, fontWeight: 700,
                          cursor: finalized ? 'not-allowed' : 'pointer',
                          background: '#fff',
                          color: 'rgba(3,56,38,0.58)',
                          border: '1px solid rgba(3,56,38,0.15)',
                          opacity: finalized ? 0.5 : 1,
                        }}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveAll}
                        disabled={finalized || selectedIds.size === 0}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 7,
                          fontSize: 11, fontWeight: 700,
                          cursor: finalized ? 'not-allowed' : 'pointer',
                          background: `linear-gradient(105deg, ${FOREST} 0%, ${MID_GREEN} 100%)`,
                          color: '#fff',
                          border: 'none',
                          opacity: finalized ? 0.5 : 1,
                        }}
                      >
                        <CheckCircle2 size={12} /> Approve All
                      </button>
                    </>
                  )}
                </div>
              </div>

              {rejectTarget && selectedForReject.length > 0 && (
                <BulkRejectPanel
                  count={selectedForReject.length}
                  section={rejectTarget}
                  comment={rejectComment}
                  onCommentChange={setRejectComment}
                  onConfirm={handleConfirmReject}
                  onCancel={() => { setRejectTarget(null); setRejectComment('') }}
                />
              )}

              {sectionEntries.map(([section, assignments]) => (
                <SectionGroup
                  key={section}
                  section={section}
                  assignments={assignments}
                  selectedIds={selectedIds}
                  finalized={finalized}
                  subjectsById={subjectsById}
                  facultyById={facultyById}
                  checkCompatibility={checkCompatibility}
                  onToggleAssignment={handleToggleAssignment}
                  onToggleSection={handleToggleSection}
                  onBulkApprove={handleBulkApprove}
                  onOpenReject={handleOpenReject}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(3,56,38,0.10)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(3,56,38,0.06)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: decided.length > 0 ? '1px solid rgba(3,56,38,0.08)' : 'none' }}>
          <SectionHeader
            icon={History}
            title="Your Past Decisions"
            sub={`${term.ay} - ${semLabel} Semester`}
            count={decided.length}
          />
        </div>

        {decided.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 20px' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(3,56,38,0.35)', fontWeight: 500 }}>
              No decisions recorded yet this term.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(3,56,38,0.03)', borderBottom: '1px solid rgba(3,56,38,0.08)' }}>
                  {['Subject', 'Section', 'Faculty', 'Decision', 'Comment'].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(3,56,38,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {decided.map((a, idx) => {
                  const subj = subjectsById[a.subjectId]
                  const fac = facultyById[a.facultyId]
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: idx < decided.length - 1 ? '1px solid rgba(3,56,38,0.06)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(3,56,38,0.015)',
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: FOREST }}>{subj?.code}</span>
                        <span style={{ color: 'rgba(3,56,38,0.5)', marginLeft: 5, fontSize: 12 }}>{subj?.title}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(3,56,38,0.6)', whiteSpace: 'nowrap' }}>
                        {a.section}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: FOREST, whiteSpace: 'nowrap' }}>
                        {fac?.fn} {fac?.ln}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={a.status} />
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(3,56,38,0.45)', maxWidth: 220 }}>
                        {a.comment || <span style={{ opacity: 0.4 }}>-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}