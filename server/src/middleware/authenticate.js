import { supabaseAnon } from '../config/supabase.js'
import { ApiResponse }  from '../utils/ApiResponse.js'
import { logger }       from '../config/logger.js'

/**
 * Authentication middleware.
 *
 * Expects: Authorization: Bearer <supabase_jwt>
 *
 * On success attaches `req.user` (Supabase user object) and `req.session`.
 * On failure returns 401 — never calls next() with an error so that
 * the global error handler doesn't leak internal details.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Missing or malformed Authorization header.')
    }

    const token = authHeader.slice(7)

    // Verify the JWT with Supabase — this also refreshes the user object
    const { data, error } = await supabaseAnon.auth.getUser(token)

    if (error || !data?.user) {
      logger.warn('authenticate: invalid token', { error: error?.message })
      return ApiResponse.unauthorized(res, 'Invalid or expired token.')
    }

    req.user  = data.user
    req.token = token
    next()
  } catch (err) {
    logger.error('authenticate: unexpected error', { error: err.message })
    return ApiResponse.unauthorized(res, 'Authentication failed.')
  }
}
