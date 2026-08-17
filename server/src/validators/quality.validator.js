import Joi from 'joi'

const INSPECTION_STATUSES = ['pending', 'in_progress', 'passed', 'partially_passed', 'failed', 'on_hold']
const SCRAP_CATEGORIES    = ['dimensional', 'surface', 'hardness', 'crack', 'material', 'machining', 'heat_treatment', 'other']

export const createQualityCheckSchema = Joi.object({
  inspector_name:     Joi.string().trim().max(200).allow('', null),
  inspection_date:    Joi.date().iso().allow(null),
  inspection_start_at: Joi.date().iso().allow(null),
  inspection_end_at:  Joi.date().iso().allow(null),
  qty_inspected:      Joi.number().min(0).required()
    .messages({ 'any.required': 'Inspected quantity is required.' }),
  uom:                Joi.string().trim().max(20).default('pcs'),
  rejection_reasons:  Joi.array().items(Joi.string().trim().max(200)).allow(null),
  rejection_notes:    Joi.string().trim().max(1000).allow('', null),
  parameters:         Joi.object().allow(null),
  report_reference:   Joi.string().trim().max(100).allow('', null),
  notes:              Joi.string().trim().max(1000).allow('', null),
})

export const updateQualityCheckSchema = Joi.object({
  inspector_name:     Joi.string().trim().max(200).allow('', null),
  inspection_date:    Joi.date().iso().allow(null),
  inspection_start_at: Joi.date().iso().allow(null),
  qty_inspected:      Joi.number().min(0),
  uom:                Joi.string().trim().max(20),
  rejection_reasons:  Joi.array().items(Joi.string().trim().max(200)).allow(null),
  rejection_notes:    Joi.string().trim().max(1000).allow('', null),
  parameters:         Joi.object().allow(null),
  report_reference:   Joi.string().trim().max(100).allow('', null),
  notes:              Joi.string().trim().max(1000).allow('', null),
})

export const submitResultSchema = Joi.object({
  qty_passed:          Joi.number().min(0).default(0),
  qty_rejected:        Joi.number().min(0).default(0),
  qty_on_hold:         Joi.number().min(0).default(0),
  rejection_reasons:   Joi.array().items(Joi.string().trim().max(200)).allow(null),
  rejection_notes:     Joi.string().trim().max(1000).allow('', null),
  parameters:          Joi.object().allow(null),
  report_reference:    Joi.string().trim().max(100).allow('', null),
  inspection_end_at:   Joi.date().iso().allow(null),
  notes:               Joi.string().trim().max(1000).allow('', null),
  // Auto-scrap fields for rejected qty
  scrap_category:      Joi.string().valid(...SCRAP_CATEGORIES).default('other'),
  scrap_description:   Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const total = (value.qty_passed ?? 0) + (value.qty_rejected ?? 0) + (value.qty_on_hold ?? 0)
  if (total === 0) {
    return helpers.error('any.invalid', { message: 'At least one quantity (passed, rejected, or on-hold) must be greater than zero.' })
  }
  return value
})

export const listQualityChecksSchema = Joi.object({
  batch_id:  Joi.string().uuid().allow('', null),
  status:    Joi.string().valid(...INSPECTION_STATUSES, '').allow('', null),
  from_date: Joi.date().iso().allow(null),
  to_date:   Joi.date().iso().allow(null),
  page:      Joi.number().integer().min(1).default(1),
  pageSize:  Joi.number().integer().min(1).max(100).default(20),
})
