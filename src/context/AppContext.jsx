import { useMemo, useState } from 'react'
import { AppContext } from './AppContext'

const defaultFaculty = [
  { id: 1, name: 'Dr. Amina Shah', role: 'Head of Department', load: 82, availability: 'Full Week' },
  { id: 2, name: 'Prof. Daniel Cruz', role: 'Algorithms Lead', load: 71, availability: 'Mon–Thu' },
  { id: 3, name: 'Ms. Leena Rao', role: 'Lab Coordinator', load: 64, availability: 'Flexible' },
]

const defaultSchedule = [
  { id: 1, day: 'Mon', slot: '09:00', subject: 'Data Structures', faculty: 'Dr. Amina Shah', room: 'A-101' },
  { id: 2, day: 'Tue', slot: '11:00', subject: 'Database Systems', faculty: 'Prof. Daniel Cruz', room: 'B-204' },
  { id: 3, day: 'Wed', slot: '13:00', subject: 'AI Lab', faculty: 'Ms. Leena Rao', room: 'Lab-2' },
]

export function AppProvider({ children }) {
  const [faculty, setFaculty] = useState(defaultFaculty)
  const [schedule, setSchedule] = useState(defaultSchedule)
  const [selectedPage, setSelectedPage] = useState('Dashboard')

  const value = useMemo(
    () => ({
      faculty,
      setFaculty,
      schedule,
      setSchedule,
      selectedPage,
      setSelectedPage,
    }),
    [faculty, schedule, selectedPage],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
