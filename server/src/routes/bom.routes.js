import { Router } from 'express'
import { BomController } from '../controllers/bom.controller.js'
import { authenticate }  from '../middleware/authenticate.js'
import { validate }      from '../middleware/validate.js'
import {
  createBomSchema,
  updateBomSchema,
  listBomSchema,
} from '../validators/bom.validator.js'

const router = Router()

router.use(authenticate)

router.get (  '/',    validate(listBomSchema, 'query'), BomController.list)
router.get (  '/:id',                                   BomController.getById)
router.post(  '/',    validate(createBomSchema),        BomController.create)
router.put (  '/:id', validate(updateBomSchema),        BomController.update)
router.delete('/:id',                                   BomController.remove)

export default router
