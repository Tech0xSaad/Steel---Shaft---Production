import { clsx } from 'clsx'
import { TXN_LABELS, TXN_VARIANTS, TXN_DIRECTION } from '@/constants/inventoryTypes'

const variantMap = {
  success:  'bg-green-100  text-green-700',
  primary:  'bg-primary-100 text-primary-700',
  info:     'bg-sky-100    text-sky-700',
  warning:  'bg-amber-100  text-amber-700',
  danger:   'bg-red-100    text-red-700',
  default:  'bg-surface-100 text-surface-700',
}

/**
 * Coloured pill showing the inventory transaction type.
 * @param {string} type  - one of the TXN_TYPE values
 * @param {'sm'|'md'}  size
 * @param {boolean}    showDirection - prefix with +/−/→
 */
export function MovementTypeBadge({ type, size = 'md', showDirection = false, className }) {
  const label   = TXN_LABELS[type]   ?? type
  const variant = TXN_VARIANTS[type] ?? 'default'
  const dir     = TXN_DIRECTION[type] ?? ''

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        variantMap[variant],
        className
      )}
    >
      {showDirection && <span className="font-bold">{dir}</span>}
      {label}
    </span>
  )
}
