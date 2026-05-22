import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F3F7] flex items-center justify-center">
        <div className="text-sm text-gray-400" style={{ fontFamily: 'Roboto, sans-serif' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return children
}
