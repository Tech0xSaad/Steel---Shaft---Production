/**
 * Client-side mirrors of the Phase 6 DB enums.
 * Keep in sync with server/src/constants/inventoryTypes.js
 */

// ── Inspection Status ─────────────────────────────────────────
export const INSPECTION_STATUS = Object.freeze({
  PENDING:          'pending',
  IN_PROGRESS:      'in_progress',
  PASSED:           'passed',
  PARTIALLY_PASSED: 'partially_passed',
  FAILED:           'failed',
  ON_HOLD:          'on_hold',
})

export const INSPECTION_STATUS_LABELS = Object.freeze({
  pending:          'Pending',
  in_progress:      'In Progress',
  passed:           'Passed',
  partially_passed: 'Partially Passed',
  failed:           'Failed',
  on_hold:          'On Hold',
})

/** Badge variant per inspection status */
export const INSPECTION_STATUS_VARIANTS = Object.freeze({
  pending:          'default',
  in_progress:      'warning',
  passed:           'success',
  partially_passed: 'warning',
  failed:           'danger',
  on_hold:          'info',
})

// ── Scrap Categories ──────────────────────────────────────────
export const SCRAP_CATEGORY = Object.freeze({
  DIMENSIONAL:    'dimensional',
  SURFACE:        'surface',
  HARDNESS:       'hardness',
  CRACK:          'crack',
  MATERIAL:       'material',
  MACHINING:      'machining',
  HEAT_TREATMENT: 'heat_treatment',
  OTHER:          'other',
})

export const SCRAP_CATEGORY_LABELS = Object.freeze({
  dimensional:    'Dimensional',
  surface:        'Surface Finish',
  hardness:       'Hardness',
  crack:          'Crack / Fracture',
  material:       'Material Defect',
  machining:      'Machining Error',
  heat_treatment: 'Heat Treatment',
  other:          'Other',
})

export const SCRAP_CATEGORY_OPTIONS = Object.entries(SCRAP_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
)

// ── Finished Goods Movement Types ────────────────────────────
export const FG_MOVEMENT_TYPE = Object.freeze({
  PRODUCTION_RECEIPT: 'production_receipt',
  ADJUSTMENT_IN:      'adjustment_in',
  ADJUSTMENT_OUT:     'adjustment_out',
  DISPATCH:           'dispatch',
  RETURN:             'return',
  TRANSFER:           'transfer',
})

export const FG_MOVEMENT_LABELS = Object.freeze({
  production_receipt: 'Production Receipt',
  adjustment_in:      'Adjustment In',
  adjustment_out:     'Adjustment Out',
  dispatch:           'Dispatch',
  return:             'Customer Return',
  transfer:           'Transfer',
})

/** Badge variant per FG movement type */
export const FG_MOVEMENT_VARIANTS = Object.freeze({
  production_receipt: 'success',
  adjustment_in:      'info',
  adjustment_out:     'warning',
  dispatch:           'primary',
  return:             'default',
  transfer:           'default',
})
