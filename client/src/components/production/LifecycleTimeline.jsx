import { clsx } from 'clsx'
import { Check, Circle, Clock } from 'lucide-react'
import {
  STATUS_LABELS,
  STATUS_TIMELINE_ORDER,
} from '@/constants/batchStatus'

/**
 * Visual step-by-step lifecycle timeline.
 * Shows all 8 states; highlights completed, current, and future steps.
 *
 * @param {string}  currentStatus  - active batch status
 * @param {Array}   logs           - batch_lifecycle_logs[] sorted asc
 */
export function LifecycleTimeline({ currentStatus, logs = [] }) {
  const currentIdx = STATUS_TIMELINE_ORDER.indexOf(currentStatus)

  // Build a map of status → log entry for timestamp display
  const logMap = {}
  logs.forEach(log => {
    if (!logMap[log.to_status]) logMap[log.to_status] = log
  })

  return (
    <div className="flow-root">
      <ol className="relative">
        {STATUS_TIMELINE_ORDER.map((status, idx) => {
          const isDone    = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture  = idx > currentIdx
          const log       = logMap[status]

          return (
            <li key={status} className={clsx('relative pb-6 pl-8 last:pb-0')}>
              {/* Connector line */}
              {idx < STATUS_TIMELINE_ORDER.length - 1 && (
                <div
                  className={clsx(
                    'absolute left-[11px] top-5 bottom-0 w-0.5',
                    isDone ? 'bg-primary-400' : 'bg-surface-200'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step dot */}
              <div
                className={clsx(
                  'absolute left-0 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white',
                  isDone    && 'bg-primary-500',
                  isCurrent && 'bg-white ring-primary-500 ring-[3px]',
                  isFuture  && 'bg-surface-200'
                )}
                aria-hidden="true"
              >
                {isDone    && <Check  className="h-3 w-3 text-white" strokeWidth={3} />}
                {isCurrent && <Circle className="h-3 w-3 text-primary-500 fill-primary-500" />}
              </div>

              {/* Label */}
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div>
                  <p className={clsx(
                    'text-sm font-medium',
                    isDone    && 'text-surface-600',
                    isCurrent && 'text-surface-900',
                    isFuture  && 'text-surface-400'
                  )}>
                    {STATUS_LABELS[status]}
                  </p>

                  {/* Actor + timestamp */}
                  {log && (
                    <p className="text-xs text-surface-400 mt-0.5">
                      {log.actor_email && <span>{log.actor_email} · </span>}
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </p>
                  )}
                  {log?.notes && (
                    <p className="text-xs text-surface-500 mt-0.5 italic">"{log.notes}"</p>
                  )}
                </div>

                {isFuture && (
                  <Clock className="h-3.5 w-3.5 text-surface-300 shrink-0 mt-0.5" aria-hidden="true" />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
