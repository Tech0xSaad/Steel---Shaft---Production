/**
 * Custom application error class.
 * Throw this anywhere in the server and the global error handler will
 * convert it into the correct HTTP response automatically.
 *
 * @example
 *   throw new AppError('Order not found', 404)
 *   throw new AppError('Email already in use', 409, 'CONFLICT')
 */
export class AppError extends Error {
  /**
   * @param {string} message   - human-readable description
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {string} code       - optional machine-readable error code
   */
  constructor(message, statusCode = 500, code = null) {
    super(message)
    this.name       = 'AppError'
    this.statusCode = statusCode
    this.code       = code
    this.isOperational = true   // distinguishes known errors from bugs
    Error.captureStackTrace(this, this.constructor)
  }
}
