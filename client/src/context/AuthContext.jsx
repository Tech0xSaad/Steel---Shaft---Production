import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/api/supabaseClient'
import { signIn, signOut, getSession } from '@/services/authService'

const AuthContext = createContext(null)

/**
 * Provides authentication state and actions to the entire app.
 * Wraps the Supabase auth listener so any component can react to
 * login / logout events without prop drilling.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)  // true until initial session check completes
  const [error, setError]     = useState(null)

  // ── Bootstrap: load existing session on mount ─────────────────────────────
  useEffect(() => {
    let mounted = true

    getSession().then(({ session: s, error: e }) => {
      if (!mounted) return
      if (e) {
        setError(e.message)
      } else {
        setSession(s)
        setUser(s?.user ?? null)
      }
      setLoading(false)
    })

    // Listen to all future auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)
        setError(null)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null)
    const { data, error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
    setSession(data.session)
    setUser(data.user)
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    const { error: err } = await signOut()
    if (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
    setSession(null)
    setUser(null)
    return { success: true }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session && !!user,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to consume auth context. Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
