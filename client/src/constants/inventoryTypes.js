/**
 * Client-side mirror of server/src/constants/inventoryTypes.js
 * Keep in sync with the server constants.
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

/** Badge variant for each transaction type */
export const TXN_VARIANTS = Object.freeze({
  receive:        'success',
  issue:          'primary',
  return:         'info',
  adjustment_in:  'success',
  adjustment_out: 'warning',
  transfer_in:    'info',
  transfer_out:   'info',
  wip_in:         'primary',
  wip_out:        'success',
  scrap:          'danger',
})

/** +/- indicator for ledger display */
export const TXN_DIRECTION = Object.freeze({
  receive:        '+',
  issue:          '→',
  return:         '+',
  adjustment_in:  '+',
  adjustment_out: '−',
  transfer_in:    '+',
  transfer_out:   '−',
  wip_in:         '→',
  wip_out:        '→',
  scrap:          '−',
})

export const TXN_TYPE_OPTIONS = Object.entries(TXN_LABELS).map(([value, label]) => ({ value, label }))
