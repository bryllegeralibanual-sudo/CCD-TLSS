import { createContext, useContext } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

const ThemeContext = createContext({ dark: false, setDark: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = useDarkMode()
  return <ThemeContext.Provider value={{ dark, setDark }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() { return useContext(ThemeContext) }
