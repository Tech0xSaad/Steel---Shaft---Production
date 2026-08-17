import { clsx } from 'clsx'

/**
 * Base card container.
 *
 * @param {boolean} padded  - applies default padding (default true)
 * @param {boolean} bordered - adds a subtle border
 */
export function Card({ children, padded = true, bordered = true, className, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-card',
        padded  && 'p-6',
        bordered && 'border border-surface-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={clsx('text-base font-semibold text-surface-900', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx('text-sm text-surface-600', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'mt-4 pt-4 border-t border-surface-100 flex items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
