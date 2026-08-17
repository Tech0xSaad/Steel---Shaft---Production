/**
 * Wraps an async route handler and forwards any rejected promise
 * to Express's next(err) — removes the need for try/catch in every controller.
 *
 * @param {Function} fn - async (req, res, next) => {}
 * @returns {Function}
 *
 * @example
 *   router.get('/orders', asyncHandler(OrderController.list))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
