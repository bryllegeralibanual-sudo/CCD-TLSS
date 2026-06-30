import { useMemo, useState } from 'react'
import {
  AlertTriangle, Building2, CheckCircle2, DoorOpen, FlaskConical, MapPin,
  RefreshCw, Save, AlertCircle, Clock, Users,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useData } from '../../data/DataContext'
import { PROGRAMS, programLabel } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function getRowKey(assignmentId, kind, day) {
  return `${assignmentId}-${kind}-${day}`
}

// Helper function to get available rooms based on schedule constraints
function getRoomSuitability(room, scheduleRow) {
  if (room.status === 'Inactive') return { suitable: false, reason: 'Room is inactive' }

  const isLab = scheduleRow.kind === 'Laboratory'
  const needsType = scheduleRow.roomType
  const typeMatch = room.type === needsType || (needsType === 'Classroom' && /classroom|speech/i.test(room.type))

  if (!typeMatch) return { suitable: false, reason: `Requires ${needsType}` }

  // Check if room is allocated to a specific program
  if (room.prog && room.prog !== '' && scheduleRow.subject?.prog !== room.prog) {
    return { suitable: false, reason: `Reserved for ${room.prog}` }
  }

  return { suitable: true, reason: 'Available' }
}

function RoomAssignmentCard({ schedule, room, scheduleRows, onAssign, onUnassign, assignments }) {
  const [expandedRowId, setExpandedRowId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showConflicts, setShowConflicts] = useState(false)

  function getAssignedRoomId(row) {
    const rowKey = getRowKey(row.assignment.id, row.kind, row.day)
    return assignments?.[rowKey] || row.room?.id || null
  }

  const assignedRows = (scheduleRows || []).filter(row => getAssignedRoomId(row) === room.id)
  const unassignedRows = (scheduleRows || []).filter(row => !getAssignedRoomId(row))

  // Check for conflicts: same room, overlapping times, same day
  function findConflicts(row, room) {
    return (scheduleRows || [])
      .filter(r => {
        const assignedRoomId = getAssignedRoomId(r)
        return assignedRoomId === room.id && r.day === row.day && r.start < row.end && row.start < r.end && r.assignment.id !== row.assignment.id
      })
      .length > 0
  }

  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
            {room.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-emerald-950/60">{room.type} • Capacity: {room.capacity}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${room.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {room.status}
        </span>
      </div>

      <div className="space-y-2 border-t border-emerald-900/10 pt-4">
        <p className="text-xs font-bold uppercase text-emerald-950/45">Schedule assignments ({assignedRows.length})</p>
        {assignedRows.map(row => (
          <div key={`${row.assignment.id}-${row.kind}-${row.day}`} className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
            <div className="text-sm">
              <p className="font-bold text-emerald-950">{row.subject.code}</p>
              <p className="text-xs text-emerald-950/60">{row.day} • {row.subject.title}</p>
            </div>
            <button
              onClick={() => onUnassign(row.assignment.id, row.kind, row.day)}
              className="text-xs font-bold text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {unassignedRows.length > 0 && (
        <div className="mt-4 border-t border-emerald-900/10 pt-4">
          <p className="mb-3 text-xs font-bold uppercase text-emerald-950/45">Available slots to assign</p>
          <div className="space-y-2">
            {unassignedRows.map(row => {
              const hasConflict = findConflicts(row, room)
              const suitability = getRoomSuitability(room, row)
              return (
                <div
                  key={`${row.assignment.id}-${row.kind}-${row.day}`}
                  className={`rounded-lg p-3 ${hasConflict ? 'border-2 border-red-300 bg-red-50' : 'border border-amber-200 bg-amber-50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-amber-900">{row.subject.code}</p>
                      <p className="mt-0.5 text-xs text-amber-800/75">{row.kind} • {row.day}</p>
                      {hasConflict && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-700">
                          <AlertCircle size={12} /> Time conflict with existing class
                        </p>
                      )}
                      {!suitability.suitable && (
                        <p className="mt-1 text-xs text-amber-700">{suitability.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onAssign(row.assignment.id, row.kind, row.day, room.id)}
                      disabled={hasConflict || !suitability.suitable}
                      className="shrink-0 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RoomAssignmentPage() {
  const { account } = useAuth()
  const { term, rooms, savedScheduleForTerm, assignRoomsToSchedule } = useData()
  const [filterType, setFilterType] = useState('ALL')
  const [sortBy, setSortBy] = useState('name')
  const [autoStrategy, setAutoStrategy] = useState('maximize_classrooms')
  const [showConflictWarnings, setShowConflictWarnings] = useState(true)
  const [pendingAssignments, setPendingAssignments] = useState({})

  const savedSchedule = savedScheduleForTerm(term.ay, term.sem)
  const scheduleStatus = savedSchedule?.status
  const isApproved = scheduleStatus === 'approved'
  const isAssigned = scheduleStatus === 'room_assigned'

  const scheduleRows = useMemo(() => {
    if (!savedSchedule?.scheduled) return []
    return savedSchedule.scheduled
  }, [savedSchedule])

  const roomTypes = useMemo(
    () => Array.from(new Set(rooms.map(r => r.type))).sort(),
    [rooms]
  )

  const visibleRooms = useMemo(() => {
    return rooms
      .filter(r => filterType === 'ALL' || r.type === filterType)
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'utilization') {
          const aUse = scheduleRows.filter(row => row.room?.id === a.id).length
          const bUse = scheduleRows.filter(row => row.room?.id === b.id).length
          return bUse - aUse
        }
        if (sortBy === 'type') return a.type.localeCompare(b.type)
        return 0
      })
  }, [rooms, filterType, sortBy, scheduleRows])

  function getResolvedRoomId(row, assignmentsMap = pendingAssignments) {
    const rowKey = getRowKey(row.assignment.id, row.kind, row.day)
    return assignmentsMap?.[rowKey] || row.room?.id || null
  }

  const unassignedCount = scheduleRows.filter(r => !getResolvedRoomId(r)).length
  const assignedCount = scheduleRows.filter(r => getResolvedRoomId(r)).length
  const totalCount = scheduleRows.length

  function handleAssign(assignmentId, kind, day, roomId) {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return

    const rowKey = `${assignmentId}-${kind}-${day}`
    setPendingAssignments(prev => ({
      ...prev,
      [rowKey]: roomId,
    }))
  }

  function handleUnassign(assignmentId, kind, day) {
    const rowKey = `${assignmentId}-${kind}-${day}`
    setPendingAssignments(prev => {
      const next = { ...prev }
      delete next[rowKey]
      return next
    })
  }

  function handleAutoAssign() {
    if (!scheduleRows.length) return

    const nextAssignments = { ...pendingAssignments }
    const assignmentCounts = {}
    const unassignedRows = scheduleRows.filter(row => !getResolvedRoomId(row, nextAssignments))
    const sortedRows = [...unassignedRows].sort((a, b) => {
      if (a.kind === 'Laboratory' && b.kind !== 'Laboratory') return -1
      if (a.kind !== 'Laboratory' && b.kind === 'Laboratory') return 1
      return (b.duration || 60) - (a.duration || 60)
    })

    const activeRooms = rooms.filter(room => room.status === 'Active')
    const targetUsage = activeRooms.length > 0 ? Math.ceil(sortedRows.length / activeRooms.length) : 0

    sortedRows.forEach(row => {
      const rowKey = getRowKey(row.assignment.id, row.kind, row.day)
      const candidates = activeRooms.filter(room => {
        const suitability = getRoomSuitability(room, row)
        if (!suitability.suitable) return false

        const hasConflict = scheduleRows.some(otherRow => {
          if (otherRow.assignment.id === row.assignment.id && otherRow.kind === row.kind && otherRow.day === row.day) return false
          const otherRoomId = nextAssignments[getRowKey(otherRow.assignment.id, otherRow.kind, otherRow.day)] || otherRow.room?.id || null
          return otherRoomId === room.id && otherRow.day === row.day && otherRow.start < row.end && row.start < otherRow.end
        })

        return !hasConflict
      })

      if (!candidates.length) return

      const bestRoom = [...candidates].sort((a, b) => {
        const aUsage = assignmentCounts[a.id] || 0
        const bUsage = assignmentCounts[b.id] || 0

        if (autoStrategy === 'balanced') {
          const aScore = Math.abs((aUsage + 1) - targetUsage)
          const bScore = Math.abs((bUsage + 1) - targetUsage)
          if (aScore !== bScore) return aScore - bScore
        } else if (autoStrategy === 'best_fit') {
          if (a.capacity !== b.capacity) return a.capacity - b.capacity
        } else {
          if (aUsage !== bUsage) return aUsage - bUsage
        }

        return a.capacity - b.capacity
      })[0]

      if (bestRoom) {
        nextAssignments[rowKey] = bestRoom.id
        assignmentCounts[bestRoom.id] = (assignmentCounts[bestRoom.id] || 0) + 1
      }
    })

    setPendingAssignments(nextAssignments)
  }

  function handleSaveAssignments() {
    if (Object.keys(pendingAssignments).length === 0) return

    // Create the room assignments map
    const roomAssignments = {}
    Object.entries(pendingAssignments).forEach(([rowKey, roomId]) => {
      roomAssignments[rowKey] = {
        roomId,
        roomName: rooms.find(r => r.id === roomId)?.name,
      }
    })

    assignRoomsToSchedule(term.ay, term.sem, roomAssignments, account)
    setPendingAssignments({})
  }

  if (!savedSchedule) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="flex items-center gap-2 text-lg font-black text-amber-900">
            <AlertTriangle size={20} /> No schedule available
          </p>
          <p className="mt-2 text-sm text-amber-800">
            Create and save a schedule first before assigning rooms.
          </p>
        </div>
      </div>
    )
  }

  if (!isApproved && !isAssigned) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <p className="flex items-center gap-2 text-lg font-black text-blue-900">
            <AlertTriangle size={20} /> Schedule not yet approved
          </p>
          <p className="mt-2 text-sm text-blue-800">
            Current status: <span className="font-bold">{scheduleStatus || 'draft'}</span>
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Submit the schedule for approval in the Scheduler before assigning rooms.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(105deg, ${FOREST}, ${MID_GREEN})` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Building2 size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              Room Assignment
            </p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-100/70">
              AY {term.ay} - {term.sem} Semester • {isAssigned ? '✓ Rooms assigned' : 'Ready for assignment'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Total Classes</p>
            <p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {totalCount}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Assigned</p>
            <p className="mt-1 text-2xl font-black text-green-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {assignedCount}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Unassigned</p>
            <p className="mt-1 text-2xl font-black text-amber-700" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {unassignedCount}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Rooms Available</p>
            <p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {rooms.filter(r => r.status === 'Active').length}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase text-emerald-950/45">Completion</p>
            <p className="mt-1 text-2xl font-black text-emerald-950" style={{ fontFamily: "'EB Garamond',Georgia,serif" }}>
              {totalCount ? Math.round((assignedCount / totalCount) * 100) : 0}%
            </p>
          </div>
        </div>

        {unassignedCount === 0 && assignedCount > 0 && (
          <div className="mx-4 my-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-green-800">
              <CheckCircle2 size={16} /> All classes have rooms assigned!
            </p>
          </div>
        )}

        {unassignedCount > 0 && (
          <>
            <div className="mx-4 my-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-amber-800">
                <AlertCircle size={16} /> {unassignedCount} classes still need rooms
              </p>
              <p className="mt-1 text-xs text-amber-800/75">
                Use the auto assignment tool to spread classes across rooms while avoiding time conflicts.
              </p>
            </div>

            <div className="mx-4 mb-4 flex flex-wrap gap-2">
              <button
                onClick={handleAutoAssign}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white hover:opacity-90"
                style={{ background: MID_GREEN }}
              >
                <RefreshCw size={14} /> Auto Assign
              </button>
              {Object.keys(pendingAssignments).length > 0 && (
                <>
                  <button
                    onClick={handleSaveAssignments}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white hover:opacity-90"
                    style={{ background: MID_GREEN }}
                  >
                    <Save size={14} /> Save {Object.keys(pendingAssignments).length} Assignment{Object.keys(pendingAssignments).length !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => setPendingAssignments({})}
                    className="rounded-lg border border-emerald-950/15 px-4 py-2 text-sm font-black text-emerald-950 hover:bg-emerald-50"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </>
        )}

        <div className="border-t border-emerald-950/10 px-4 py-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-emerald-950/45">Room Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="mt-1 rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none"
              >
                <option value="ALL">All types</option>
                {roomTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-emerald-950/45">Auto Strategy</label>
              <select
                value={autoStrategy}
                onChange={e => setAutoStrategy(e.target.value)}
                className="mt-1 rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none"
              >
                <option value="maximize_classrooms">Maximize classrooms</option>
                <option value="balanced">Balanced utilization</option>
                <option value="best_fit">Best fit capacity</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-emerald-950/45">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="mt-1 rounded-lg border border-emerald-950/15 bg-white px-3 py-2 text-sm font-bold text-emerald-950 outline-none"
              >
                <option value="name">Room Name</option>
                <option value="type">Room Type</option>
                <option value="utilization">Utilization</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {visibleRooms.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visibleRooms.map(room => (
            <RoomAssignmentCard
              key={room.id}
              schedule={savedSchedule}
              room={room}
              scheduleRows={scheduleRows}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
              assignments={pendingAssignments}
            />
          ))}
        </div>
      )}
    </div>
  )
}
