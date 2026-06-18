import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { roleHome } from '../auth/ProtectedRoute'
import { DEMO_LOGINS } from '../auth/accounts'

export default function Login() {
  const { account, login, error } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (account) {
    const dest = location.state?.from?.pathname || roleHome(account.role)
    return <Navigate to={dest} replace />
  }

  function handleSubmit(e) {
    e.preventDefault()
    login(email, password)
  }

  function quickLogin(demo) {
    login(demo.email, demo.password)
  }

  return (
    <div className="min-h-screen bg-[#ebe9e3] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-lg font-semibold text-gray-900">CCD TLSS</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Teacher Load &amp; Scheduling System — sign in</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@ccd.edu.ph"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#185FA5] text-white px-4 py-2 text-sm font-medium hover:bg-[#0C447C]"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Demo accounts (mock auth — no real backend yet)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_LOGINS.map((demo) => (
              <button
                key={demo.email}
                onClick={() => quickLogin(demo)}
                className="text-xs text-left rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                <div className="font-medium text-gray-800">{demo.label}</div>
                <div className="text-gray-400">{demo.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}