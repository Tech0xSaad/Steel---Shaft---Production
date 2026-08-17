import { ApiResponse } from '../utils/ApiResponse.js'

/**
 * Authorization middleware factory.
 * Must be used AFTER `authenticate`.
 *
 * Checks `req.user.user_metadata.role` against the allowed roles.
 *
 * @param {...string} allowedRoles - e.g. authorize('admin')
 *
 * @example
 *   router.delete('/orders/:id', authenticate, authorize('admin'), handler)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.user_metadata?.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}.`
      )
    }

    next()
  }
}
