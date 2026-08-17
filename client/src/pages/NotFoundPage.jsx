import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 px-4 text-center">
      <p className="text-8xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-surface-900">Page not found</h1>
      <p className="mt-2 text-sm text-surface-500 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        variant="primary"
        className="mt-6"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </Button>
    </div>
  )
}
