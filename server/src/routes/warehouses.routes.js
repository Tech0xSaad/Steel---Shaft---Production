import { Router } from 'express'
import { WarehousesController } from '../controllers/warehouses.controller.js'
import { authenticate }         from '../middleware/authenticate.js'
import { validate }             from '../middleware/validate.js'
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  listWarehousesSchema,
} from '../validators/warehouses.validator.js'

const router = Router()

router.use(authenticate)

router.get (  '/',        validate(listWarehousesSchema, 'query'), WarehousesController.list)
router.get (  '/dropdown',                                         WarehousesController.dropdown)
router.get (  '/:id',                                              WarehousesController.getById)
router.post(  '/',        validate(createWarehouseSchema),         WarehousesController.create)
router.put (  '/:id',     validate(updateWarehouseSchema),         WarehousesController.update)
router.delete('/:id',                                              WarehousesController.remove)

export default router
