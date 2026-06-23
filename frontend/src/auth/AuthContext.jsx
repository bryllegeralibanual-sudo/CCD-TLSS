import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from './api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'ccd-tlss.token'

// Maps the backend UserResponse shape to the `account` shape pages already
// consume (see accounts.js, now retired): { id, email, role, name, programs, facultyId }
function toAccount(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name || user.email,
    programs: user.programs || [],
    facultyId: user.facultyId ?? null,
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // On load, if a token exists, fetch the current profile to restore the session.
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.me(token)
      .then((user) => setAccount(toAccount(user)))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password)
      localStorage.setItem(TOKEN_KEY, res.access_token)
      setToken(res.access_token)
      setAccount(toAccount(res.user))
      setError('')
      return true
    } catch (e) {
      setError(e.message || 'Incorrect email or password.')
      return false
    }
  }

  const logout = () => {
    if (token) api.logout(token).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setAccount(null)
  }

  const value = useMemo(
    () => ({ account, login, logout, error, setError, loading, token }),
    [account, error, loading, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
