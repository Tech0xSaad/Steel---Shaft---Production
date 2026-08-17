import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { FgMovementBadge } from '@/components/quality/FgMovementBadge'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }
function money(n) { return n != null ? `₹${Number(n).toLocaleString()}` : '—' }

export function FinishedGoodsReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 25 })

  useEffect(() => {
    setLoading(true)
    reportsService.getFinishedGoodsReport(filters)
      .then(r => { setData(r.data ?? []); setMeta(r.meta); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const filterFields = [
    { key: 'movement_type', label: 'Movement Type', type: 'select', options: [
      { value: 'production_receipt', label: 'Production Receipt' },
      { value: 'adjustment_in',      label: 'Adjustment In' },
      { value: 'adjustment_out',     label: 'Adjustment Out' },
      { value: 'dispatch',           label: 'Dispatch' },
      { value: 'return',             label: 'Return' },
      { value: 'transfer',           label: 'Transfer' },
    ]},
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date',   label: 'To Date',   type: 'date' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finished Goods Report"
        subtitle="Finished goods transaction ledger — production receipts, dispatches and adjustments."
      />

      <ReportFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ page: 1, pageSize: 25 })}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-sm text-surface-400">No finished goods transactions match the filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  {['Date','Product','Movement Type','Qty','UOM','Bal Before','Bal After','Warehouse','Batch','Unit Cost','Total Cost','Actor'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-surface-100 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                    <td className="px-3 py-3 text-surface-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-medium text-surface-800 max-w-[160px] truncate">{row.product?.name ?? '—'}</td>
                    <td className="px-3 py-3"><FgMovementBadge type={row.movement_type} /></td>
                    <td className="px-3 py-3 text-right font-semibold text-surface-800">{fmt(row.quantity)}</td>
                    <td className="px-3 py-3 text-surface-500 uppercase text-xs">{row.uom}</td>
                    <td className="px-3 py-3 text-right text-surface-600">{fmt(row.balance_before)}</td>
                    <td className="px-3 py-3 text-right font-medium text-surface-800">{fmt(row.balance_after)}</td>
                    <td className="px-3 py-3 text-surface-600">{row.warehouse?.name ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-600">{row.batch?.batch_number ?? '—'}</td>
                    <td className="px-3 py-3 text-right text-surface-600">{money(row.unit_cost)}</td>
                    <td className="px-3 py-3 text-right font-medium text-indigo-700">{money(row.total_cost)}</td>
                    <td className="px-3 py-3 text-surface-400 text-xs">{row.actor_email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={p => setFilters({ ...filters, page: p })} />}
        </>
      )}
    </div>
  )
}
