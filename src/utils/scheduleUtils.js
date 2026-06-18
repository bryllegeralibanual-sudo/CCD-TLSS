export function checkConflicts(schedule) {
  return schedule.filter((item) => item.faculty && item.day && item.slot)
}

export function getScheduleCoverage(schedule) {
  return Math.min(100, Math.round((schedule.length / 5) * 100))
}

export function formatSlot(slot) {
  return slot || 'TBA'
}
