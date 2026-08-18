import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/api/supabaseClient'
import { signIn, signOut, getSession, signUp } from '@/services/authService'

const AuthContext = createContext(null)

/**
 * Provides authentication state and actions to the entire app.
 * Wraps the Supabase auth listener so any component can react to
 * login / logout events without prop drilling.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isVerified = Boolean(user?.user_metadata?.is_verified)

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

  const login = useCallback(async (email, password) => {
    setError(null)
    const { data, error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }

    const authUser = data?.user ?? null
    const isUserVerified = Boolean(authUser?.user_metadata?.is_verified)

    if (!isUserVerified) {
      setSession(data.session)
      setUser(authUser)
      return { success: true, verified: false }
    }

    setSession(data.session)
    setUser(authUser)
    return { success: true, verified: true }
  }, [])

  const signup = useCallback(async (email, password, fullName) => {
    setError(null)
    const { data, error: err } = await signUp(email, password, fullName)
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
    isVerified,
    login,
    signup,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
