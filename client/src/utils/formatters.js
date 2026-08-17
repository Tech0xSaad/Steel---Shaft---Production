/**
 * Utility formatting functions used across the UI.
 */

/**
 * Format a number as Indian-locale currency (INR).
 * @param {number} amount
 * @param {boolean} compact - abbreviate large numbers (1.2L, 3.4Cr)
 */
export function formatCurrency(amount, compact = false) {
  if (amount == null) return '—'
  if (compact) {
    if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`
    if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(2)}L`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format an ISO date string to a readable date.
 * @param {string|Date} date
 */
export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format an ISO date string to a readable date + time.
 */
export function formatDateTime(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date))
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncate a string to a max length, appending '…'.
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}
