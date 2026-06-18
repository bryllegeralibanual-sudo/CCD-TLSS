import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({ title, fullBleed = false }) {
  const { account } = useAuth()
  return (
    <div className="flex h-screen bg-[#ebe9e3] overflow-hidden">
      <Sidebar role={account.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className={fullBleed ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}