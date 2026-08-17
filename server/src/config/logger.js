import { createLogger, format, transports } from 'winston'
import { env } from './env.js'

const { combine, timestamp, colorize, printf, json, errors } = format

// Human-readable format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack
      ? `${ts} ${level}: ${message}\n${stack}`
      : `${ts} ${level}: ${message}`
  )
)

// Structured JSON for production (log aggregators, CloudWatch, etc.)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

export const logger = createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: env.isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
  ],
  // Don't crash on uncaught exceptions — log them instead
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
})
