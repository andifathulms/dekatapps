import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import LettersPage from './pages/LettersPage'
import JournalPage from './pages/JournalPage'
import ProfilePage from './pages/ProfilePage'
import NavBar from './components/NavBar'
import { useEffect } from 'react'
import { getMe } from './api/auth'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div className="pb-16">
      {children}
      <NavBar />
    </div>
  )
}

export default function App() {
  const { isAuthenticated, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      getMe().then((res) => setUser(res.data)).catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
        <Route path="/letters" element={<ProtectedRoute><AppLayout><LettersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><AppLayout><JournalPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
