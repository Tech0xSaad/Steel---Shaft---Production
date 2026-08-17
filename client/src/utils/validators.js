/**
 * Shared client-side validation helpers.
 */

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export const isRequired = (v) =>
  v !== null && v !== undefined && String(v).trim().length > 0

export const minLength = (min) => (v) => String(v).length >= min

export const maxLength = (max) => (v) => String(v).length <= max

export const isPositiveNumber = (v) => !isNaN(v) && Number(v) > 0

export const isNonNegativeNumber = (v) => !isNaN(v) && Number(v) >= 0

/**
 * Run a map of { fieldName: value } through a map of { fieldName: [validators] }
 * and return an object of { fieldName: firstErrorMessage | undefined }.
 *
 * @param {Record<string, any>}   values
 * @param {Record<string, Array<{test:(v)=>boolean, message:string}>>} rules
 * @returns {Record<string, string>}
 */
export function validateForm(values, rules) {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      if (!rule.test(values[field])) {
        errors[field] = rule.message
        break
      }
    }
  }
  return errors
}
