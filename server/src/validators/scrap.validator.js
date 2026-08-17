import Joi from 'joi'

const SCRAP_CATEGORIES = ['dimensional', 'surface', 'hardness', 'crack', 'material', 'machining', 'heat_treatment', 'other']

export const createScrapSchema = Joi.object({
  batch_id:           Joi.string().uuid().required()
    .messages({ 'any.required': 'Batch ID is required.' }),
  quality_check_id:   Joi.string().uuid().allow(null, ''),
  batch_operation_id: Joi.string().uuid().allow(null, ''),
  scrap_date:         Joi.date().iso().allow(null),
  scrap_category:     Joi.string().valid(...SCRAP_CATEGORIES).default('other'),
  description:        Joi.string().trim().max(500).allow('', null),
  qty_scrapped:       Joi.number().positive().required()
    .messages({ 'any.required': 'Scrap quantity is required.', 'number.positive': 'Scrap quantity must be greater than zero.' }),
  weight_kg:          Joi.number().positive().allow(null),
  uom:                Joi.string().trim().max(20).default('pcs'),
  machine_id:         Joi.string().uuid().allow(null, ''),
  department:         Joi.string().trim().max(100).allow('', null),
  operator_name:      Joi.string().trim().max(200).allow('', null),
  unit_cost:          Joi.number().min(0).default(0),
  disposal_method:    Joi.string().trim().max(100).allow('', null),
  disposal_notes:     Joi.string().trim().max(500).allow('', null),
  disposed_at:        Joi.date().iso().allow(null),
  notes:              Joi.string().trim().max(1000).allow('', null),
})

export const updateScrapSchema = Joi.object({
  scrap_date:         Joi.date().iso().allow(null),
  scrap_category:     Joi.string().valid(...SCRAP_CATEGORIES),
  description:        Joi.string().trim().max(500).allow('', null),
  qty_scrapped:       Joi.number().positive(),
  weight_kg:          Joi.number().positive().allow(null),
  uom:                Joi.string().trim().max(20),
  machine_id:         Joi.string().uuid().allow(null, ''),
  department:         Joi.string().trim().max(100).allow('', null),
  operator_name:      Joi.string().trim().max(200).allow('', null),
  unit_cost:          Joi.number().min(0),
  notes:              Joi.string().trim().max(1000).allow('', null),
})

export const disposeScrapSchema = Joi.object({
  disposal_method: Joi.string().trim().max(100).required()
    .messages({ 'any.required': 'Disposal method is required.' }),
  disposal_notes:  Joi.string().trim().max(500).allow('', null),
  disposed_at:     Joi.date().iso().allow(null),
})

export const listScrapSchema = Joi.object({
  batch_id:       Joi.string().uuid().allow('', null),
  scrap_category: Joi.string().valid(...SCRAP_CATEGORIES, '').allow('', null),
  machine_id:     Joi.string().uuid().allow('', null),
  from_date:      Joi.date().iso().allow(null),
  to_date:        Joi.date().iso().allow(null),
  page:           Joi.number().integer().min(1).default(1),
  pageSize:       Joi.number().integer().min(1).max(100).default(20),
})

export const scrapSummarySchema = Joi.object({
  batch_id:  Joi.string().uuid().allow('', null),
  from_date: Joi.date().iso().allow(null),
  to_date:   Joi.date().iso().allow(null),
})
