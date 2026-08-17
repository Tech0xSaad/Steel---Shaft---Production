import Joi from 'joi'

const UOM = ['kg', 'g', 'ton', 'mm', 'm', 'pcs', 'litre', 'ml', 'set']

const bomItemShape = Joi.object({
  id:                 Joi.string().uuid().allow(null),       // present on update
  raw_material_id:    Joi.string().uuid().required()
    .messages({ 'any.required': 'Raw material is required for each BOM line.' }),
  quantity_required:  Joi.number().positive().required()
    .messages({
      'number.positive': 'Quantity must be greater than zero.',
      'any.required':    'Quantity is required for each BOM line.',
    }),
  uom:                Joi.string().valid(...UOM).default('kg'),
  scrap_allowance_pct: Joi.number().min(0).max(100).default(0),
  notes:              Joi.string().trim().max(500).allow('', null),
})

export const createBomSchema = Joi.object({
  product_id: Joi.string().uuid().required()
    .messages({ 'any.required': 'Product is required.' }),
  version:    Joi.string().trim().max(20).default('1.0'),
  is_active:  Joi.boolean().default(true),
  notes:      Joi.string().trim().max(1000).allow('', null),
  items:      Joi.array().items(bomItemShape).min(1).required()
    .messages({
      'array.min':   'BOM must have at least one material line.',
      'any.required': 'BOM items are required.',
    }),
})

export const updateBomSchema = Joi.object({
  version:   Joi.string().trim().max(20),
  is_active: Joi.boolean(),
  notes:     Joi.string().trim().max(1000).allow('', null),
  items:     Joi.array().items(bomItemShape).min(1),
})

export const listBomSchema = Joi.object({
  page:       Joi.number().integer().min(1).default(1),
  pageSize:   Joi.number().integer().min(1).max(100).default(20),
  product_id: Joi.string().uuid().allow('', null),
  is_active:  Joi.boolean().allow(null),
})
