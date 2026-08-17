import { clsx } from 'clsx'

/**
 * Simple badge that communicates raw stock health at a glance.
 *
 * @param {number}  available   - available qty
 * @param {number}  minStock    - minimum threshold
 * @param {number}  reorderQty  - reorder threshold
 */
export function StockBadge({ available, minStock = 0, reorderQty = 0, className }) {
  const qty = Number(available ?? 0)
  const min = Number(minStock  ?? 0)
  const ror = Number(reorderQty ?? 0)

  let variant, label
  if (qty <= min) {
    variant = 'bg-red-100 text-red-700'
    label   = 'Below Min'
  } else if (qty <= ror) {
    variant = 'bg-amber-100 text-amber-700'
    label   = 'Reorder'
  } else {
    variant = 'bg-green-100 text-green-700'
    label   = 'OK'
  }

  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      variant, className
    )}>
      {label}
    </span>
  )
}
