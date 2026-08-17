import { clsx } from 'clsx'
import { OP_STATUS_LABELS, OP_STATUS_VARIANTS } from '@/constants/operationStatus'

const variantMap = {
  default:  'bg-surface-100  text-surface-700',
  warning:  'bg-amber-100    text-amber-700',
  info:     'bg-sky-100      text-sky-700',
  success:  'bg-green-100    text-green-700',
  danger:   'bg-red-100      text-red-700',
  primary:  'bg-primary-100  text-primary-700',
}

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

/**
 * Coloured pill badge for manufacturing operation status.
 * @param {string}          status  - one of the OP_STATUS values
 * @param {'sm'|'md'|'lg'}  size
 */
export function OperationStatusBadge({ status, size = 'md', className }) {
  const label   = OP_STATUS_LABELS[status]   ?? status
  const variant = OP_STATUS_VARIANTS[status] ?? 'default'

  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full whitespace-nowrap',
      variantMap[variant],
      sizeMap[size],
      className
    )}>
      {label}
    </span>
  )
}
