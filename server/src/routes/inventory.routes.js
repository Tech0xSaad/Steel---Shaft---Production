import { Router } from 'express'
import { InventoryController } from '../controllers/inventory.controller.js'
import { authenticate }        from '../middleware/authenticate.js'
import { validate }            from '../middleware/validate.js'
import {
  receiveStockSchema,
  adjustStockSchema,
  transferStockSchema,
  scrapStockSchema,
  listTransactionsSchema,
  listStockPositionsSchema,
  listWipSchema,
} from '../validators/inventory.validator.js'

// Re-use the return schema from scrap (same shape minus batch_id)
import Joi from 'joi'

const returnStockSchema = Joi.object({
  raw_material_id:  Joi.string().uuid().required(),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  quantity:         Joi.number().positive().required(),
  uom:              Joi.string().valid('kg','g','ton','mm','m','pcs','litre','ml','set').default('kg'),
  batch_id:         Joi.string().uuid().allow(null, ''),
  reference_number: Joi.string().trim().max(100).allow('', null),
  notes:            Joi.string().trim().max(1000).allow('', null),
})

const router = Router()

router.use(authenticate)

// ── Stock positions (read-only view) ─────────────────────────
router.get('/positions',        validate(listStockPositionsSchema, 'query'), InventoryController.listPositions)
router.get('/positions/:rawMaterialId',                                      InventoryController.getPosition)

// ── Inventory ledger (read-only) ─────────────────────────────
router.get('/transactions',     validate(listTransactionsSchema, 'query'),   InventoryController.listTransactions)
router.get('/transactions/:id',                                              InventoryController.getTransaction)

// ── Inventory movements (write) ──────────────────────────────
router.post('/receive',         validate(receiveStockSchema),                InventoryController.receive)
router.post('/adjust',          validate(adjustStockSchema),                 InventoryController.adjust)
router.post('/transfer',        validate(transferStockSchema),               InventoryController.transfer)
router.post('/scrap',           validate(scrapStockSchema),                  InventoryController.scrap)
router.post('/return',          validate(returnStockSchema),                 InventoryController.returnStock)

// ── WIP ──────────────────────────────────────────────────────
router.get('/wip',              validate(listWipSchema, 'query'),            InventoryController.listWip)

// ── Alerts ───────────────────────────────────────────────────
router.get('/alerts',                                                        InventoryController.getAlerts)

export default router
