import { clsx } from 'clsx'

const variants = {
  default: 'bg-surface-100 text-surface-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-sky-100 text-sky-700',
}

/**
 * Small status badge / pill.
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} variant
 */
export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
