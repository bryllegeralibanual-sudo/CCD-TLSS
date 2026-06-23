import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Wrap a route element: <ProtectedRoute roles={['admin']}><AdminPage/></ProtectedRoute>
// Logged-out users go to /login. Logged-in users with the wrong role get
// automatically redirected to their role's home page.
export default function ProtectedRoute({ roles, children }) {
  const { account } = useAuth()
  const location = useLocation()

  if (!account) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(account.role)) {
    return <Navigate to={roleHome(account.role)} replace />
  }

  return children
}

// eslint-disable-next-line react-refresh/only-export-components
export function roleHome(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'program_head':
      return '/head/approvals'
    case 'registrar':
      return '/registrar'
    case 'teacher':
      return '/teacher'
    default:
      return '/login'
  }
}