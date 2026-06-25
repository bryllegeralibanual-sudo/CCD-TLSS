import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { DataProvider } from './data/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute, { roleHome } from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import DashboardPage from './pages/admin/DashboardPage'
import LoadAssignmentPage from './pages/admin/LoadAssignmentPage'
import ApprovalCenterPage from './pages/admin/ApprovalCenterPage'
import SchedulerPage from './pages/admin/SchedulerPage'
import CurriculumPage from './pages/admin/CurriculumPage'
import FacultyPage from './pages/admin/FacultyPage'
import RoomsLabsPage from './pages/admin/RoomsLabsPage'
import ApprovalsPage from './pages/head/ApprovalsPage'
import OverloadRequestsPage from './pages/head/OverloadRequestsPage'
import RegistrarPage from './pages/registrar/RegistrarPage'
import MyLoadPage from './pages/teacher/MyLoadPage'

function RoleRedirect() {
  const { account } = useAuth()
  return <Navigate to={account ? roleHome(account.role) : '/login'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RoleRedirect />} />

              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AppLayout title="Dashboard" /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
              </Route>
              <Route path="/admin/faculty" element={<ProtectedRoute roles={['admin']}><AppLayout title="Faculty" /></ProtectedRoute>}>
                <Route index element={<FacultyPage />} />
              </Route>
              <Route path="/admin/loads" element={<ProtectedRoute roles={['admin']}><AppLayout title="Load Assignment" /></ProtectedRoute>}>
                <Route index element={<LoadAssignmentPage />} />
              </Route>
              <Route path="/admin/approvals" element={<ProtectedRoute roles={['admin']}><AppLayout title="Approval Center" /></ProtectedRoute>}>
                <Route index element={<ApprovalCenterPage />} />
              </Route>
              {/* AI Auto Assignment removed — functionality available in Load Assignment */}
              <Route path="/admin/curriculum" element={<ProtectedRoute roles={['admin']}><AppLayout title="Curriculum Prospectus" /></ProtectedRoute>}>
                <Route index element={<CurriculumPage />} />
              </Route>
              <Route path="/admin/rooms" element={<ProtectedRoute roles={['admin']}><AppLayout title="Rooms & Labs" /></ProtectedRoute>}>
                <Route index element={<RoomsLabsPage />} />
              </Route>
              <Route path="/head/approvals" element={<ProtectedRoute roles={['program_head']}><AppLayout title="Approvals" /></ProtectedRoute>}>
                <Route index element={<ApprovalsPage />} />
              </Route>
              <Route path="/head/faculty" element={<ProtectedRoute roles={['program_head']}><AppLayout title="Faculty" /></ProtectedRoute>}>
                <Route index element={<FacultyPage />} />
              </Route>
              <Route path="/head/curriculum" element={<ProtectedRoute roles={['program_head']}><AppLayout title="Curriculum Prospectus" /></ProtectedRoute>}>
                <Route index element={<CurriculumPage />} />
              </Route>
              <Route path="/head/overload-requests" element={<ProtectedRoute roles={['program_head']}><AppLayout title="Overload Requests" /></ProtectedRoute>}>
                <Route index element={<OverloadRequestsPage />} />
              </Route>
              <Route path="/registrar" element={<ProtectedRoute roles={['registrar']}><AppLayout title="Finalize Loads" /></ProtectedRoute>}>
                <Route index element={<RegistrarPage />} />
              </Route>
              <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><AppLayout title="My Load" /></ProtectedRoute>}>
                <Route index element={<MyLoadPage />} />
              </Route>
              <Route path="/scheduler" element={<ProtectedRoute roles={['admin', 'registrar']}><AppLayout title="Scheduler" fullBleed /></ProtectedRoute>}>
                <Route index element={<SchedulerPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
