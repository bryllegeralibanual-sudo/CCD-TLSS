import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { DataProvider } from './data/DataContext'
import ProtectedRoute, { roleHome } from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import SchedulerPage from './pages/SchedulerPage'
import LoadAssignmentPage from './pages/admin/LoadAssignmentPage'
import ApprovalsPage from './pages/head/ApprovalsPage'
import RegistrarPage from './pages/registrar/RegistrarPage'
import MyLoadPage from './pages/teacher/MyLoadPage'

function RoleRedirect() {
  const { account } = useAuth()
  return <Navigate to={account ? roleHome(account.role) : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RoleRedirect />} />

            <Route
              path="/admin/loads"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AppLayout title="Load Assignment" />
                </ProtectedRoute>
              }
            >
              <Route index element={<LoadAssignmentPage />} />
            </Route>

            <Route
              path="/head/approvals"
              element={
                <ProtectedRoute roles={['program_head']}>
                  <AppLayout title="Approvals" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ApprovalsPage />} />
            </Route>

            <Route
              path="/registrar"
              element={
                <ProtectedRoute roles={['registrar']}>
                  <AppLayout title="Finalize Loads" />
                </ProtectedRoute>
              }
            >
              <Route index element={<RegistrarPage />} />
            </Route>

            <Route
              path="/teacher"
              element={
                <ProtectedRoute roles={['teacher']}>
                  <AppLayout title="My Load" />
                </ProtectedRoute>
              }
            >
              <Route index element={<MyLoadPage />} />
            </Route>

            <Route
              path="/scheduler"
              element={
                <ProtectedRoute roles={['admin', 'registrar']}>
                  <AppLayout title="Scheduler" fullBleed />
                </ProtectedRoute>
              }
            >
              <Route index element={<SchedulerPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}