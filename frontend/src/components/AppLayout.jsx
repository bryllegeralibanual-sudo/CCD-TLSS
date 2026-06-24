import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useTheme } from '../context/ThemeContext'

export default function AppLayout({ title, fullBleed = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { dark } = useTheme()

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#0A1410]' : 'bg-[#F3F4EF]'}`}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className={fullBleed ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto p-4 sm:p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
