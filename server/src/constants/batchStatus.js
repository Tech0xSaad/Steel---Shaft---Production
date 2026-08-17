/**
 * Batch lifecycle state machine.
 *
 * ALLOWED_TRANSITIONS defines which target states are reachable
 * from each source state. The service enforces this before any
 * transition, so invalid moves are rejected with a 422.
 *
 * Full lifecycle:
 *
 *  created
 *    └→ reserved          (materials locked in stock)
 *         └→ issued        (materials handed to shop floor)
 *              └→ production_started
 *                   └→ in_progress
 *                        └→ inspection
 *                             └→ completed
 *                                  └→ closed
 *
 * From any non-closed state:
 *    created  ← (can revert reservation back to created)
 *
 * created can also jump straight to closed (cancelled plan).
 */
export const BATCH_STATUS = Object.freeze({
  CREATED:             'created',
  RESERVED:            'reserved',
  ISSUED:              'issued',
  PRODUCTION_STARTED:  'production_started',
  IN_PROGRESS:         'in_progress',
  INSPECTION:          'inspection',
  COMPLETED:           'completed',
  CLOSED:              'closed',
})

export const ALLOWED_TRANSITIONS = Object.freeze({
  created:             ['reserved', 'closed'],
  reserved:            ['issued', 'created', 'closed'],   // 'created' = un-reserve
  issued:              ['production_started', 'closed'],
  production_started:  ['in_progress', 'closed'],
  in_progress:         ['inspection', 'closed'],
  inspection:          ['completed', 'in_progress'],      // can loop back if failed
  completed:           ['closed'],
  closed:              [],                                 // terminal
})

/**
 * Returns true if the transition from → to is valid.
 */
export function isValidTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Human-readable label for each status.
 */
export const STATUS_LABELS = Object.freeze({
  created:             'Created',
  reserved:            'Reserved',
  issued:              'Issued',
  production_started:  'Production Started',
  in_progress:         'In Progress',
  inspection:          'Inspection',
  completed:           'Completed',
  closed:              'Closed',
})
