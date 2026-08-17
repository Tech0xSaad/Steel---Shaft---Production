/**
 * Standardised API response helpers.
 *
 * All endpoints should respond through these helpers to keep
 * the client-facing JSON shape consistent:
 *
 * Success:  { success: true,  data: <payload>,      message: <optional> }
 * Error:    { success: false, error:  <message>,    code: <optional> }
 * Paginated:{ success: true,  data: [...], meta: { page, pageSize, total, totalPages } }
 */

export class ApiResponse {
  /** 200 OK with a data payload */
  static success(res, data, message = 'OK', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data })
  }

  /** 201 Created */
  static created(res, data, message = 'Created') {
    return ApiResponse.success(res, data, message, 201)
  }

  /** 200 OK with pagination metadata */
  static paginated(res, data, meta) {
    return res.status(200).json({ success: true, data, meta })
  }

  /** 204 No Content */
  static noContent(res) {
    return res.status(204).send()
  }

  /** Generic error */
  static error(res, message = 'Internal server error', statusCode = 500, code = null) {
    const body = { success: false, error: message }
    if (code) body.code = code
    return res.status(statusCode).json(body)
  }

  static badRequest(res, message = 'Bad request') {
    return ApiResponse.error(res, message, 400, 'BAD_REQUEST')
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401, 'UNAUTHORIZED')
  }

  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403, 'FORBIDDEN')
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404, 'NOT_FOUND')
  }

  static conflict(res, message = 'Conflict') {
    return ApiResponse.error(res, message, 409, 'CONFLICT')
  }

  static validationError(res, errors) {
    return res.status(422).json({ success: false, error: 'Validation failed', errors })
  }
}
