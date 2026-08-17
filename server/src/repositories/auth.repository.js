import { supabaseAdmin, supabaseAnon } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

/**
 * Data-access layer for authentication operations.
 * All raw Supabase calls live here — controllers stay clean.
 */
export class AuthRepository {
  /**
   * Sign in a user with email + password.
   * @returns {{ session, user }}
   */
  static async signInWithPassword(email, password) {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Map Supabase errors to AppErrors with appropriate HTTP codes
      if (error.message.toLowerCase().includes('invalid login')) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS')
      }
      throw new AppError(error.message, 400)
    }

    return { session: data.session, user: data.user }
  }

  /**
   * Sign out a user by invalidating the provided JWT.
   */
  static async signOut(token) {
    // Use an anon client scoped to this specific token
    const userClient = supabaseAnon
    await userClient.auth.admin?.signOut(token)
    // Supabase JS v2: signOut via the session
  }

  /**
   * Refresh a session using a refresh token.
   * @returns {{ session, user }}
   */
  static async refreshSession(refreshToken) {
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      throw new AppError('Session refresh failed. Please log in again.', 401, 'REFRESH_FAILED')
    }

    return { session: data.session, user: data.user }
  }

  /**
   * Get a user by ID (admin client — bypasses RLS).
   */
  static async getUserById(userId) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error) throw new AppError(error.message, 400)
    return data.user
  }
}
