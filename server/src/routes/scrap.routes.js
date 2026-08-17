import { Router } from 'express'
import { ScrapController } from '../controllers/scrap.controller.js'
import { authenticate }    from '../middleware/authenticate.js'
import { validate }        from '../middleware/validate.js'
import {
  createScrapSchema,
  updateScrapSchema,
  disposeScrapSchema,
  listScrapSchema,
  scrapSummarySchema,
} from '../validators/scrap.validator.js'

const router = Router()
router.use(authenticate)

/**
 * Phase 6 — Scrap Management routes
 *
 * GET    /api/scrap                                — paginated list
 * POST   /api/scrap                                — create scrap record
 * GET    /api/scrap/summary/by-category            — grouped summary
 * GET    /api/scrap/batches/:batchId               — all scrap for a batch
 * GET    /api/scrap/batches/:batchId/totals        — aggregated totals for batch
 * GET    /api/scrap/:id                            — single record
 * PUT    /api/scrap/:id                            — update
 * DELETE /api/scrap/:id                            — delete
 * POST   /api/scrap/:id/dispose                    — mark disposed
 */

// Specific named routes must come before /:id
router.get   ('/',                      validate(listScrapSchema, 'query'), ScrapController.list)
router.post  ('/',                      validate(createScrapSchema),        ScrapController.create)
router.get   ('/summary/by-category',   validate(scrapSummarySchema, 'query'), ScrapController.summaryByCategory)
router.get   ('/batches/:batchId',      ScrapController.getByBatch)
router.get   ('/batches/:batchId/totals', ScrapController.getTotalsForBatch)

router.get   ('/:id',                   ScrapController.getById)
router.put   ('/:id',                   validate(updateScrapSchema),        ScrapController.update)
router.delete('/:id',                   ScrapController.delete)
router.post  ('/:id/dispose',           validate(disposeScrapSchema),       ScrapController.markDisposed)

export default router
