import express          from 'express'
import helmet           from 'helmet'
import cors             from 'cors'
import compression      from 'compression'
import rateLimit        from 'express-rate-limit'

import { env }           from './config/env.js'
import { logger }        from './config/logger.js'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler }  from './middleware/errorHandler.js'
import { notFound }      from './middleware/notFound.js'
import apiRoutes         from './routes/index.js'

const app = express()

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.ALLOWED_ORIGINS
    const isAllowedOrigin = origin && (
      allowedOrigins.includes(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
    )

    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || isAllowedOrigin) {
      return callback(null, true)
    }

    logger.warn(`CORS blocked origin: ${origin}`)
    callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Compression ───────────────────────────────────────────────────────────
app.use(compression())

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── HTTP request logging ─────────────────────────────────────────────────
app.use(requestLogger)

// ── Rate limiting — applied to all /api routes ───────────────────────────
const limiter = rateLimit({
  windowMs:    env.RATE_LIMIT_WINDOW_MS,
  max:         env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests, please try again later.' },
})
app.use('/api', limiter)

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api', apiRoutes)

// ── 404 for unmatched routes ──────────────────────────────────────────────
app.use(notFound)

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler)

// ── Start server ──────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`)
})

export default app
