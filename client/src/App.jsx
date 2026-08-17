import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { AppRouter } from '@/routes/AppRouter'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

/**
 * Application root.
 *
 * Provider hierarchy (outermost → innermost):
 *   BrowserRouter  → enables client-side routing
 *   AuthProvider   → global auth state + Supabase session
 *   ErrorBoundary  → catches render-level crashes
 *   AppRouter      → route definitions
 *   Toaster        → global toast notifications (react-hot-toast)
 */
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '0.875rem',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
