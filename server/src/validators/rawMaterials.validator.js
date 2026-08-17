import Joi from 'joi'

const UOM      = ['kg', 'g', 'ton', 'mm', 'm', 'pcs', 'litre', 'ml', 'set']
const STATUSES = ['active', 'inactive']

const rawMaterialBody = {
  code:                Joi.string().trim().max(50).required()
    .messages({ 'any.required': 'Material code is required.' }),
  name:                Joi.string().trim().max(200).required()
    .messages({ 'any.required': 'Material name is required.' }),
  description:         Joi.string().trim().max(1000).allow('', null),
  category:            Joi.string().trim().max(100).allow('', null),
  uom:                 Joi.string().valid(...UOM).default('kg'),

  // Physical properties
  grade:               Joi.string().trim().max(100).allow('', null),
  diameter_mm:         Joi.number().positive().allow(null),
  length_mm:           Joi.number().positive().allow(null),
  weight_per_unit_kg:  Joi.number().positive().allow(null),

  // Inventory thresholds
  min_stock_qty:       Joi.number().min(0).default(0),
  reorder_qty:         Joi.number().min(0).default(0),
  current_stock_qty:   Joi.number().min(0).default(0),

  // Costing
  unit_cost:           Joi.number().min(0).default(0),

  // Supplier
  primary_supplier:    Joi.string().trim().max(200).allow('', null),
  lead_time_days:      Joi.number().integer().min(0).default(0),

  status:              Joi.string().valid(...STATUSES).default('active'),
  notes:               Joi.string().trim().max(1000).allow('', null),
}

export const createRawMaterialSchema = Joi.object(rawMaterialBody)

export const updateRawMaterialSchema = Joi.object(
  Object.fromEntries(
    Object.entries(rawMaterialBody).map(([k, v]) => [k, v.optional()])
  )
)

export const listRawMaterialsSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search:   Joi.string().trim().max(100).allow('', null),
  status:   Joi.string().valid(...STATUSES, '').allow('', null),
  category: Joi.string().trim().max(100).allow('', null),
})
