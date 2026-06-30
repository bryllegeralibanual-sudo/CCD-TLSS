// Priority-based early-finish scheduler used by SchedulerPage.
export function runGreedySchedule({ approved, subjectsById, facultyById, rooms, yearBlocks, settings }) {
  const OFF_CAMPUS = /(field study|internship|practicum|supervised industrial|work-based learning)/i
  const CLASS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const OPEN = 450
  const CLOSE = 1290
  const SLOT = 30
  const LUNCH_BREAK = { day: 'Everyday', start: 720, end: 780 }

  function needsRoom(subject) {
    return !OFF_CAMPUS.test(`${subject?.title || ''} ${subject?.code || ''}`) && ((subject?.lec || 0) > 0 || (subject?.lab || 0) > 0)
  }

  function isPESubject(subject) {
    const text = `${subject?.code || ''} ${subject?.title || ''}`
    return /(^|\s)(PE|P\.E\.?|PATH\s*FIT)\b/i.test(text) || /Physical Education/i.test(text)
  }

  function isNSTPSubject(subject) {
    return /^NSTP\b/i.test(subject?.code || '') || /National Service Training Program/i.test(subject?.title || '')
  }

  function isComputerLab(room) {
    return room?.type === 'Computer Lab' || /computer lab/i.test(room?.name || '')
  }

  function isActivityVenue(room) {
    return /gym|social hall/i.test(`${room?.name || ''} ${room?.type || ''}`)
  }

  function isRegularClassroom(room) {
    return room?.type === 'Classroom' || room?.type === 'Speech Lab' || room?.type === 'Science Lab'
  }

  function effectiveLabRoomType(subject) {
    if (['BECED', 'BSENTREP'].includes(subject?.prog)) return 'Classroom'
    if (subject?.prog === 'BTVTED-CP') return subject?.labRoomType || 'Computer Lab'
    if (subject?.prog === 'BTVTED-HVACRT') return subject?.labRoomType || 'HVAC Lab'
    return subject?.labRoomType || 'Classroom'
  }

  function effectiveLectureRoomType(subject) {
    return subject?.lecRoomType || 'Classroom'
  }

  function overlaps(a, b) {
    return a.day === b.day && a.start < b.end && b.start < a.end
  }

  function ruleOverlaps(rule, candidate) {
    return (rule.day === 'Everyday' || rule.day === candidate.day) && rule.start < candidate.end && candidate.start < rule.end
  }

  function isFree(map, key, candidate) {
    return !(map.get(key) || []).some(item => overlaps(item, candidate))
  }

  function addUsage(map, key, item) {
    if (!key) return
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }

  function removeUsage(map, key, item) {
    if (!key || !map.has(key)) return
    map.set(key, map.get(key).filter(existing => existing !== item))
  }

  function violatesBreaks(candidate) {
    return [LUNCH_BREAK, ...(settings?.scheduleBreaks || [])].some(item => ruleOverlaps(item, candidate))
  }

  function unavailableForFaculty(facultyId) {
    return (settings?.facultyUnavailable || []).filter(item => String(item.facultyId) === String(facultyId))
  }

  function preferredWindowForFaculty(faculty) {
    const start = Number(faculty?.preferredTimeStart || 0)
    const end = Number(faculty?.preferredTimeEnd || 0)
    return start && end && start < end ? { start, end } : null
  }

  function roomMatches(room, roomType, program, subject, allowCrossProgramFallback = false, day = null) {
    if (!roomType || room.status === 'Inactive') return false
    const isGym = room.type === 'Gym' || /gym/i.test(room.name)
    if (isGym && day === 'Saturday' && !isNSTPSubject(subject)) return false
    if (isActivityVenue(room) && !isPESubject(subject) && !(isGym && isNSTPSubject(subject) && day === 'Saturday')) return false
    if (isPESubject(subject) && isActivityVenue(room)) return true

    const hvacrtWeldingOk = program === 'BTVTED-HVACRT' && room.type === 'Welding Lab' && ['Classroom', 'HVAC Lab', 'Welding Lab'].includes(roomType)
    const typeOk = room.type === roomType || (roomType === 'Classroom' && isRegularClassroom(room)) || hvacrtWeldingOk
    if (!typeOk) return false
    if (isComputerLab(room) && program !== 'BTVTED-CP') return false

    return isNSTPSubject(subject) || !room.prog || room.prog === program || allowCrossProgramFallback
  }

  function roomScore(room, task) {
    const priority = settings?.roomPriority || {}
    let score = 0
    if (priority[task.subject.prog] === room.id) score -= 60
    if (room.prog === task.subject.prog) score -= 25
    if (task.subject.prog === 'BTVTED-HVACRT' && ['HVAC Lab', 'Welding Lab'].includes(room.type)) score -= 35
    score += Number(room.capacity || 0) / 10
    score += (roomUse.get(room.id) || []).length
    return score
  }

  function meetingPatterns(hours, subject) {
    if (isNSTPSubject(subject)) return [{ days: ['Saturday'], minutes: hours * 60 }]
    if (hours === 1) return CLASS_DAYS.map(day => ({ days: [day], minutes: 60 }))
    if (hours === 2) return [
      { days: ['Tuesday', 'Thursday'], minutes: 60 },
      { days: ['Monday', 'Wednesday'], minutes: 60 },
      { days: ['Wednesday', 'Friday'], minutes: 60 },
      { days: ['Monday', 'Friday'], minutes: 60 },
      { days: ['Monday'], minutes: 120 },
      { days: ['Tuesday'], minutes: 120 },
      { days: ['Wednesday'], minutes: 120 },
      { days: ['Thursday'], minutes: 120 },
      { days: ['Friday'], minutes: 120 },
    ]
    if (hours === 3) return [
      { days: ['Monday', 'Wednesday', 'Friday'], minutes: 60 },
      { days: ['Monday', 'Tuesday', 'Wednesday'], minutes: 60 },
      { days: ['Tuesday', 'Wednesday', 'Thursday'], minutes: 60 },
      { days: ['Wednesday', 'Thursday', 'Friday'], minutes: 60 },
      { days: ['Tuesday', 'Thursday'], minutes: 90 },
      { days: ['Monday', 'Wednesday'], minutes: 90 },
      { days: ['Monday', 'Friday'], minutes: 90 },
      { days: ['Wednesday', 'Friday'], minutes: 90 },
      { days: ['Monday'], minutes: 180 },
      { days: ['Tuesday'], minutes: 180 },
      { days: ['Wednesday'], minutes: 180 },
      { days: ['Thursday'], minutes: 180 },
      { days: ['Friday'], minutes: 180 },
    ]
    return [
      { days: ['Monday', 'Wednesday', 'Friday'], minutes: Math.ceil((hours * 60) / 3) },
      { days: ['Tuesday', 'Thursday'], minutes: Math.ceil((hours * 60) / 2) },
      { days: ['Monday'], minutes: hours * 60 },
    ]
  }

  function startCandidates(window, duration) {
    const starts = []
    for (let start = window.start; start + duration <= window.end; start += SLOT) starts.push(start)
    return starts
  }

  function candidateWindows(task, allowFullDayFallback = false) {
    const block = yearBlocks?.[task.subject.yr] || { start: OPEN, end: CLOSE }
    const facultyWindow = preferredWindowForFaculty(facultyById[task.assignment.facultyId])
    const windows = []
    if (facultyWindow) {
      windows.push({ start: Math.max(block.start, facultyWindow.start), end: Math.min(block.end, facultyWindow.end) })
    }
    windows.push(block)
    if (allowFullDayFallback) windows.push({ start: OPEN, end: CLOSE })
    return windows.filter((window, index, source) => (
      window.start < window.end &&
      source.findIndex(item => item.start === window.start && item.end === window.end) === index
    ))
  }

  function timeLabel(minutes) {
    const hour24 = Math.floor(minutes / 60)
    const minute = minutes % 60
    const suffix = hour24 >= 12 ? 'PM' : 'AM'
    const hour = hour24 % 12 || 12
    return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
  }

  function placementFailureReason(task, allowCrossProgramFallback = true, allowFullDayFallback = true) {
    const block = yearBlocks?.[task.subject.yr] || { start: OPEN, end: CLOSE, label: 'Flexible' }
    const windows = candidateWindows(task, allowFullDayFallback)
    const facultyRules = unavailableForFaculty(task.assignment.facultyId)
    const counts = {
      starts: 0,
      break: 0,
      facultyUnavailable: 0,
      facultyConflict: 0,
      sectionConflict: 0,
      noRoom: 0,
    }
    const matchingRooms = activeRooms.filter(room => roomMatches(room, task.roomType, task.subject.prog, task.subject, allowCrossProgramFallback, task.days[0]))

    if (!matchingRooms.length) {
      return `No active ${task.roomType} matches ${task.subject.prog}${allowCrossProgramFallback ? '' : ' room ownership rules'}.`
    }

    for (const window of windows) {
      for (const start of startCandidates(window, task.duration)) {
        counts.starts += 1
        const candidates = task.days.map(day => ({ day, start, end: start + task.duration }))
        if (candidates.some(candidate => violatesBreaks(candidate))) {
          counts.break += 1
          continue
        }
        if (candidates.some(candidate => facultyRules.some(rule => ruleOverlaps(rule, candidate)))) {
          counts.facultyUnavailable += 1
          continue
        }
        if (!candidates.every(candidate => isFree(facultyUse, task.assignment.facultyId, candidate))) {
          counts.facultyConflict += 1
          continue
        }
        if (!candidates.every(candidate => isFree(sectionUse, task.assignment.section, candidate))) {
          counts.sectionConflict += 1
          continue
        }
        if (!matchingRooms.some(room => candidates.every(slot => isFree(roomUse, room.id, slot)))) {
          counts.noRoom += 1
        }
      }
    }

    const parts = []
    if (counts.sectionConflict) parts.push('section already has a class')
    if (counts.facultyConflict) parts.push('faculty already has a class')
    if (counts.facultyUnavailable) parts.push('faculty unavailable rule')
    if (counts.noRoom) parts.push(`no free ${task.roomType}`)
    if (counts.break) parts.push('blocked break period')
    const scope = `within Year ${task.subject.yr} ${block.label || 'block'} (${timeLabel(block.start)}-${timeLabel(block.end)})`

    if (!counts.starts) return `No ${task.duration / 60}h start time fits ${scope}.`
    return parts.length
      ? `No ${task.kind.toLowerCase()} slot fits ${scope}; checked ${counts.starts} start time(s), blocked by ${parts.join(', ')}.`
      : `No ${task.kind.toLowerCase()} slot fits ${scope}.`
  }

  function findPlacement(task, allowCrossProgramFallback = false, allowFullDayFallback = false) {
    const facultyRules = unavailableForFaculty(task.assignment.facultyId)
    let best = null

    for (const window of candidateWindows(task, allowFullDayFallback)) {
      for (const start of startCandidates(window, task.duration)) {
        const candidates = task.days.map(day => ({ day, start, end: start + task.duration }))
        if (candidates.some(candidate => violatesBreaks(candidate))) continue
        if (candidates.some(candidate => facultyRules.some(rule => ruleOverlaps(rule, candidate)))) continue
        if (!candidates.every(candidate => isFree(facultyUse, task.assignment.facultyId, candidate))) continue
        if (!candidates.every(candidate => isFree(sectionUse, task.assignment.section, candidate))) continue

        const room = activeRooms
          .filter(candidate => roomMatches(candidate, task.roomType, task.subject.prog, task.subject, allowCrossProgramFallback, task.days[0]))
          .filter(candidate => candidates.every(slot => isFree(roomUse, candidate.id, slot)))
          .sort((a, b) => roomScore(a, task) - roomScore(b, task) || a.name.localeCompare(b.name))[0]

        if (!room) continue

        const rows = candidates.map(candidate => ({
          ...task,
          ...candidate,
          room,
          faculty: facultyById[task.assignment.facultyId] || null,
        }))
        const latestEnd = Math.max(...rows.map(row => row.end))
        const score = latestEnd * 1000 + start + roomScore(room, task)
        if (!best || score < best.score) best = { rows, score }
      }
      if (best) return best.rows
    }

    return null
  }

  function commit(rows) {
    rows.forEach(row => {
      addUsage(roomUse, row.room.id, row)
      addUsage(facultyUse, row.assignment.facultyId, row)
      addUsage(sectionUse, row.assignment.section, row)
      scheduled.push(row)
    })
  }

  function rollback(rows) {
    rows.forEach(row => {
      removeUsage(roomUse, row.room.id, row)
      removeUsage(facultyUse, row.assignment.facultyId, row)
      removeUsage(sectionUse, row.assignment.section, row)
    })
    scheduled.splice(scheduled.length - rows.length, rows.length)
  }

  function sectionSortValue(section = '') {
    const match = section.match(/(\d+)([A-Z])?$/i)
    return match ? `${section.replace(/\s*\d+[A-Z]?$/i, '')}-${match[1].padStart(2, '0')}-${match[2] || ''}` : section
  }

  function difficulty(group) {
    return (group.labOptions.length ? 1000 : 0) +
      (isNSTPSubject(group.subject) ? 900 : 0) +
      ({ 1: 800, 2: 600, 3: 400, 4: 200 }[group.subject.yr] || 100)
  }

  const activeRooms = rooms.filter(room => room.status !== 'Inactive')
  const roomUse = new Map()
  const facultyUse = new Map()
  const sectionUse = new Map()
  const scheduled = []
  const unscheduled = []
  const offCampus = []

  const groups = approved.map(assignment => {
    const subject = subjectsById[assignment.subjectId]
    if (!subject) return null
    if (!needsRoom(subject)) return { assignment, subject, offCampus: true, lectureOptions: [], labOptions: [] }

    const lectureOptions = subject.lec > 0
      ? meetingPatterns(subject.lec, subject).map(pattern => [{
          kind: 'Lecture',
          assignment,
          subject,
          roomType: effectiveLectureRoomType(subject),
          duration: pattern.minutes,
          days: pattern.days,
        }])
      : []
    const labOptions = subject.lab > 0
      ? (isNSTPSubject(subject) ? ['Saturday'] : CLASS_DAYS).map(day => [{
          kind: 'Laboratory',
          assignment,
          subject,
          roomType: effectiveLabRoomType(subject),
          duration: subject.lab * 180,
          days: [day],
        }])
      : []
    return { assignment, subject, offCampus: false, lectureOptions, labOptions }
  }).filter(Boolean).sort((a, b) => (
    (a.subject?.yr || 9) - (b.subject?.yr || 9) ||
    difficulty(b) - difficulty(a) ||
    sectionSortValue(a.assignment.section).localeCompare(sectionSortValue(b.assignment.section)) ||
    a.subject.code.localeCompare(b.subject.code)
  ))

  for (const group of groups) {
    if (group.offCampus) {
      offCampus.push({ kind: 'offcampus', assignment: group.assignment, subject: group.subject, roomType: '', duration: 0, days: [] })
      continue
    }

    const groupRows = []
    let failed = null

    if (group.lectureOptions.length) {
      let placedLecture = null
      for (const option of group.lectureOptions) {
        placedLecture = findPlacement(option[0], false, false)
        if (placedLecture) break
      }
      if (!placedLecture) {
        for (const option of group.lectureOptions) {
          placedLecture = findPlacement(option[0], true, true)
          if (placedLecture) break
        }
      }
      if (!placedLecture) {
        const task = group.lectureOptions[0][0]
        failed = { task, type: 'no-slot', reason: placementFailureReason(task) }
      } else {
        commit(placedLecture)
        groupRows.push(...placedLecture)
      }
    }

    if (!failed) {
      if (group.labOptions.length) {
        let placedLab = null
        for (const option of group.labOptions) {
          placedLab = findPlacement(option[0], false, false)
          if (placedLab) break
        }
        if (!placedLab) {
          for (const option of group.labOptions) {
            placedLab = findPlacement(option[0], true, true)
            if (placedLab) break
          }
        }
        if (!placedLab) {
          const task = group.labOptions[0][0]
          failed = { task, type: 'no-slot', reason: placementFailureReason(task) }
        } else {
          commit(placedLab)
          groupRows.push(...placedLab)
        }
      }
    }

    if (failed) {
      rollback(groupRows)
      unscheduled.push(failed)
    }
  }

  return { scheduled, unscheduled, offCampus }
}
