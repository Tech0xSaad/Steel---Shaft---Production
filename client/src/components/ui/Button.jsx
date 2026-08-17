import { clsx } from 'clsx'
import { Spinner } from './Spinner'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg ' +
  'transition-colors duration-150 focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-surface-100 text-surface-800 hover:bg-surface-200 active:bg-surface-300 border border-surface-300',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost:     'bg-transparent text-surface-700 hover:bg-surface-100 active:bg-surface-200',
  link:      'bg-transparent text-primary-600 hover:underline p-0 h-auto',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  xl: 'h-12 px-8 text-base',
}

/**
 * Reusable button component.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'|'link'} variant
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} loading - shows a spinner and disables the button
 * @param {boolean} fullWidth
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
