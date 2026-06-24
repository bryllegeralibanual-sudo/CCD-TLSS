import { useState, useEffect } from 'react'
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('ccd-tlss.dark') === 'true' } catch { return false }
  })
  useEffect(() => { try { localStorage.setItem('ccd-tlss.dark', dark) } catch { /* no-op */ } }, [dark])
  return [dark, setDark]
}
