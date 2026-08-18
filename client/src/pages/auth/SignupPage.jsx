import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, UserRound, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { APP_NAME } from '@/constants/app'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
    if (success) setSuccess('')
  }

  function validate() {
    const next = {}

    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      next.password = 'Password is required.'
    } else if (form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }

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
    const { success: didCreate, error } = await signup(form.email, form.password, form.fullName)
    setLoading(false)

    if (!didCreate) {
      setServerError(error ?? 'Unable to create account. Please try again.')
      return
    }

    setSuccess('Account created. Waiting for admin verification before access is granted.')
    setForm({ fullName: '', email: '', password: '' })
    setErrors({})

    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg mb-4">
            <UserRound className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Create account</h1>
          <p className="mt-1 text-sm text-surface-500">{APP_NAME} access request</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          {serverError && (
            <Alert variant="error" className="mb-5" onClose={() => setServerError('')}>
              {serverError}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-5" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Full name"
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="John Smith"
              value={form.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
              leftIcon={<UserRound className="h-4 w-4" />}
            />

            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
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
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
