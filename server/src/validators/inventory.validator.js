import Joi from 'joi'

const UOM = ['kg', 'g', 'ton', 'mm', 'm', 'pcs', 'litre', 'ml', 'set']

const TXN_TYPES = [
  'receive', 'issue', 'return', 'adjustment_in', 'adjustment_out',
  'transfer_in', 'transfer_out', 'wip_in', 'wip_out', 'scrap',
]

// ── Receive stock (GRN) ───────────────────────────────────────
export const receiveStockSchema = Joi.object({
  raw_material_id:  Joi.string().uuid().required()
    .messages({ 'any.required': 'Raw material is required.' }),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  quantity:         Joi.number().positive().required()
    .messages({
      'number.positive': 'Quantity must be greater than zero.',
      'any.required':    'Quantity is required.',
    }),
  uom:              Joi.string().valid(...UOM).default('kg'),
  reference_number: Joi.string().trim().max(100).allow('', null),
  reference_date:   Joi.date().iso().allow(null),
  unit_cost:        Joi.number().min(0).allow(null),
  notes:            Joi.string().trim().max(1000).allow('', null),
})

// ── Manual stock adjustment ───────────────────────────────────
export const adjustStockSchema = Joi.object({
  raw_material_id:  Joi.string().uuid().required()
    .messages({ 'any.required': 'Raw material is required.' }),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  adjustment_type:  Joi.string().valid('adjustment_in', 'adjustment_out').required()
    .messages({ 'any.required': 'Adjustment type is required.' }),
  quantity:         Joi.number().positive().required()
    .messages({
      'number.positive': 'Quantity must be greater than zero.',
      'any.required':    'Quantity is required.',
    }),
  uom:              Joi.string().valid(...UOM).default('kg'),
  reference_number: Joi.string().trim().max(100).allow('', null),
  reason:           Joi.string().trim().max(500).allow('', null),
  notes:            Joi.string().trim().max(1000).allow('', null),
})

// ── Transfer between warehouses ───────────────────────────────
export const transferStockSchema = Joi.object({
  raw_material_id:    Joi.string().uuid().required(),
  from_warehouse_id:  Joi.string().uuid().required(),
  to_warehouse_id:    Joi.string().uuid().required(),
  quantity:           Joi.number().positive().required(),
  uom:                Joi.string().valid(...UOM).default('kg'),
  reference_number:   Joi.string().trim().max(100).allow('', null),
  notes:              Joi.string().trim().max(1000).allow('', null),
})

// ── Scrap stock ───────────────────────────────────────────────
export const scrapStockSchema = Joi.object({
  raw_material_id:  Joi.string().uuid().required(),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  quantity:         Joi.number().positive().required(),
  uom:              Joi.string().valid(...UOM).default('kg'),
  batch_id:         Joi.string().uuid().allow(null, ''),
  reference_number: Joi.string().trim().max(100).allow('', null),
  reason:           Joi.string().trim().max(500).allow('', null),
  notes:            Joi.string().trim().max(1000).allow('', null),
})

// ── List transactions (ledger) ────────────────────────────────
export const listTransactionsSchema = Joi.object({
  page:             Joi.number().integer().min(1).default(1),
  pageSize:         Joi.number().integer().min(1).max(100).default(50),
  raw_material_id:  Joi.string().uuid().allow('', null),
  warehouse_id:     Joi.string().uuid().allow('', null),
  transaction_type: Joi.string().valid(...TXN_TYPES, '').allow('', null),
  batch_id:         Joi.string().uuid().allow('', null),
  from_date:        Joi.date().iso().allow('', null),
  to_date:          Joi.date().iso().allow('', null),
  search:           Joi.string().trim().max(100).allow('', null),
})

// ── List stock positions ──────────────────────────────────────
export const listStockPositionsSchema = Joi.object({
  page:            Joi.number().integer().min(1).default(1),
  pageSize:        Joi.number().integer().min(1).max(100).default(50),
  search:          Joi.string().trim().max(100).allow('', null),
  category:        Joi.string().trim().max(100).allow('', null),
  status:          Joi.string().valid('active', 'inactive', '').allow('', null),
  low_stock_only:  Joi.boolean().default(false),
})

// ── List WIP ──────────────────────────────────────────────────
export const listWipSchema = Joi.object({
  page:       Joi.number().integer().min(1).default(1),
  pageSize:   Joi.number().integer().min(1).max(100).default(20),
  batch_id:   Joi.string().uuid().allow('', null),
  is_closed:  Joi.boolean().allow(null),
})
