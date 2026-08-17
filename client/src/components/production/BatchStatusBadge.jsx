import { clsx } from 'clsx'
import { STATUS_LABELS, STATUS_VARIANTS } from '@/constants/batchStatus'

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

const variantMap = {
  default:  'bg-surface-100  text-surface-700',
  info:     'bg-sky-100      text-sky-700',
  primary:  'bg-primary-100  text-primary-700',
  warning:  'bg-amber-100    text-amber-700',
  success:  'bg-green-100    text-green-700',
  danger:   'bg-red-100      text-red-700',
}

/**
 * Coloured pill badge for batch lifecycle status.
 *
 * @param {string}          status - one of the 8 batch_status enum values
 * @param {'sm'|'md'|'lg'}  size
 */
export function BatchStatusBadge({ status, size = 'md', className }) {
  const label   = STATUS_LABELS[status]   ?? status
  const variant = STATUS_VARIANTS[status] ?? 'default'

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        variantMap[variant],
        sizeMap[size],
        className
      )}
    >
      {label}
    </span>
  )
}
