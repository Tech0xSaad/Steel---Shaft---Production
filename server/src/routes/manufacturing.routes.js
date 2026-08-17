import { Router } from 'express'
import { ManufacturingController } from '../controllers/manufacturing.controller.js'
import { authenticate }            from '../middleware/authenticate.js'
import { validate }                from '../middleware/validate.js'
import {
  createOpTypeSchema,
  updateOpTypeSchema,
  addOperationSchema,
  updateOperationSchema,
  transitionOperationSchema,
  addProductionEntrySchema,
  listOperationsSchema,
  listEntriesSchema,
} from '../validators/manufacturing.validator.js'

const router = Router()
router.use(authenticate)

// ── Operation Types ───────────────────────────────────────────
router.get   ('/operation-types',        ManufacturingController.listOpTypes)
router.get   ('/operation-types/:id',    ManufacturingController.getOpType)
router.post  ('/operation-types',        validate(createOpTypeSchema),     ManufacturingController.createOpType)
router.put   ('/operation-types/:id',    validate(updateOpTypeSchema),     ManufacturingController.updateOpType)

// ── Operations (batch-scoped) ─────────────────────────────────
router.get   ('/batches/:batchId/operations',  ManufacturingController.getOperationsByBatch)
router.post  ('/batches/:batchId/operations',  validate(addOperationSchema), ManufacturingController.addOperation)

// ── Operations (flat) ─────────────────────────────────────────
router.get   ('/operations',        validate(listOperationsSchema, 'query'), ManufacturingController.listOperations)
router.get   ('/operations/:id',                                             ManufacturingController.getOperation)
router.put   ('/operations/:id',    validate(updateOperationSchema),         ManufacturingController.updateOperation)
router.delete('/operations/:id',                                             ManufacturingController.deleteOperation)
router.post  ('/operations/:id/transition', validate(transitionOperationSchema), ManufacturingController.transitionOperation)

// ── Production Entries ────────────────────────────────────────
router.get   ('/operations/:id/entries', validate(listEntriesSchema, 'query'), ManufacturingController.listEntries)
router.post  ('/operations/:id/entries', validate(addProductionEntrySchema),   ManufacturingController.addEntry)

export default router
