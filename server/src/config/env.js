import 'dotenv/config'

/**
 * Centralised, validated environment config.
 * The server will fail fast on startup if required vars are missing.
 */

function requireEnv(key) {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT:     parseInt(process.env.PORT ?? '5000', 10),

  // Supabase
  SUPABASE_URL:              requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY:         requireEnv('SUPABASE_ANON_KEY'),

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,https://steel-shaft-production.vercel.app')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  RATE_LIMIT_MAX:       parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),

  get isDev()  { return this.NODE_ENV === 'development' },
  get isProd() { return this.NODE_ENV === 'production'  },
}
