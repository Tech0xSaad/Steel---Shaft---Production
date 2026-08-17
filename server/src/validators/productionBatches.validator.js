import Joi from 'joi'

const STATUSES = [
  'created', 'reserved', 'issued', 'production_started',
  'in_progress', 'inspection', 'completed', 'closed',
]
const UOM = ['kg', 'g', 'ton', 'mm', 'm', 'pcs', 'litre', 'ml', 'set']

// ── Create batch ──────────────────────────────────────────────
export const createBatchSchema = Joi.object({
  product_id:         Joi.string().uuid().required()
    .messages({ 'any.required': 'Product is required.' }),
  bom_id:             Joi.string().uuid().required()
    .messages({ 'any.required': 'BOM is required.' }),
  planned_qty:        Joi.number().positive().required()
    .messages({
      'number.positive': 'Planned quantity must be greater than zero.',
      'any.required':    'Planned quantity is required.',
    }),
  uom:                Joi.string().valid(...UOM).default('pcs'),
  planned_start_date: Joi.date().iso().allow(null),
  planned_end_date:   Joi.date().iso().min(Joi.ref('planned_start_date')).allow(null)
    .messages({ 'date.min': 'End date must be on or after start date.' }),
  machine_id:         Joi.string().uuid().allow(null, ''),
  warehouse_id:       Joi.string().uuid().allow(null, ''),
  priority:           Joi.number().integer().min(1).max(10).default(5),
  notes:              Joi.string().trim().max(1000).allow('', null),
  batch_number:       Joi.string().trim().max(50).allow('', null),  // auto-generated if omitted
})

// ── Update planning fields only (allowed while status = 'created') ────────
export const updateBatchSchema = Joi.object({
  planned_qty:        Joi.number().positive(),
  uom:                Joi.string().valid(...UOM),
  planned_start_date: Joi.date().iso().allow(null),
  planned_end_date:   Joi.date().iso().allow(null),
  machine_id:         Joi.string().uuid().allow(null, ''),
  warehouse_id:       Joi.string().uuid().allow(null, ''),
  priority:           Joi.number().integer().min(1).max(10),
  notes:              Joi.string().trim().max(1000).allow('', null),
})

// ── Lifecycle transition ──────────────────────────────────────
export const transitionBatchSchema = Joi.object({
  to_status: Joi.string().valid(...STATUSES).required()
    .messages({ 'any.required': 'Target status is required.' }),
  notes:     Joi.string().trim().max(1000).allow('', null),
  // actuals recorded when completing
  actual_qty_produced: Joi.number().min(0).allow(null),
  actual_qty_scrapped: Joi.number().min(0).allow(null),
})

// ── List query ────────────────────────────────────────────────
export const listBatchesSchema = Joi.object({
  page:       Joi.number().integer().min(1).default(1),
  pageSize:   Joi.number().integer().min(1).max(100).default(20),
  search:     Joi.string().trim().max(100).allow('', null),
  status:     Joi.string().valid(...STATUSES, '').allow('', null),
  product_id: Joi.string().uuid().allow('', null),
  from_date:  Joi.date().iso().allow('', null),
  to_date:    Joi.date().iso().allow('', null),
})
