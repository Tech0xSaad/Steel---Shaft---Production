import { Router } from 'express'
import { MachinesController } from '../controllers/machines.controller.js'
import { authenticate }       from '../middleware/authenticate.js'
import { validate }           from '../middleware/validate.js'
import {
  createMachineSchema,
  updateMachineSchema,
  listMachinesSchema,
} from '../validators/machines.validator.js'

const router = Router()

router.use(authenticate)

router.get (  '/',        validate(listMachinesSchema, 'query'), MachinesController.list)
router.get (  '/dropdown',                                       MachinesController.dropdown)
router.get (  '/:id',                                            MachinesController.getById)
router.post(  '/',        validate(createMachineSchema),         MachinesController.create)
router.put (  '/:id',     validate(updateMachineSchema),         MachinesController.update)
router.delete('/:id',                                            MachinesController.remove)

export default router
