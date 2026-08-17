import { Router }            from 'express'
import { ReportsController } from '../controllers/reports.controller.js'
import { authenticate }      from '../middleware/authenticate.js'

const router = Router()
router.use(authenticate)

/**
 * Phase 7 — Reports routes
 * All prefixed with /api/reports  (set in routes/index.js)
 *
 * GET /api/reports/production                  – production batch report
 *     ?status=&product_id=&from_date=&to_date=&search=&page=&pageSize=
 *
 * GET /api/reports/inventory                   – raw material stock report
 *     ?category=&status=&low_stock=true&page=&pageSize=
 *
 * GET /api/reports/inventory/ledger            – inventory transaction ledger
 *     ?raw_material_id=&transaction_type=&batch_id=&from_date=&to_date=&page=&pageSize=
 *
 * GET /api/reports/scrap/summary               – scrap totals (non-paginated)
 *     ?from_date=&to_date=
 *
 * GET /api/reports/scrap                       – scrap records (paginated)
 *     ?batch_id=&scrap_category=&machine_id=&from_date=&to_date=&page=&pageSize=
 *
 * GET /api/reports/batch-summary               – batch completion summary
 *     ?product_id=&from_date=&to_date=&page=&pageSize=
 *
 * GET /api/reports/material-reconciliation     – material reconciliation
 *     ?raw_material_id=&from_date=&to_date=&page=&pageSize=
 *
 * GET /api/reports/finished-goods              – FG transaction ledger
 *     ?product_id=&movement_type=&from_date=&to_date=&page=&pageSize=
 */

// More specific sub-routes registered before generic ones
router.get('/inventory/ledger',          ReportsController.inventoryLedgerReport)
router.get('/inventory',                 ReportsController.inventoryReport)

router.get('/scrap/summary',             ReportsController.scrapSummary)
router.get('/scrap',                     ReportsController.scrapReport)

router.get('/production',                ReportsController.productionReport)
router.get('/batch-summary',             ReportsController.batchSummaryReport)
router.get('/material-reconciliation',   ReportsController.materialReconciliationReport)
router.get('/finished-goods',            ReportsController.finishedGoodsReport)

export default router
