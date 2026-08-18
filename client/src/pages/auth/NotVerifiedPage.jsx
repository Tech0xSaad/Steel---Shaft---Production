import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export function NotVerifiedPage() {
  const { isAuthenticated, isVerified, logout } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isVerified) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-card text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-bold text-surface-900">Account not yet verified</h1>
        <p className="mt-4 text-base text-surface-600">
          Your account has been created successfully, but it has not been approved by an administrator yet.
          Please wait for admin approval before you can access the ERP dashboard.
        </p>

        <div className="mt-6 rounded-xl bg-surface-50 border border-surface-200 px-4 py-3 text-sm text-surface-600">
          Once approved, you will be redirected to the dashboard automatically.
        </div>

        <Button variant="secondary" className="mt-8" onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
