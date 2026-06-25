import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { findAccount, findAccountById, saveAccountOverride } from './accounts'

const AuthContext = createContext(null)
const STORAGE_KEY = 'ccd-tlss.session-account-id'

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    return savedId ? findAccountById(savedId) : null
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) localStorage.setItem(STORAGE_KEY, account.id)
    else localStorage.removeItem(STORAGE_KEY)
  }, [account])

  const login = (email, password) => {
    const found = findAccount(email, password)
    if (!found) {
      setError('Incorrect email or password.')
      return false
    }
    setError('')
    setAccount(found)
    return true
  }

  const logout = () => setAccount(null)
  const updateAccount = (patch) => {
    if (!account) return null
    const updated = saveAccountOverride(account.id, patch)
    if (updated) setAccount(updated)
    return updated
  }

  const value = useMemo(() => ({ account, login, logout, updateAccount, error, setError }), [account, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
