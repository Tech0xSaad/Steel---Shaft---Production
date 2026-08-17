import { Router } from 'express'
import { FinishedGoodsController } from '../controllers/finishedGoods.controller.js'
import { authenticate }            from '../middleware/authenticate.js'
import { validate }                from '../middleware/validate.js'
import {
  fgAdjustInSchema,
  fgAdjustOutSchema,
  fgDispatchSchema,
  listFgPositionsSchema,
  listFgTransactionsSchema,
} from '../validators/finishedGoods.validator.js'

const router = Router()
router.use(authenticate)

/**
 * Phase 6 — Finished Goods routes
 *
 * GET  /api/finished-goods/stock                  — paginated FG stock positions
 * GET  /api/finished-goods/stock/:id              — single position
 * GET  /api/finished-goods/transactions           — paginated ledger
 * GET  /api/finished-goods/transactions/:id       — single ledger entry
 * POST /api/finished-goods/adjust-in              — manual stock-in
 * POST /api/finished-goods/adjust-out             — manual stock-out
 * POST /api/finished-goods/dispatch               — dispatch to customer
 */

router.get ('/stock',              validate(listFgPositionsSchema, 'query'),    FinishedGoodsController.listPositions)
router.get ('/stock/:id',                                                       FinishedGoodsController.getPosition)

router.get ('/transactions',       validate(listFgTransactionsSchema, 'query'), FinishedGoodsController.listTransactions)
router.get ('/transactions/:id',                                                FinishedGoodsController.getTransaction)

router.post('/adjust-in',          validate(fgAdjustInSchema),                  FinishedGoodsController.adjustIn)
router.post('/adjust-out',         validate(fgAdjustOutSchema),                 FinishedGoodsController.adjustOut)
router.post('/dispatch',           validate(fgDispatchSchema),                  FinishedGoodsController.dispatch)

export default router
