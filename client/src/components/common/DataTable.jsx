import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Reusable data table.
 *
 * @param {Array<{ key, header, render?, className?, headerClassName? }>} columns
 * @param {Array<object>} data
 * @param {boolean}       loading
 * @param {string}        emptyMessage
 * @param {Function}      onRowClick   - optional (row) => void
 * @param {string}        rowKey       - field used as React key (default 'id')
 */
export function DataTable({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  rowKey = 'id',
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-200">
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr className="bg-surface-50 border-b border-surface-200">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide whitespace-nowrap',
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-surface-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="lg" />
                  <span className="text-sm text-surface-400">Loading…</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-sm text-surface-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  'transition-colors hover:bg-surface-50',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx('px-4 py-3 text-surface-700', col.className)}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
