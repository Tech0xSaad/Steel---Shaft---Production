import { AppError } from '../utils/AppError.js'

/**
 * Joi validation middleware factory.
 * Validates req.body (default), req.query, or req.params against a Joi schema.
 *
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} target
 *
 * @example
 *   router.post('/login', validate(loginSchema), AuthController.login)
 */
export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly:   false,   // collect all errors, not just the first
      stripUnknown: true,    // remove keys not in schema
    })

    if (error) {
      // Attach isJoi flag so errorHandler recognises it
      error.isJoi = true
      return next(error)
    }

    // Replace with the sanitised value
    req[target] = value
    next()
  }
}
