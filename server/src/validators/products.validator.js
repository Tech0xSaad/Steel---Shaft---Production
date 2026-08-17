import Joi from 'joi'

const UOM     = ['kg', 'g', 'ton', 'mm', 'm', 'pcs', 'litre', 'ml', 'set']
const STATUSES = ['active', 'inactive', 'discontinued']

const productBody = {
  code:                Joi.string().trim().max(50).required()
    .messages({ 'any.required': 'Product code is required.' }),
  name:                Joi.string().trim().max(200).required()
    .messages({ 'any.required': 'Product name is required.' }),
  description:         Joi.string().trim().max(1000).allow('', null),
  category:            Joi.string().trim().max(100).allow('', null),
  uom:                 Joi.string().valid(...UOM).default('pcs'),

  // Physical attributes
  diameter_mm:         Joi.number().positive().allow(null),
  length_mm:           Joi.number().positive().allow(null),
  weight_kg:           Joi.number().positive().allow(null),

  // Manufacturing standards
  material_grade:      Joi.string().trim().max(100).allow('', null),
  hardness_spec:       Joi.string().trim().max(100).allow('', null),
  surface_finish:      Joi.string().trim().max(100).allow('', null),
  tolerance_spec:      Joi.string().trim().max(200).allow('', null),

  // Production parameters
  cycle_time_minutes:  Joi.number().min(0).allow(null),
  setup_time_minutes:  Joi.number().min(0).allow(null),
  expected_scrap_pct:  Joi.number().min(0).max(100).default(0),

  // Costing
  standard_cost:       Joi.number().min(0).default(0),
  selling_price:       Joi.number().min(0).default(0),

  status:              Joi.string().valid(...STATUSES).default('active'),
  notes:               Joi.string().trim().max(1000).allow('', null),
}

export const createProductSchema = Joi.object(productBody)

export const updateProductSchema = Joi.object(
  Object.fromEntries(
    Object.entries(productBody).map(([k, v]) => [k, v.optional()])
  )
)

export const listProductsSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search:   Joi.string().trim().max(100).allow('', null),
  status:   Joi.string().valid(...STATUSES, '').allow('', null),
  category: Joi.string().trim().max(100).allow('', null),
})
