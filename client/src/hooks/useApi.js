import { useState, useCallback } from 'react'

/**
 * Generic hook for making API calls with loading / error / data state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(myApiFunction)
 *   useEffect(() => { execute(arg1, arg2) }, [])
 */
export function useApi(apiFunction) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFunction(...args)
        setData(result)
        return { data: result, error: null }
      } catch (err) {
        const message = err?.response?.data?.message ?? err.message ?? 'Unknown error'
        setError(message)
        return { data: null, error: message }
      } finally {
        setLoading(false)
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}
