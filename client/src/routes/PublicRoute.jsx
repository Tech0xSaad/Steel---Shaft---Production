import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Wraps public-only routes (login, etc.).
 * If the user is already authenticated they get redirected to /dashboard
 * so they never see the login page while logged in.
 */
export function PublicRoute() {
  const { isAuthenticated, loading, isVerified } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    return isVerified ? <Navigate to="/dashboard" replace /> : <Navigate to="/not-verified" replace />
  }

  return <Outlet />
}
