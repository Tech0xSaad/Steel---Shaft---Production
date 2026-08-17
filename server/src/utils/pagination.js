/**
 * Parse and normalise pagination query params from a request.
 *
 * @param {object} query - req.query
 * @returns {{ page, pageSize, offset }}
 */
export function parsePagination(query) {
  const page     = Math.max(1, parseInt(query.page     ?? '1',  10))
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? '20', 10)))
  const offset   = (page - 1) * pageSize
  return { page, pageSize, offset }
}

/**
 * Build the meta object for a paginated response.
 *
 * @param {{ page, pageSize, total }} params
 * @returns {{ page, pageSize, total, totalPages }}
 */
export function buildPaginationMeta({ page, pageSize, total }) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}
