import { Router } from 'express'
import { QualityController } from '../controllers/quality.controller.js'
import { authenticate }      from '../middleware/authenticate.js'
import { validate }          from '../middleware/validate.js'
import {
  createQualityCheckSchema,
  updateQualityCheckSchema,
  submitResultSchema,
  listQualityChecksSchema,
} from '../validators/quality.validator.js'

const router = Router()
router.use(authenticate)

/**
 * Phase 6 — Quality Control routes
 *
 * GET    /api/quality/checks                              — paginated list
 * GET    /api/quality/checks/:id                         — single check
 * PUT    /api/quality/checks/:id                         — update
 * DELETE /api/quality/checks/:id                         — delete (pending only)
 * POST   /api/quality/checks/:id/submit                  — submit result (pass/reject)
 * GET    /api/quality/batches/:batchId/checks            — all checks for a batch
 * POST   /api/quality/batches/:batchId/checks            — create check for a batch
 * GET    /api/quality/batches/:batchId/completion        — batch completion summary
 */

// Flat check routes
router.get   ('/checks',     validate(listQualityChecksSchema, 'query'), QualityController.list)
router.get   ('/checks/:id',                                             QualityController.getById)
router.put   ('/checks/:id', validate(updateQualityCheckSchema),         QualityController.update)
router.delete('/checks/:id',                                             QualityController.delete)
router.post  ('/checks/:id/submit', validate(submitResultSchema),        QualityController.submitResult)

// Batch-scoped routes
router.get   ('/batches/:batchId/checks',      QualityController.getByBatch)
router.post  ('/batches/:batchId/checks',      validate(createQualityCheckSchema), QualityController.create)
router.get   ('/batches/:batchId/completion',  QualityController.getCompletionSummary)

export default router
