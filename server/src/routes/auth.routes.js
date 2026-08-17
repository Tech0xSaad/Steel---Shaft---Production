import { Router } from 'express'
import { AuthController }    from '../controllers/auth/auth.controller.js'
import { authenticate }      from '../middleware/authenticate.js'
import { validate }          from '../middleware/validate.js'
import { loginSchema, refreshSchema } from '../validators/auth.validator.js'

const router = Router()

/**
 * Auth routes — /api/auth/*
 */
router.post('/login',   validate(loginSchema),   AuthController.login)
router.post('/logout',  authenticate,            AuthController.logout)
router.post('/refresh', validate(refreshSchema), AuthController.refresh)
router.get ('/me',      authenticate,            AuthController.me)

export default router
