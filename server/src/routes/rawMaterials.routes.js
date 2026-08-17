import { Router } from 'express'
import { RawMaterialsController } from '../controllers/rawMaterials.controller.js'
import { authenticate }           from '../middleware/authenticate.js'
import { validate }               from '../middleware/validate.js'
import {
  createRawMaterialSchema,
  updateRawMaterialSchema,
  listRawMaterialsSchema,
} from '../validators/rawMaterials.validator.js'

const router = Router()

router.use(authenticate)

router.get (  '/',        validate(listRawMaterialsSchema, 'query'), RawMaterialsController.list)
router.get (  '/dropdown',                                           RawMaterialsController.dropdown)
router.get (  '/:id',                                                RawMaterialsController.getById)
router.post(  '/',        validate(createRawMaterialSchema),         RawMaterialsController.create)
router.put (  '/:id',     validate(updateRawMaterialSchema),         RawMaterialsController.update)
router.delete('/:id',                                                RawMaterialsController.remove)

export default router
