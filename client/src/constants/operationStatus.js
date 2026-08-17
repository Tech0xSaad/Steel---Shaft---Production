/**
 * Client-side mirror of server/src/constants/operationStatus.js
 */

export const OP_STATUS = Object.freeze({
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  ON_HOLD:     'on_hold',
  COMPLETED:   'completed',
  REJECTED:    'rejected',
  SKIPPED:     'skipped',
})

export const OP_STATUS_LABELS = Object.freeze({
  pending:     'Pending',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
  rejected:    'Rejected',
  skipped:     'Skipped',
})

/** Badge colour variant for each status */
export const OP_STATUS_VARIANTS = Object.freeze({
  pending:     'default',
  in_progress: 'warning',
  on_hold:     'info',
  completed:   'success',
  rejected:    'danger',
  skipped:     'default',
})

/**
 * Which transitions are available from each status — drives action buttons.
 * label = button text, variant = button colour
 */
export const OP_AVAILABLE_TRANSITIONS = Object.freeze({
  pending:     [
    { to: 'in_progress', label: 'Start Operation', variant: 'primary' },
    { to: 'skipped',     label: 'Skip',            variant: 'secondary' },
  ],
  in_progress: [
    { to: 'on_hold',   label: 'Put On Hold', variant: 'secondary' },
    { to: 'completed', label: 'Complete',    variant: 'primary'   },
    { to: 'rejected',  label: 'Mark Rejected', variant: 'danger'  },
  ],
  on_hold:     [
    { to: 'in_progress', label: 'Resume',       variant: 'primary'   },
    { to: 'rejected',    label: 'Mark Rejected', variant: 'danger'   },
    { to: 'skipped',     label: 'Skip',          variant: 'secondary' },
  ],
  completed:   [],
  rejected:    [
    { to: 'in_progress', label: 'Restart', variant: 'secondary' },
  ],
  skipped:     [],
})

export const OP_STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses'  },
  { value: 'pending',     label: 'Pending'       },
  { value: 'in_progress', label: 'In Progress'   },
  { value: 'on_hold',     label: 'On Hold'       },
  { value: 'completed',   label: 'Completed'     },
  { value: 'rejected',    label: 'Rejected'      },
  { value: 'skipped',     label: 'Skipped'       },
]

export const SHIFT_OPTIONS = [
  { value: '',        label: 'No shift'  },
  { value: 'Morning', label: 'Morning'   },
  { value: 'Day',     label: 'Day'       },
  { value: 'Evening', label: 'Evening'   },
  { value: 'Night',   label: 'Night'     },
]
