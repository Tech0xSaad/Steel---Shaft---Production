/**
 * Client-side mirror of the server batch status constants.
 * Keep in sync with server/src/constants/batchStatus.js
 */

export const BATCH_STATUS = Object.freeze({
  CREATED:            'created',
  RESERVED:           'reserved',
  ISSUED:             'issued',
  PRODUCTION_STARTED: 'production_started',
  IN_PROGRESS:        'in_progress',
  INSPECTION:         'inspection',
  COMPLETED:          'completed',
  CLOSED:             'closed',
})

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

/** Badge variant for each status (maps to the Badge component variants) */
export const STATUS_VARIANTS = Object.freeze({
  created:             'default',
  reserved:            'info',
  issued:              'primary',
  production_started:  'warning',
  in_progress:         'warning',
  inspection:          'warning',
  completed:           'success',
  closed:              'default',
})

/**
 * Which transitions are available from each status — used to
 * render the action buttons on the detail page.
 * Label is the button text shown to the user.
 */
export const AVAILABLE_TRANSITIONS = Object.freeze({
  created:            [
    { to: 'reserved', label: 'Reserve Materials',  variant: 'primary' },
    { to: 'closed',   label: 'Cancel Batch',       variant: 'danger'  },
  ],
  reserved:           [
    { to: 'issued',   label: 'Issue to Shop Floor', variant: 'primary' },
    { to: 'created',  label: 'Release Reservation', variant: 'secondary' },
    { to: 'closed',   label: 'Cancel Batch',        variant: 'danger'  },
  ],
  issued:             [
    { to: 'production_started', label: 'Start Production', variant: 'primary' },
    { to: 'closed',             label: 'Cancel Batch',     variant: 'danger'  },
  ],
  production_started: [
    { to: 'in_progress', label: 'Mark In Progress', variant: 'primary' },
    { to: 'closed',      label: 'Close Batch',      variant: 'danger'  },
  ],
  in_progress:        [
    { to: 'inspection', label: 'Send to Inspection', variant: 'primary' },
    { to: 'closed',     label: 'Close Batch',        variant: 'danger'  },
  ],
  inspection:         [
    { to: 'completed',   label: 'Mark Completed',   variant: 'primary'   },
    { to: 'in_progress', label: 'Return to Production', variant: 'secondary' },
  ],
  completed:          [
    { to: 'closed', label: 'Close Batch', variant: 'primary' },
  ],
  closed:             [],
})

/** Ordered list of statuses for the timeline display */
export const STATUS_TIMELINE_ORDER = [
  'created',
  'reserved',
  'issued',
  'production_started',
  'in_progress',
  'inspection',
  'completed',
  'closed',
]
