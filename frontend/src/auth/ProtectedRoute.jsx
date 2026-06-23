import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Wrap a route element: <ProtectedRoute roles={['admin']}><AdminPage/></ProtectedRoute>
// Logged-out users go to /login. Logged-in users with the wrong role get a
// clear "not allowed" notice instead of a silent redirect.
export default function ProtectedRoute({ roles, children }) {
  const { account, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null // or a spinner — avoids a flash redirect to /login on refresh
  }

  if (!account) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(account.role)) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2 style={{ marginBottom: 8 }}>Not authorized</h2>
        <p style={{ color: '#6b6b67' }}>
          Your account ({account.role.replace('_', ' ')}) doesn't have access to this page.
        </p>
      </div>
    )
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