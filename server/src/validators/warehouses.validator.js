import Joi from 'joi'

const TYPES = ['raw_material', 'finished_goods', 'wip', 'general']

const warehouseBody = {
  code:           Joi.string().trim().max(50).required()
    .messages({ 'any.required': 'Warehouse code is required.' }),
  name:           Joi.string().trim().max(200).required()
    .messages({ 'any.required': 'Warehouse name is required.' }),
  description:    Joi.string().trim().max(1000).allow('', null),
  warehouse_type: Joi.string().valid(...TYPES).default('general'),

  // Location
  address:        Joi.string().trim().max(500).allow('', null),
  city:           Joi.string().trim().max(100).allow('', null),
  state:          Joi.string().trim().max(100).allow('', null),

  // Capacity
  total_capacity: Joi.number().positive().allow(null),
  capacity_uom:   Joi.string().trim().max(50).allow('', null),

  // Contact
  manager_name:   Joi.string().trim().max(200).allow('', null),
  contact_phone:  Joi.string().trim().max(30).allow('', null),

  is_active:      Joi.boolean().default(true),
  notes:          Joi.string().trim().max(1000).allow('', null),
}

export const createWarehouseSchema = Joi.object(warehouseBody)

export const updateWarehouseSchema = Joi.object(
  Object.fromEntries(
    Object.entries(warehouseBody).map(([k, v]) => [k, v.optional()])
  )
)

export const listWarehousesSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search:   Joi.string().trim().max(100).allow('', null),
  type:     Joi.string().valid(...TYPES, '').allow('', null),
  is_active: Joi.boolean().allow(null),
})
