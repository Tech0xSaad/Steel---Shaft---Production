import Joi from 'joi'

const FG_MOVEMENT_TYPES = ['production_receipt', 'adjustment_in', 'adjustment_out', 'dispatch', 'return', 'transfer']

export const fgAdjustInSchema = Joi.object({
  product_id:       Joi.string().uuid().required()
    .messages({ 'any.required': 'Product ID is required.' }),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  quantity:         Joi.number().positive().required()
    .messages({ 'any.required': 'Quantity is required.', 'number.positive': 'Quantity must be greater than zero.' }),
  uom:              Joi.string().trim().max(20).default('pcs'),
  unit_cost:        Joi.number().min(0).default(0),
  reference_number: Joi.string().trim().max(100).allow('', null),
  notes:            Joi.string().trim().max(500).allow('', null),
})

export const fgAdjustOutSchema = Joi.object({
  product_id:       Joi.string().uuid().required()
    .messages({ 'any.required': 'Product ID is required.' }),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  quantity:         Joi.number().positive().required()
    .messages({ 'any.required': 'Quantity is required.', 'number.positive': 'Quantity must be greater than zero.' }),
  uom:              Joi.string().trim().max(20).default('pcs'),
  reference_number: Joi.string().trim().max(100).allow('', null),
  reason:           Joi.string().trim().max(300).allow('', null),
  notes:            Joi.string().trim().max(500).allow('', null),
})

export const fgDispatchSchema = Joi.object({
  product_id:       Joi.string().uuid().required()
    .messages({ 'any.required': 'Product ID is required.' }),
  warehouse_id:     Joi.string().uuid().allow(null, ''),
  quantity:         Joi.number().positive().required()
    .messages({ 'any.required': 'Quantity is required.', 'number.positive': 'Quantity must be greater than zero.' }),
  uom:              Joi.string().trim().max(20).default('pcs'),
  reference_number: Joi.string().trim().max(100).allow('', null),
  notes:            Joi.string().trim().max(500).allow('', null),
})

export const listFgPositionsSchema = Joi.object({
  product_id:   Joi.string().uuid().allow('', null),
  warehouse_id: Joi.string().uuid().allow('', null),
  page:         Joi.number().integer().min(1).default(1),
  pageSize:     Joi.number().integer().min(1).max(100).default(20),
})

export const listFgTransactionsSchema = Joi.object({
  product_id:    Joi.string().uuid().allow('', null),
  warehouse_id:  Joi.string().uuid().allow('', null),
  movement_type: Joi.string().valid(...FG_MOVEMENT_TYPES, '').allow('', null),
  batch_id:      Joi.string().uuid().allow('', null),
  page:          Joi.number().integer().min(1).default(1),
  pageSize:      Joi.number().integer().min(1).max(100).default(20),
})
