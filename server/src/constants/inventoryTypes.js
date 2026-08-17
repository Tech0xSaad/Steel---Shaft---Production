/**
 * Inventory transaction types — mirror of the DB enum
 * inventory_transaction_type.
 */
export const TXN_TYPE = Object.freeze({
  RECEIVE:        'receive',
  ISSUE:          'issue',
  RETURN:         'return',
  ADJUSTMENT_IN:  'adjustment_in',
  ADJUSTMENT_OUT: 'adjustment_out',
  TRANSFER_IN:    'transfer_in',
  TRANSFER_OUT:   'transfer_out',
  WIP_IN:         'wip_in',
  WIP_OUT:        'wip_out',
  SCRAP:          'scrap',
})

/**
 * Finished Goods movement types — mirror of the DB enum fg_movement_type.
 */
export const FG_MOVEMENT_TYPE = Object.freeze({
  PRODUCTION_RECEIPT: 'production_receipt',
  ADJUSTMENT_IN:      'adjustment_in',
  ADJUSTMENT_OUT:     'adjustment_out',
  DISPATCH:           'dispatch',
  RETURN:             'return',
  TRANSFER:           'transfer',
})

/** Human-readable labels for FG movement types */
export const FG_MOVEMENT_LABELS = Object.freeze({
  production_receipt: 'Production Receipt',
  adjustment_in:      'Adjustment In',
  adjustment_out:     'Adjustment Out',
  dispatch:           'Dispatch',
  return:             'Customer Return',
  transfer:           'Transfer',
})

/**
 * Scrap categories — mirror of the DB enum scrap_category.
 */
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

/** Human-readable labels for scrap categories */
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

/**
 * Inspection statuses — mirror of the DB enum inspection_status.
 */
export const INSPECTION_STATUS = Object.freeze({
  PENDING:          'pending',
  IN_PROGRESS:      'in_progress',
  PASSED:           'passed',
  PARTIALLY_PASSED: 'partially_passed',
  FAILED:           'failed',
  ON_HOLD:          'on_hold',
})

/** Direction effect on physical stock (current_stock_qty) */
export const TXN_STOCK_EFFECT = Object.freeze({
  receive:        +1,   // increases physical stock
  issue:           0,   // no change — already deducted at reservation
  return:         +1,   // returned from shop floor → back to store
  adjustment_in:  +1,
  adjustment_out: -1,
  transfer_in:    +1,
  transfer_out:   -1,
  wip_in:          0,   // ledger only — WIP qty tracked separately
  wip_out:         0,
  scrap:          -1,
})

/** Human-readable labels for display */
export const TXN_LABELS = Object.freeze({
  receive:        'Receive (GRN)',
  issue:          'Issue to Production',
  return:         'Return from Production',
  adjustment_in:  'Adjustment In',
  adjustment_out: 'Adjustment Out',
  transfer_in:    'Transfer In',
  transfer_out:   'Transfer Out',
  wip_in:         'WIP In',
  wip_out:        'WIP Out',
  scrap:          'Scrap',
})

export const INVENTORY_LOCATION = Object.freeze({
  RAW_MATERIAL:   'raw_material',
  RESERVED:       'reserved',
  WIP:            'wip',
  FINISHED_GOODS: 'finished_goods',
  SCRAP:          'scrap',
})

/** from/to location pairs for each transaction type */
export const TXN_LOCATION_MAP = Object.freeze({
  receive:        { from: null,             to: 'raw_material'   },
  issue:          { from: 'reserved',       to: 'wip'            },
  return:         { from: 'wip',            to: 'raw_material'   },
  adjustment_in:  { from: null,             to: 'raw_material'   },
  adjustment_out: { from: 'raw_material',   to: null             },
  transfer_in:    { from: null,             to: 'raw_material'   },
  transfer_out:   { from: 'raw_material',   to: null             },
  wip_in:         { from: 'raw_material',   to: 'wip'            },
  wip_out:        { from: 'wip',            to: 'finished_goods' },
  scrap:          { from: 'wip',            to: 'scrap'          },
})
