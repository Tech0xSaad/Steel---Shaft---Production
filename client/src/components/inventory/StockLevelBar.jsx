import { clsx } from 'clsx'

/**
 * Horizontal bar visualising stock health:
 *   ██████░░░░  available  |  ▓▓▓  reserved  |  ░░░  WIP
 *
 * @param {number} available
 * @param {number} reserved
 * @param {number} wip
 * @param {number} minStock     - threshold line
 */
export function StockLevelBar({ available = 0, reserved = 0, wip = 0, minStock = 0, className }) {
  const total = available + reserved + wip
  if (total <= 0) {
    return (
      <div className={clsx('h-2 w-full rounded-full bg-surface-100', className)} />
    )
  }

  const availPct    = Math.round((available / total) * 100)
  const reservedPct = Math.round((reserved  / total) * 100)
  const wipPct      = Math.min(100 - availPct - reservedPct, Math.round((wip / total) * 100))

  // Is total stock near or below minimum?
  const isLow = available <= minStock

  return (
    <div className={clsx('flex h-2 w-full rounded-full overflow-hidden bg-surface-100', className)}>
      <div
        className={clsx('h-full transition-all', isLow ? 'bg-red-400' : 'bg-green-400')}
        style={{ width: `${availPct}%` }}
        title={`Available: ${available}`}
      />
      <div
        className="h-full bg-sky-400 transition-all"
        style={{ width: `${reservedPct}%` }}
        title={`Reserved: ${reserved}`}
      />
      <div
        className="h-full bg-amber-400 transition-all"
        style={{ width: `${wipPct}%` }}
        title={`WIP: ${wip}`}
      />
    </div>
  )
}
