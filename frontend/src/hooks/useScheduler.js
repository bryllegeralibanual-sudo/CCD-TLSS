import { useMemo } from 'react'

export function useScheduler(schedule) {
  return useMemo(() => {
    const conflicts = schedule.filter((item) => item.faculty === 'Dr. Amina Shah' && item.day === 'Mon')
    const coverage = Math.min(100, Math.round((schedule.length / 5) * 100))

    return {
      conflicts,
      coverage,
      summary: `${schedule.length} active sessions tracked`,
    }
  }, [schedule])
}
