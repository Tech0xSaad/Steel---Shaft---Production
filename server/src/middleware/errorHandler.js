import { AppError }    from '../utils/AppError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { logger }      from '../config/logger.js'
import { env }         from '../config/env.js'

/**
 * Global Express error handler — must be registered LAST (4 params).
 *
 * Handles:
 *   - AppError (operational) → structured JSON response
 *   - Joi ValidationError    → 422 with field-level details
 *   - Generic Error (bugs)   → 500 + logs stack trace
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Joi validation error
  if (err.isJoi || err.name === 'ValidationError') {
    const errors = err.details?.map((d) => ({
      field:   d.context?.key,
      message: d.message.replace(/['"]/g, ''),
    })) ?? [{ message: err.message }]
    return ApiResponse.validationError(res, errors)
  }

  // Known operational errors (AppError)
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`[${err.statusCode}] ${err.message}`, {
      path:   req.path,
      method: req.method,
      code:   err.code,
    })
    return ApiResponse.error(res, err.message, err.statusCode, err.code)
  }

  // Unknown / programming errors — log full stack, hide details from client
  logger.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
  })

  const message = env.isDev
    ? err.message
    : 'An unexpected error occurred. Please try again later.'

  return ApiResponse.error(res, message, 500)
}
