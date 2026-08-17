import { AuthService }   from '../../services/auth.service.js'
import { ApiResponse }   from '../../utils/ApiResponse.js'
import { asyncHandler }  from '../../utils/asyncHandler.js'

/**
 * Auth controller — handles HTTP layer only.
 * Business logic lives in AuthService.
 */
export class AuthController {
  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const { session, user } = await AuthService.login(email, password)

    return ApiResponse.success(res, {
      accessToken:  session.access_token,
      refreshToken: session.refresh_token,
      expiresAt:    session.expires_at,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.user_metadata?.role ?? 'admin',
        name:  user.user_metadata?.full_name ?? null,
      },
    }, 'Login successful')
  })

  /**
   * POST /api/auth/logout
   * Requires: authenticate middleware
   */
  static logout = asyncHandler(async (req, res) => {
    await AuthService.logout(req.token)
    return ApiResponse.noContent(res)
  })

  /**
   * POST /api/auth/refresh
   * Body: { refresh_token }
   */
  static refresh = asyncHandler(async (req, res) => {
    const { refresh_token } = req.body
    const { session, user } = await AuthService.refresh(refresh_token)

    return ApiResponse.success(res, {
      accessToken:  session.access_token,
      refreshToken: session.refresh_token,
      expiresAt:    session.expires_at,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.user_metadata?.role ?? 'admin',
        name:  user.user_metadata?.full_name ?? null,
      },
    }, 'Token refreshed')
  })

  /**
   * GET /api/auth/me
   * Requires: authenticate middleware
   */
  static me = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, {
      id:    req.user.id,
      email: req.user.email,
      role:  req.user.user_metadata?.role ?? 'admin',
      name:  req.user.user_metadata?.full_name ?? null,
    })
  })
}
