import axios from 'axios'
import { supabase } from './supabaseClient'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'

/**
 * Configured Axios instance for all Express API calls.
 *
 * Features:
 *  - Automatically attaches the Supabase JWT as a Bearer token
 *  - Centralized response error normalisation
 *  - 401 auto-redirect to login (without circular dependency on React context)
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor: attach auth token ────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: normalise errors ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message
              ?? error.response?.data?.error
              ?? error.message
              ?? 'An unexpected error occurred'

    // Token expired / invalid — sign out and redirect to login
    if (status === 401) {
      supabase.auth.signOut().then(() => {
        window.location.replace('/login')
      })
    }

    // Attach a normalised message so callers don't need to dig into error.response
    error.userMessage = message
    return Promise.reject(error)
  }
)
