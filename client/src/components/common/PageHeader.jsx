import { clsx } from 'clsx'

/**
 * Consistent page-level heading used at the top of every dashboard page.
 *
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} actions - buttons/controls on the right side
 */
export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-xl font-bold text-surface-900">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-surface-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
