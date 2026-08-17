import { clsx } from 'clsx'

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
  xl: 'h-16 w-16 border-4',
}

/**
 * Circular loading spinner.
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {string} className - additional Tailwind classes
 */
export function Spinner({ size = 'md', className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        'inline-block rounded-full border-primary-200 border-t-primary-600 animate-spin',
        sizeMap[size],
        className
      )}
    />
  )
}
