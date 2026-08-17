import { Router } from 'express'
import authRoutes             from './auth.routes.js'
import healthRoutes           from './health.routes.js'
import productsRoutes         from './products.routes.js'
import rawMaterialsRoutes     from './rawMaterials.routes.js'
import machinesRoutes         from './machines.routes.js'
import warehousesRoutes       from './warehouses.routes.js'
import bomRoutes              from './bom.routes.js'
import productionBatchRoutes  from './productionBatches.routes.js'
import inventoryRoutes        from './inventory.routes.js'
import manufacturingRoutes    from './manufacturing.routes.js'
import qualityRoutes          from './quality.routes.js'
import scrapRoutes            from './scrap.routes.js'
import finishedGoodsRoutes    from './finishedGoods.routes.js'
import analyticsRoutes        from './analytics.routes.js'
import reportsRoutes          from './reports.routes.js'

const router = Router()

/**
 * API route registry — all prefixed with /api (set in app.js)
 *
 * Phase 1: /api/health  /api/auth/*
 * Phase 2: /api/products/*  /api/raw-materials/*  /api/machines/*
 *          /api/warehouses/*  /api/bom/*
 * Phase 3: /api/production/batches/*
 * Phase 4: /api/inventory/*
 * Phase 5: /api/manufacturing/*
 *   /api/manufacturing/operation-types
 *   /api/manufacturing/batches/:batchId/operations
 *   /api/manufacturing/operations/:id
 *   /api/manufacturing/operations/:id/transition
 *   /api/manufacturing/operations/:id/entries
 * Phase 6: /api/quality/*  /api/scrap/*  /api/finished-goods/*
 *   /api/quality/checks
 *   /api/quality/batches/:batchId/checks
 *   /api/quality/batches/:batchId/completion
 *   /api/scrap
 *   /api/scrap/summary/by-category
 *   /api/scrap/batches/:batchId
 *   /api/finished-goods/stock
 *   /api/finished-goods/transactions
 *   /api/finished-goods/adjust-in|adjust-out|dispatch
 * Phase 7: /api/analytics/*  /api/reports/*
 *   /api/analytics/dashboard
 *   /api/analytics/batch-status
 *   /api/analytics/running-batches
 *   /api/analytics/production-kpis
 *   /api/analytics/inventory
 *   /api/analytics/finished-goods
 *   /api/analytics/scrap/by-category
 *   /api/analytics/scrap/by-machine
 *   /api/analytics/operation-efficiency
 *   /api/analytics/recent-activity
 *   /api/analytics/material-trend
 *   /api/analytics/master-counts
 *   /api/reports/production
 *   /api/reports/inventory
 *   /api/reports/inventory/ledger
 *   /api/reports/scrap
 *   /api/reports/scrap/summary
 *   /api/reports/batch-summary
 *   /api/reports/material-reconciliation
 *   /api/reports/finished-goods
 */
router.use('/health',               healthRoutes)
router.use('/auth',                 authRoutes)
router.use('/products',             productsRoutes)
router.use('/raw-materials',        rawMaterialsRoutes)
router.use('/machines',             machinesRoutes)
router.use('/warehouses',           warehousesRoutes)
router.use('/bom',                  bomRoutes)
router.use('/production/batches',   productionBatchRoutes)
router.use('/inventory',            inventoryRoutes)
router.use('/manufacturing',        manufacturingRoutes)
router.use('/quality',              qualityRoutes)
router.use('/scrap',                scrapRoutes)
router.use('/finished-goods',       finishedGoodsRoutes)
router.use('/analytics',            analyticsRoutes)
router.use('/reports',              reportsRoutes)

export default router
