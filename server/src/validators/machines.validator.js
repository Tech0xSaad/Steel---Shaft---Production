import Joi from 'joi'

const STATUSES = ['active', 'idle', 'maintenance', 'retired']

const machineBody = {
  code:                    Joi.string().trim().max(50).required()
    .messages({ 'any.required': 'Machine code is required.' }),
  name:                    Joi.string().trim().max(200).required()
    .messages({ 'any.required': 'Machine name is required.' }),
  description:             Joi.string().trim().max(1000).allow('', null),
  machine_type:            Joi.string().trim().max(100).allow('', null),
  make:                    Joi.string().trim().max(100).allow('', null),
  model:                   Joi.string().trim().max(100).allow('', null),
  year_of_manufacture:     Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),

  // Capacity
  capacity_per_hour:       Joi.number().positive().allow(null),
  capacity_uom:            Joi.string().trim().max(50).allow('', null),

  // Maintenance
  last_maintenance_at:     Joi.date().iso().allow(null),
  next_maintenance_at:     Joi.date().iso().allow(null),
  maintenance_cycle_days:  Joi.number().integer().positive().allow(null),

  // Location
  location:                Joi.string().trim().max(200).allow('', null),
  department:              Joi.string().trim().max(100).allow('', null),

  // Costing
  hourly_rate:             Joi.number().min(0).default(0),

  status:                  Joi.string().valid(...STATUSES).default('active'),
  notes:                   Joi.string().trim().max(1000).allow('', null),
}

export const createMachineSchema = Joi.object(machineBody)

export const updateMachineSchema = Joi.object(
  Object.fromEntries(
    Object.entries(machineBody).map(([k, v]) => [k, v.optional()])
  )
)

export const listMachinesSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search:   Joi.string().trim().max(100).allow('', null),
  status:   Joi.string().valid(...STATUSES, '').allow('', null),
})
