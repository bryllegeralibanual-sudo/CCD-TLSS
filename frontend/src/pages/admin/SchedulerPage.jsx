import { useState, useMemo, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 7 AM to 9 PM

const TIME_SLOTS = [
  { label: '7:30-9:00', start: 7.5, end: 9, duration: 1.5 },
  { label: '9:00-10:30', start: 9, end: 10.5, duration: 1.5 },
  { label: '10:30-12:00', start: 10.5, end: 12, duration: 1.5 },
  { label: '1:00-2:30', start: 13, end: 14.5, duration: 1.5 },
  { label: '2:30-4:00', start: 14.5, end: 16, duration: 1.5 },
  { label: '4:00-5:00', start: 16, end: 17, duration: 1 },
  { label: '5:00-6:30', start: 17, end: 18.5, duration: 1.5 },
  { label: '6:30-8:00', start: 18.5, end: 20, duration: 1.5 },
  { label: '8:00-9:30', start: 20, end: 21.5, duration: 1.5 },
]

function formatTime(hour) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h
  return `${display}:${String(m).padStart(2, '0')} ${period}`
}

function DraggableAssignment({ assignment, subject, faculty, dark }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'assignment',
    item: { assignment, subject, faculty },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [assignment, subject, faculty])

  return (
    <div
      ref={drag}
      className={`p-2 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${dark ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-emerald-100 border border-emerald-300'}`}
    >
      <p className="font-semibold truncate">{subject.code}</p>
      <p className={`truncate ${dark ? 'text-emerald-200/70' : 'text-gray-600'}`}>{faculty.name}</p>
    </div>
  )
}

function TimeSlotDrop({ day, slotIndex, assignments, dark, onDrop }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'assignment',
    drop: (item) => onDrop(day, slotIndex, item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [day, slotIndex])

  const slot = TIME_SLOTS[slotIndex]
  const cellAssignments = assignments.filter(
    (a) => a.day === day && a.slotIndex === slotIndex
  )

  return (
    <div
      ref={drop}
      className={`min-h-24 p-2 border-2 rounded-lg transition-all ${
        isOver
          ? `border-dashed ${dark ? 'bg-emerald-900/50 border-emerald-400' : 'bg-emerald-50 border-emerald-500'}`
          : `border-solid ${dark ? 'bg-[#101F18]/50 border-emerald-900/20' : 'bg-white/50 border-gray-200'}`
      }`}
    >
      <div className="space-y-1">
        {cellAssignments.length > 0 ? (
          cellAssignments.map((a, idx) => (
            <div
              key={idx}
              className={`p-2 rounded text-xs font-semibold ${
                dark ? 'bg-emerald-900/60 text-emerald-100 border border-emerald-700/50' : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}
            >
              <p className="truncate">{a.subject.code}</p>
              <p className={`truncate text-[10px] ${dark ? 'text-emerald-200/70' : 'text-emerald-700'}`}>
                {a.faculty.name}
              </p>
            </div>
          ))
        ) : (
          <div className={`h-20 flex items-center justify-center text-[10px] ${dark ? 'text-emerald-200/20' : 'text-gray-300'}`}>
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

function SchedulerGrid({ dark, term, assignments, subjectsById, facultyById, onDrop }) {
  return (
    <div className={`overflow-x-auto rounded-lg border ${dark ? 'border-emerald-900/30 bg-[#101F18]' : 'border-gray-200 bg-white'}`}>
      <div className="inline-block min-w-full">
        {/* Header with days */}
        <div className="grid grid-cols-6 gap-1 p-3" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
          <div className="col-span-1" />
          {DAYS.map((day) => (
            <div key={day} className="text-center">
              <p className={`font-bold text-sm ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{day}</p>
            </div>
          ))}
        </div>

        <div className={`border-t ${dark ? 'border-emerald-900/20' : 'border-gray-200'}`} />

        {/* Time slots and grid */}
        <div className="space-y-1 p-3">
          {TIME_SLOTS.map((slot, slotIndex) => (
            <div key={slotIndex} className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
              <div className={`flex items-center justify-center text-xs font-semibold py-2 px-1 ${dark ? 'text-emerald-200' : 'text-gray-600'}`}>
                {slot.label}
              </div>
              {DAYS.map((day) => (
                <TimeSlotDrop
                  key={`${day}-${slotIndex}`}
                  day={day}
                  slotIndex={slotIndex}
                  assignments={assignments}
                  dark={dark}
                  onDrop={onDrop}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SchedulerPage() {
  const { dark } = useTheme()
  const { term, termAssignments, subjectsById, facultyById } = useData()
  const [schedule, setSchedule] = useState([])
  const [selectedView, setSelectedView] = useState('grid')

  // Get approved assignments
  const approvedAssignments = useMemo(() => {
    const ta = termAssignments(term.ay, term.sem)
    return ta.filter((a) => a.status === 'approved')
  }, [term, termAssignments])

  // Handle drop
  const handleDrop = useCallback((day, slotIndex, { assignment, subject, faculty }) => {
    // Check for conflicts
    const existingOnDay = schedule.filter((s) => s.day === day && s.slotIndex === slotIndex)

    if (existingOnDay.length >= 2) {
      alert('This slot is full (max 2 classes per slot)')
      return
    }

    // Add to schedule
    setSchedule((prev) => [
      ...prev.filter((s) => !(s.assignment.id === assignment.id)), // Remove if exists
      {
        day,
        slotIndex,
        assignment,
        subject,
        faculty,
      },
    ])
  }, [schedule])

  // Unscheduled assignments
  const unscheduledAssignments = useMemo(() => {
    const scheduledIds = new Set(schedule.map((s) => s.assignment.id))
    return approvedAssignments.filter((a) => !scheduledIds.has(a.id))
  }, [approvedAssignments, schedule])

  const card = dark ? 'bg-[#101F18] border-emerald-900/50' : 'bg-white border-gray-100'

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`space-y-6 p-6 ${dark ? 'bg-[#0a1410]' : 'bg-gradient-to-br from-emerald-50/40 to-blue-50/40'}`}>
        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-[#10241A]'}`}
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Schedule Generator</h1>
          <p className={`text-sm ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>
            Drag and drop assignments to create your weekly schedule • AY {term.ay} • {term.sem}
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unscheduled assignments panel */}
          <div className={`rounded-2xl border p-5 ${card} lg:row-span-2 h-fit`}>
            <h3 className={`font-bold text-sm mb-4 ${dark ? 'text-white' : 'text-[#10241A]'}`}
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Unscheduled</h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unscheduledAssignments.length > 0 ? (
                unscheduledAssignments.map((a) => (
                  <DraggableAssignment
                    key={a.id}
                    assignment={a}
                    subject={subjectsById[a.subject_id]}
                    faculty={facultyById[a.faculty_id]}
                    dark={dark}
                  />
                ))
              ) : (
                <div className={`text-center py-8 text-xs ${dark ? 'text-emerald-200/40' : 'text-gray-400'}`}>
                  All assignments scheduled! 🎉
                </div>
              )}
            </div>

            {/* Stats */}
            <div className={`mt-4 pt-4 border-t ${dark ? 'border-emerald-900/20' : 'border-gray-200'} space-y-2 text-xs`}>
              <div className="flex justify-between">
                <span className={dark ? 'text-emerald-200/60' : 'text-gray-600'}>Total assignments:</span>
                <span className={`font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{approvedAssignments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className={dark ? 'text-emerald-200/60' : 'text-gray-600'}>Scheduled:</span>
                <span className={`font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{schedule.length}</span>
              </div>
              <div className="flex justify-between">
                <span className={dark ? 'text-emerald-200/60' : 'text-gray-600'}>Remaining:</span>
                <span className={`font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{unscheduledAssignments.length}</span>
              </div>
            </div>

            {/* Progress */}
            <div className={`mt-4 h-2 rounded-full ${dark ? 'bg-emerald-900/30' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${approvedAssignments.length > 0 ? (schedule.length / approvedAssignments.length) * 100 : 0}%`,
                  background: GOLD,
                }}
              />
            </div>
          </div>

          {/* Schedule grid */}
          <div className="lg:col-span-3">
            <SchedulerGrid
              dark={dark}
              term={term}
              assignments={schedule}
              subjectsById={subjectsById}
              facultyById={facultyById}
              onDrop={handleDrop}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={`rounded-2xl border p-5 ${card} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {schedule.length === approvedAssignments.length ? (
              <>
                <CheckCircle2 size={16} className="text-green-500" />
                <span className={`text-sm font-semibold ${dark ? 'text-green-300' : 'text-green-700'}`}>
                  Schedule complete! Ready to save.
                </span>
              </>
            ) : (
              <>
                <Clock size={16} className={dark ? 'text-amber-400' : 'text-amber-500'} />
                <span className={`text-sm font-semibold ${dark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {unscheduledAssignments.length} assignments remaining
                </span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}>
              Clear All
            </button>
            <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              dark ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`} disabled={schedule.length !== approvedAssignments.length}>
              Save Schedule
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
