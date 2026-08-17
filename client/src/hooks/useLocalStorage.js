import { useState } from 'react'

/**
 * useState backed by localStorage — survives page refreshes.
 * @param {string} key - localStorage key
 * @param {*} initialValue - fallback if key doesn't exist
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) {
      console.warn(`useLocalStorage: failed to set key "${key}"`, err)
    }
  }

  return [storedValue, setValue]
}
