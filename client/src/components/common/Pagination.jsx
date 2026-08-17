import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Pagination control bar.
 *
 * @param {number}    page          - current page (1-indexed)
 * @param {number}    totalPages
 * @param {number}    total         - total record count
 * @param {number}    pageSize
 * @param {Function}  onPageChange  - (page: number) => void
 */
export function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  // Build page numbers: always show first, last, current ±1, with ellipsis
  function pages() {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1)
    if (totalPages <= 7) return all

    const near = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages))
    const sorted = Array.from(near).sort((a, b) => a - b)

    const result = []
    let prev = 0
    for (const p of sorted) {
      if (p - prev > 1) result.push('…')
      result.push(p)
      prev = p
    }
    return result
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
      <p className="text-sm text-surface-500">
        Showing <span className="font-medium text-surface-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-surface-700">{total}</span> results
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <PageBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageBtn>

        {pages().map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} className="px-2 text-surface-400 select-none">…</span>
            : (
              <PageBtn
                key={p}
                active={p === page}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </PageBtn>
            )
        )}

        <PageBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PageBtn>
      </nav>
    </div>
  )
}

function PageBtn({ children, active, disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        'min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-primary-600 text-white'
          : 'text-surface-600 hover:bg-surface-100'
      )}
      {...props}
    >
      {children}
    </button>
  )
}
