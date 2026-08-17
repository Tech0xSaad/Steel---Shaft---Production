import morgan from 'morgan'
import { logger } from '../config/logger.js'
import { env }    from '../config/env.js'

// Pipe morgan output into winston
const stream = {
  write: (message) => logger.http(message.trim()),
}

/**
 * HTTP request logger.
 * - Development: concise coloured output
 * - Production:  JSON-compatible combined format
 */
export const requestLogger = morgan(
  env.isDev ? 'dev' : 'combined',
  { stream }
)
