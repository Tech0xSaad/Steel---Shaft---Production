import { Router }              from 'express'
import { AnalyticsController } from '../controllers/analytics.controller.js'
import { authenticate }        from '../middleware/authenticate.js'

const router = Router()
router.use(authenticate)

/**
 * Phase 7 — Analytics routes
 * All prefixed with /api/analytics  (set in routes/index.js)
 *
 * GET /api/analytics/dashboard             – full dashboard payload (parallel)
 * GET /api/analytics/batch-status          – batch counts by status
 * GET /api/analytics/running-batches       – currently active batches
 * GET /api/analytics/production-kpis       – aggregated production KPIs  ?from=&to=
 * GET /api/analytics/inventory             – raw material inventory snapshot
 * GET /api/analytics/finished-goods        – finished goods snapshot
 * GET /api/analytics/scrap/by-category     – scrap totals by category     ?from=&to=
 * GET /api/analytics/scrap/by-machine      – scrap totals by machine       ?from=&to=
 * GET /api/analytics/operation-efficiency  – op-level efficiency summary   ?from=&to=
 * GET /api/analytics/recent-activity       – latest lifecycle events        ?limit=
 * GET /api/analytics/material-trend        – daily receive vs issue trend   ?days=
 * GET /api/analytics/master-counts         – active master data counts
 */

// Consolidated dashboard endpoint (fires everything in parallel)
router.get('/dashboard',            AnalyticsController.dashboard)

// Individual KPI endpoints
router.get('/batch-status',         AnalyticsController.batchStatus)
router.get('/running-batches',      AnalyticsController.runningBatches)
router.get('/production-kpis',      AnalyticsController.productionKpis)
router.get('/inventory',            AnalyticsController.inventorySnapshot)
router.get('/finished-goods',       AnalyticsController.finishedGoodsSnapshot)

// Scrap analytics (more specific routes first to avoid /scrap matching a param)
router.get('/scrap/by-category',    AnalyticsController.scrapByCategory)
router.get('/scrap/by-machine',     AnalyticsController.scrapByMachine)

// Operation & activity
router.get('/operation-efficiency', AnalyticsController.operationEfficiency)
router.get('/recent-activity',      AnalyticsController.recentActivity)
router.get('/material-trend',       AnalyticsController.materialTrend)
router.get('/master-counts',        AnalyticsController.masterCounts)

export default router
