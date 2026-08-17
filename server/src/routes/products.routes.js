import { Router } from 'express'
import { ProductsController }  from '../controllers/products.controller.js'
import { authenticate }        from '../middleware/authenticate.js'
import { validate }            from '../middleware/validate.js'
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from '../validators/products.validator.js'

const router = Router()

// All product routes require authentication
router.use(authenticate)

router.get (  '/',          validate(listProductsSchema, 'query'), ProductsController.list)
router.get (  '/dropdown',                                         ProductsController.dropdown)
router.get (  '/:id',                                              ProductsController.getById)
router.post(  '/',          validate(createProductSchema),         ProductsController.create)
router.put (  '/:id',       validate(updateProductSchema),         ProductsController.update)
router.delete('/:id',                                              ProductsController.remove)

export default router
