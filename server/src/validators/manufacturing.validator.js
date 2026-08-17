import Joi from 'joi'

const OP_STATUSES = ['pending', 'in_progress', 'on_hold', 'completed', 'rejected', 'skipped']

// ── Operation Types (master) ──────────────────────────────────
export const createOpTypeSchema = Joi.object({
  code:                    Joi.string().trim().max(50).uppercase().required()
    .messages({ 'any.required': 'Operation code is required.' }),
  name:                    Joi.string().trim().max(200).required()
    .messages({ 'any.required': 'Operation name is required.' }),
  description:             Joi.string().trim().max(1000).allow('', null),
  category:                Joi.string().trim().max(100).allow('', null),
  sequence_no:             Joi.number().integer().min(0).default(0),
  standard_time_minutes:   Joi.number().positive().allow(null),
  is_active:               Joi.boolean().default(true),
  notes:                   Joi.string().trim().max(1000).allow('', null),
})

export const updateOpTypeSchema = Joi.object({
  name:                    Joi.string().trim().max(200),
  description:             Joi.string().trim().max(1000).allow('', null),
  category:                Joi.string().trim().max(100).allow('', null),
  sequence_no:             Joi.number().integer().min(0),
  standard_time_minutes:   Joi.number().positive().allow(null),
  is_active:               Joi.boolean(),
  notes:                   Joi.string().trim().max(1000).allow('', null),
})

// ── Batch Operations ──────────────────────────────────────────
export const addOperationSchema = Joi.object({
  operation_type_id: Joi.string().uuid().required()
    .messages({ 'any.required': 'Operation type is required.' }),
  sequence_no:       Joi.number().integer().min(0).default(0),
  machine_id:        Joi.string().uuid().allow(null, ''),
  operator_name:     Joi.string().trim().max(200).allow('', null),
  planned_qty:       Joi.number().positive().allow(null),
  planned_start_at:  Joi.date().iso().allow(null),
  planned_end_at:    Joi.date().iso().allow(null),
  notes:             Joi.string().trim().max(1000).allow('', null),
})

export const updateOperationSchema = Joi.object({
  sequence_no:      Joi.number().integer().min(0),
  machine_id:       Joi.string().uuid().allow(null, ''),
  operator_name:    Joi.string().trim().max(200).allow('', null),
  planned_qty:      Joi.number().positive().allow(null),
  planned_start_at: Joi.date().iso().allow(null),
  planned_end_at:   Joi.date().iso().allow(null),
  notes:            Joi.string().trim().max(1000).allow('', null),
})

export const transitionOperationSchema = Joi.object({
  to_status:        Joi.string().valid(...OP_STATUSES).required()
    .messages({ 'any.required': 'Target status is required.' }),
  machine_id:       Joi.string().uuid().allow(null, ''),
  operator_name:    Joi.string().trim().max(200).allow('', null),
  actual_start_at:  Joi.date().iso().allow(null),
  actual_end_at:    Joi.date().iso().allow(null),
  qty_output:       Joi.number().min(0).allow(null),
  qty_rejected:     Joi.number().min(0).allow(null),
  qty_rework:       Joi.number().min(0).allow(null),
  rejection_reason: Joi.string().trim().max(500).allow('', null),
  notes:            Joi.string().trim().max(1000).allow('', null),
})

export const listOperationsSchema = Joi.object({
  batch_id:   Joi.string().uuid().allow('', null),
  status:     Joi.string().valid(...OP_STATUSES, '').allow('', null),
  machine_id: Joi.string().uuid().allow('', null),
  page:       Joi.number().integer().min(1).default(1),
  pageSize:   Joi.number().integer().min(1).max(100).default(50),
})

// ── Production Entries ────────────────────────────────────────
export const addProductionEntrySchema = Joi.object({
  shift:             Joi.string().trim().max(50).allow('', null),
  machine_id:        Joi.string().uuid().allow(null, ''),
  operator_name:     Joi.string().trim().max(200).allow('', null),
  qty_produced:      Joi.number().min(0).default(0),
  qty_rejected:      Joi.number().min(0).default(0),
  qty_rework:        Joi.number().min(0).default(0),
  start_time:        Joi.date().iso().allow(null),
  end_time:          Joi.date().iso().allow(null),
  rejection_reason:  Joi.string().trim().max(500).allow('', null),
  quality_notes:     Joi.string().trim().max(500).allow('', null),
  notes:             Joi.string().trim().max(1000).allow('', null),
})

export const listEntriesSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(50),
})
