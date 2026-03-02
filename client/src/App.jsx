import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import InstructorDashboard from './pages/InstructorDashboard'
import StudentDashboard from './pages/StudentDashboard'
import CreateExam from './pages/CreateExam'
import ExamTakingPage from './pages/ExamTakingPage'
import AIGenerationView from './pages/AIGenerationView'
import LandingPage from './pages/LandingPage'

import './App.css'

// Smart redirect based on user role
function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />
  }

  return <Navigate to="/instructor/dashboard" replace />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Instructor Routes */}
          <Route
            path="/instructor/dashboard"
            element={
              <RequireAuth allowedRoles={['admin', 'instructor']}>
                <InstructorDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/instructor/create-exam"
            element={
              <RequireAuth allowedRoles={['admin', 'instructor']}>
                <CreateExam />
              </RequireAuth>
            }
          />


          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <RequireAuth allowedRoles={['student']}>
                <StudentDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/student/exam/:examId"
            element={
              <RequireAuth allowedRoles={['student']}>
                <ExamTakingPage />
              </RequireAuth>
            }
          />
          <Route
            path="/student/results"
            element={
              <RequireAuth allowedRoles={['student']}>
                <StudentDashboard />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
