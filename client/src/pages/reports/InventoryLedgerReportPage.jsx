import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { MovementTypeBadge } from '@/components/inventory/MovementTypeBadge'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }

export function InventoryLedgerReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 25 })

  useEffect(() => {
    setLoading(true)
    reportsService.getInventoryLedgerReport(filters)
      .then(r => { setData(r.data ?? []); setMeta(r.meta); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const filterFields = [
    { key: 'transaction_type', label: 'Type', type: 'select', options: [
      { value: 'receive',        label: 'Receive' },
      { value: 'issue',          label: 'Issue' },
      { value: 'return',         label: 'Return' },
      { value: 'adjustment_in',  label: 'Adj In' },
      { value: 'adjustment_out', label: 'Adj Out' },
      { value: 'transfer_in',    label: 'Transfer In' },
      { value: 'transfer_out',   label: 'Transfer Out' },
      { value: 'wip_in',         label: 'WIP In' },
      { value: 'wip_out',        label: 'WIP Out' },
      { value: 'scrap',          label: 'Scrap' },
    ]},
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date',   label: 'To Date',   type: 'date' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Ledger"
        subtitle="Complete raw material transaction history — every receive, issue, return and adjustment."
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
        <p className="py-12 text-center text-sm text-surface-400">No transactions match the filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  {['Date','Material','Type','Qty','UOM','Balance Before','Balance After','Warehouse','Batch','Reference','Actor'].map(h => (
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
                    <td className="px-3 py-3 font-medium text-surface-800 max-w-[160px] truncate">{row.raw_material?.name ?? '—'}</td>
                    <td className="px-3 py-3"><MovementTypeBadge type={row.transaction_type} /></td>
                    <td className="px-3 py-3 text-right font-semibold text-surface-800">{fmt(row.quantity)}</td>
                    <td className="px-3 py-3 text-surface-500 uppercase text-xs">{row.uom}</td>
                    <td className="px-3 py-3 text-right text-surface-600">{fmt(row.balance_before)}</td>
                    <td className="px-3 py-3 text-right font-medium text-surface-800">{fmt(row.balance_after)}</td>
                    <td className="px-3 py-3 text-surface-600">{row.warehouse?.name ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-600">{row.batch?.batch_number ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-500">{row.reference_number ?? '—'}</td>
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
