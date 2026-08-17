import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Search input with clear button.
 *
 * @param {string}    value
 * @param {Function}  onChange  - (value: string) => void
 * @param {string}    placeholder
 * @param {string}    className
 */
export function SearchBar({ value, onChange, placeholder = 'Search…', className }) {
  const inputRef = useRef(null)

  return (
    <div className={clsx('relative flex items-center', className)}>
      <Search
        className="absolute left-3 h-4 w-4 text-surface-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg border border-surface-300 bg-white py-2 pl-9 pr-9 text-sm',
          'placeholder:text-surface-400 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
          'hover:border-surface-400'
        )}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-3 text-surface-400 hover:text-surface-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
