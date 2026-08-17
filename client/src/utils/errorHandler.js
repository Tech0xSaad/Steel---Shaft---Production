/**
 * Extracts a human-readable message from any thrown value.
 * Works for Axios errors, Supabase errors, and plain JS errors.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred.'

  // Axios error with our normalised userMessage
  if (error.userMessage) return error.userMessage

  // Supabase-style error
  if (error.message) return error.message

  // Axios response body
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.error)   return error.response.data.error

  return String(error)
}

/**
 * Maps HTTP status codes to user-friendly messages.
 */
export function getHttpErrorMessage(status) {
  const map = {
    400: 'Invalid request. Please check your input.',
    401: 'You must be logged in to perform this action.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. The resource may already exist.',
    422: 'The provided data is invalid.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
    503: 'The service is temporarily unavailable.',
  }
  return map[status] ?? `Unexpected error (HTTP ${status}).`
}
