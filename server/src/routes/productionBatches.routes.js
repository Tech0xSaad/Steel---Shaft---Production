import { Router } from 'express'
import { ProductionBatchesController } from '../controllers/productionBatches.controller.js'
import { authenticate }                from '../middleware/authenticate.js'
import { validate }                    from '../middleware/validate.js'
import {
  createBatchSchema,
  updateBatchSchema,
  transitionBatchSchema,
  listBatchesSchema,
} from '../validators/productionBatches.validator.js'

const router = Router()

router.use(authenticate)

// CRUD
router.get   ('/',          validate(listBatchesSchema,   'query'), ProductionBatchesController.list)
router.get   ('/:id',                                               ProductionBatchesController.getById)
router.post  ('/',          validate(createBatchSchema),            ProductionBatchesController.create)
router.put   ('/:id',       validate(updateBatchSchema),            ProductionBatchesController.update)
router.delete('/:id',                                               ProductionBatchesController.remove)

// Lifecycle transition
router.post  ('/:id/transition', validate(transitionBatchSchema),   ProductionBatchesController.transition)

export default router
