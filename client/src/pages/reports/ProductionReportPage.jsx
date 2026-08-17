import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'
import { BatchStatusBadge } from '@/components/production/BatchStatusBadge'

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}
function pct(n) {
  if (n == null) return '—'
  return `${Number(n).toFixed(1)}%`
}

export function ProductionReportPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 })

  useEffect(() => {
    setLoading(true)
    reportsService.getProductionReport(filters)
      .then(r => { setData(r.data ?? []); setMeta(r.meta); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const filterFields = [
    { key: 'search', label: 'Batch #', type: 'text', placeholder: 'PB-2024-0001' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'created', label: 'Created' },
      { value: 'reserved', label: 'Reserved' },
      { value: 'issued', label: 'Issued' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'inspection', label: 'Inspection' },
      { value: 'completed', label: 'Completed' },
    ]},
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date', label: 'To Date', type: 'date' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Report"
        subtitle="All production batches with planned vs actual, cycle time, yield & efficiency."
      />

      <ReportFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ page: 1, pageSize: 20 })}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-sm text-surface-400">No batches match the filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">Batch</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-surface-600 whitespace-nowrap">Planned Qty</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-surface-600 whitespace-nowrap">Produced</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-surface-600 whitespace-nowrap">Passed QC</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-surface-600 whitespace-nowrap">Rejected QC</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-surface-600 whitespace-nowrap">Yield %</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-surface-600 whitespace-nowrap">Rejection %</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">Completed</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const comp = row.completion?.[0] ?? {}
                  return (
                    <tr key={row.id}
                      onClick={() => navigate(`/dashboard/production/${row.id}`)}
                      className={`border-b border-surface-100 hover:bg-surface-50 cursor-pointer
                        ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                      <td className="px-3 py-3 font-medium text-surface-800 whitespace-nowrap">{row.batch_number}</td>
                      <td className="px-3 py-3 text-surface-600 truncate max-w-[200px]">{row.product?.name ?? '—'}</td>
                      <td className="px-3 py-3"><BatchStatusBadge status={row.status} /></td>
                      <td className="px-3 py-3 text-right text-surface-700">{fmt(row.planned_qty)}</td>
                      <td className="px-3 py-3 text-right text-surface-700">{fmt(comp.qty_produced)}</td>
                      <td className="px-3 py-3 text-right text-surface-700">{fmt(comp.qty_passed_qc)}</td>
                      <td className="px-3 py-3 text-right text-surface-700">{fmt(comp.qty_rejected_qc)}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={Number(comp.yield_pct ?? 0) >= 90 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                          {pct(comp.yield_pct)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={Number(comp.rejection_pct ?? 0) > 5 ? 'text-red-600 font-semibold' : 'text-surface-700'}>
                          {pct(comp.rejection_pct)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-surface-500 whitespace-nowrap">
                        {comp.completed_at ? new Date(comp.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={p => setFilters({ ...filters, page: p })} />}
        </>
      )}
    </div>
  )
}
