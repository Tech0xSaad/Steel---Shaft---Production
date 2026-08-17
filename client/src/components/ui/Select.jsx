import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

/**
 * Native select with consistent styling.
 *
 * @param {string}  label
 * @param {string}  error
 * @param {string}  hint
 * @param {boolean} required
 * @param {{ value: string|number, label: string }[]} options
 * @param {string}  placeholder - empty/first option text
 */
export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className, id, required, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-surface-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            'w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-9 text-sm text-surface-900',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus-visible:ring-red-400'
              : 'border-surface-300 hover:border-surface-400',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-surface-500">{hint}</p>
      )}
    </div>
  )
})
