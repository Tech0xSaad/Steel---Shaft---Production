import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Cog, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input  } from '@/components/ui/Input'
import { Alert  } from '@/components/ui/Alert'
import { APP_NAME } from '@/constants/app'

/**
 * Admin login page.
 * On success, navigates to the originally requested URL (or /dashboard).
 */
export function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const from = location.state?.from?.pathname ?? '/dashboard'

  const [form, setForm]         = useState({ email: '', password: '' })
  const [errors, setErrors]     = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field-level error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError)  setServerError('')
  }

  function validate() {
    const next = {}
    if (!form.email.trim())    next.email    = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.password)        next.password = 'Password is required.'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    const { success, error } = await login(form.email, form.password)
    setLoading(false)

    if (!success) {
      setServerError(error ?? 'Invalid credentials. Please try again.')
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg mb-4">
            <Cog className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-surface-500">Sign in to your admin account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          {serverError && (
            <Alert variant="error" className="mb-5" onClose={() => setServerError('')}>
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="hover:text-surface-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />
                  }
                </button>
              }
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              className="mt-2"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-surface-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  )
}
