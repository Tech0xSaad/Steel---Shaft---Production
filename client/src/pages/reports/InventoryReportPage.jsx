import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { StockBadge } from '@/components/inventory/StockBadge'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }
function money(n) { return n != null ? `₹${Number(n).toLocaleString()}` : '—' }

export function InventoryReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 25 })

  useEffect(() => {
    setLoading(true)
    reportsService.getInventoryReport(filters)
      .then(r => { setData(r.data ?? []); setMeta(r.meta); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const filterFields = [
    { key: 'category',   label: 'Category',  type: 'text',   placeholder: 'Steel Bar…' },
    { key: 'status',     label: 'Status',    type: 'select', options: [
      { value: 'active',   label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]},
    { key: 'low_stock',  label: 'Low Stock', type: 'select', options: [
      { value: 'true', label: 'Show Only' },
    ]},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Report"
        subtitle="Raw material stock levels, reserved, WIP, available quantities and stock values."
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
        <p className="py-12 text-center text-sm text-surface-400">No materials match the filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  {['Code', 'Name', 'Category', 'UOM', 'Physical Stock', 'Reserved', 'WIP', 'Available', 'Stock Value', 'Unit Cost', 'Status', 'Alert'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-surface-100 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                    <td className="px-3 py-3 font-mono text-xs text-surface-700">{row.code}</td>
                    <td className="px-3 py-3 font-medium text-surface-800 max-w-[180px] truncate">{row.name}</td>
                    <td className="px-3 py-3 text-surface-600">{row.category ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-500 uppercase text-xs">{row.uom}</td>
                    <td className="px-3 py-3 text-right font-medium text-surface-800">{fmt(row.current_stock_qty)}</td>
                    <td className="px-3 py-3 text-right text-blue-700">{fmt(row.reserved_qty)}</td>
                    <td className="px-3 py-3 text-right text-orange-700">{fmt(row.wip_qty)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-green-700">{fmt(row.available_qty)}</td>
                    <td className="px-3 py-3 text-right text-surface-700">{money(row.stock_value)}</td>
                    <td className="px-3 py-3 text-right text-surface-500">{money(row.unit_cost)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium
                        ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StockBadge
                        currentQty={row.current_stock_qty}
                        minQty={row.min_stock_qty}
                        reorderQty={row.reorder_qty}
                      />
                    </td>
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
