import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Availability from './pages/public/Availability'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import History from './pages/History'
import Settings from './pages/Settings'
import Reservations from './pages/Reservations'
import Clients from './pages/Clients'
import Promo from './pages/Promo'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><Availability /></PublicLayout>} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <Layout><Inventory /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute>
          <Layout><Sales /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <Layout><History /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/reservations" element={
        <ProtectedRoute>
          <Layout><Reservations /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute>
          <Layout><Clients /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout><Settings /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/promo" element={
        <ProtectedRoute>
          <Layout><Promo /></Layout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
