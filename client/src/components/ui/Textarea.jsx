import { forwardRef } from 'react'
import { clsx } from 'clsx'

/**
 * Labeled textarea with error/hint support — matches Input styling.
 */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, id, required, rows = 3, ...props },
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

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={clsx(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-surface-900 resize-y',
          'placeholder:text-surface-400 transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
          'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 focus-visible:ring-red-400'
            : 'border-surface-300 hover:border-surface-400',
          className
        )}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-surface-500">{hint}</p>
      )}
    </div>
  )
})
