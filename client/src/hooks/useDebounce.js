import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of the value that only updates after
 * the specified delay has elapsed without further changes.
 * Useful for search inputs to avoid firing a request on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
