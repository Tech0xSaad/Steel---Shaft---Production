import { ApiResponse } from '../utils/ApiResponse.js'

/**
 * 404 handler — registered after all routes.
 * Catches any request that didn't match a defined route.
 */
export function notFound(req, res) {
  ApiResponse.notFound(res, `Route not found: ${req.method} ${req.originalUrl}`)
}
