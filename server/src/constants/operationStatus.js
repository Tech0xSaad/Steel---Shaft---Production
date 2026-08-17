/**
 * Manufacturing operation lifecycle constants.
 * Mirrors the operation_status DB enum from migration 004.
 */
export const OP_STATUS = Object.freeze({
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  ON_HOLD:     'on_hold',
  COMPLETED:   'completed',
  REJECTED:    'rejected',
  SKIPPED:     'skipped',
})

/** Valid status transitions for batch_operations */
export const OP_TRANSITIONS = Object.freeze({
  pending:     ['in_progress', 'skipped'],
  in_progress: ['on_hold', 'completed', 'rejected'],
  on_hold:     ['in_progress', 'rejected', 'skipped'],
  completed:   [],            // terminal
  rejected:    ['in_progress'], // can restart after rejection
  skipped:     [],            // terminal
})

export function isValidOpTransition(from, to) {
  return OP_TRANSITIONS[from]?.includes(to) ?? false
}

export const OP_STATUS_LABELS = Object.freeze({
  pending:     'Pending',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
  rejected:    'Rejected',
  skipped:     'Skipped',
})
