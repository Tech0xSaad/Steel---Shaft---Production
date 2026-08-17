import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

const sizeMap = {
  sm:   'max-w-md',
  md:   'max-w-xl',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full mx-4',
}

/**
 * Accessible modal dialog rendered via React Portal.
 *
 * @param {boolean}    open      - controls visibility
 * @param {()=>void}   onClose   - called on backdrop click or × press
 * @param {string}     title
 * @param {'sm'|'md'|'lg'|'xl'|'full'} size
 * @param {boolean}    closable  - show × button (default true)
 */
export function Modal({ open, onClose, title, size = 'md', closable = true, children, className }) {
  const dialogRef = useRef(null)

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      dialogRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape' && closable) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, closable, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]',
          'outline-none',
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 shrink-0">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-surface-900">
                {title}
              </h2>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="ml-auto rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ModalBody({ children, className }) {
  return (
    <div className={clsx('px-6 py-5', className)}>{children}</div>
  )
}

export function ModalFooter({ children, className }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-surface-100 flex items-center justify-end gap-3 shrink-0', className)}>
      {children}
    </div>
  )
}
