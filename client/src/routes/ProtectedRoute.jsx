import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Wraps routes that require authentication.
 * - While the session check is in progress: shows a full-page spinner.
 * - If not authenticated: redirects to /login, preserving the attempted URL
 *   so the user lands back there after logging in.
 * - If authenticated: renders child routes via <Outlet />.
 */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
