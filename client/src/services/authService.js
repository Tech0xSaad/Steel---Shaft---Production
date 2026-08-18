import { supabase } from '@/api/supabaseClient'

/**
 * Sign up a new user and default them to unverified.
 * The app blocks access until an admin sets is_verified = true.
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: 'user',
        is_verified: false,
      },
    },
  })
  return { data, error }
}

/**
 * Sign in with email + password via Supabase Auth.
 * Returns { data: { session, user }, error }
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  return { data, error }
}

/**
 * Sign out the current user session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the currently active session (null if not logged in).
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session ?? null, error }
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  return { user: data?.user ?? null, error }
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/reset-password` }
  )
  return { data, error }
}
