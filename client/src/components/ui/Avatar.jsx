import { clsx } from 'clsx'

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

/**
 * User avatar — shows image if src provided, otherwise initials.
 */
export function Avatar({ src, name, size = 'md', className }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        className={clsx('rounded-full object-cover shrink-0', sizeMap[size], className)}
      />
    )
  }

  return (
    <span
      aria-label={name ?? 'User'}
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-primary-600 text-white font-semibold shrink-0',
        sizeMap[size],
        className
      )}
    >
      {initials}
    </span>
  )
}
