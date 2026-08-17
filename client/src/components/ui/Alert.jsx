import { clsx } from 'clsx'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

const config = {
  info:    { icon: Info,          bg: 'bg-sky-50',   border: 'border-sky-200',  text: 'text-sky-800'  },
  success: { icon: CheckCircle2,  bg: 'bg-green-50', border: 'border-green-200',text: 'text-green-800'},
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200',text: 'text-amber-800'},
  error:   { icon: AlertCircle,   bg: 'bg-red-50',   border: 'border-red-200',  text: 'text-red-800'  },
}

/**
 * Inline alert / feedback banner.
 * @param {'info'|'success'|'warning'|'error'} variant
 * @param {string} title   - optional bold heading
 * @param {()=>void} onClose - if provided renders a dismiss × button
 */
export function Alert({ variant = 'info', title, children, onClose, className, ...props }) {
  const { icon: Icon, bg, border, text } = config[variant]

  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 rounded-lg border p-4 text-sm',
        bg, border, text, className
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
