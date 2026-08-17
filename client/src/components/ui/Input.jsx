import { forwardRef } from 'react'
import { clsx } from 'clsx'

/**
 * Labeled text input with error state.
 *
 * @param {string} label
 * @param {string} error - validation / server error message
 * @param {string} hint  - helper text below the field
 * @param {React.ReactNode} leftIcon  - rendered inside the left of the input
 * @param {React.ReactNode} rightIcon - rendered inside the right of the input
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    className,
    id,
    required,
    ...props
  },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-surface-700"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-surface-400 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-surface-900',
            'placeholder:text-surface-400 transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed',
            leftIcon  && 'pl-9',
            rightIcon && 'pr-9',
            error
              ? 'border-red-400 focus-visible:ring-red-400'
              : 'border-surface-300 hover:border-surface-400',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 text-surface-400">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-surface-500">
          {hint}
        </p>
      )}
    </div>
  )
})
