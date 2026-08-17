import { Router } from 'express'
import { ApiResponse } from '../utils/ApiResponse.js'
import { supabaseAnon } from '../config/supabase.js'

const router = Router()

/**
 * GET /api/health
 * Returns server + Supabase connectivity status.
 * Useful for load balancer health checks and uptime monitors.
 */
router.get('/', async (_req, res) => {
  let dbStatus = 'ok'

  try {
    // Lightweight Supabase ping — just check we can reach it
    const { error } = await supabaseAnon.from('_health_check_').select('1').limit(1)
    // A "relation does not exist" error still means the DB is reachable
    if (error && !error.message.includes('does not exist')) {
      dbStatus = 'degraded'
    }
  } catch {
    dbStatus = 'unreachable'
  }

  const payload = {
    status:    dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    database:  dbStatus,
  }

  return ApiResponse.success(res, payload, 'Health check')
})

export default router
