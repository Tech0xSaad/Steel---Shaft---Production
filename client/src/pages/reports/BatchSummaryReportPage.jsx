import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }
function pct(n) { return n != null ? `${Number(n).toFixed(1)}%` : '—' }
function mins(n) { return n != null ? `${Number(n).toFixed(0)} min` : '—' }

function PctCell({ value, greenAbove = 90, redBelow = null }) {
  if (value == null) return <span className="text-surface-400">—</span>
  const v = Number(value)
  let cls = 'text-surface-700'
  if (greenAbove && v >= greenAbove) cls = 'text-green-600 font-semibold'
  else if (redBelow && v <= redBelow) cls = 'text-red-600 font-semibold'
  else cls = 'text-amber-600 font-semibold'
  return <span className={cls}>{pct(value)}</span>
}

export function BatchSummaryReportPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 })

  useEffect(() => {
    setLoading(true)
    reportsService.getBatchSummaryReport(filters)
      .then(r => { setData(r.data ?? []); setMeta(r.meta); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const filterFields = [
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date',   label: 'To Date',   type: 'date' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Summary"
        subtitle="Completed batch KPIs — expected vs actual, yield variance, material utilisation and cycle time."
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
        <p className="py-12 text-center text-sm text-surface-400">No completed batches in the selected range.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  {[
                    'Batch','Product','Planned Qty','Expected Yield',
                    'Produced','Passed QC','Rejected QC','Scrapped','Moved to FG',
                    'Yield %','Rejection %','Scrap %','Mat. Util.',
                    'Planned Time','Actual Time','Time Eff.',
                    'Yield Variance','Completed'
                  ].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.batch_id}
                    onClick={() => navigate(`/dashboard/production/${row.batch_id}`)}
                    className={`border-b border-surface-100 hover:bg-surface-50 cursor-pointer
                      ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                    <td className="px-3 py-3 font-medium text-surface-800 whitespace-nowrap">{row.batch?.batch_number ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-600 max-w-[160px] truncate">{row.batch?.product?.name ?? '—'}</td>
                    <td className="px-3 py-3 text-right text-surface-700">{fmt(row.planned_qty)}</td>
                    <td className="px-3 py-3 text-right text-surface-700">{fmt(row.expected_yield_qty)}</td>
                    <td className="px-3 py-3 text-right text-surface-700">{fmt(row.qty_produced)}</td>
                    <td className="px-3 py-3 text-right text-green-700 font-medium">{fmt(row.qty_passed_qc)}</td>
                    <td className="px-3 py-3 text-right text-red-700">{fmt(row.qty_rejected_qc)}</td>
                    <td className="px-3 py-3 text-right text-rose-600">{fmt(row.qty_scrapped)}</td>
                    <td className="px-3 py-3 text-right text-indigo-700">{fmt(row.qty_moved_to_fg)}</td>
                    <td className="px-3 py-3 text-right"><PctCell value={row.yield_pct} greenAbove={90} /></td>
                    <td className="px-3 py-3 text-right">
                      <PctCell value={row.rejection_pct} greenAbove={null} redBelow={null} />
                    </td>
                    <td className="px-3 py-3 text-right"><PctCell value={row.scrap_pct} greenAbove={null} redBelow={null} /></td>
                    <td className="px-3 py-3 text-right"><PctCell value={row.material_utilization_pct} greenAbove={90} /></td>
                    <td className="px-3 py-3 text-right text-surface-500">{mins(row.planned_cycle_time_min)}</td>
                    <td className="px-3 py-3 text-right text-surface-500">{mins(row.actual_cycle_time_min)}</td>
                    <td className="px-3 py-3 text-right"><PctCell value={row.time_efficiency_pct} greenAbove={90} /></td>
                    <td className="px-3 py-3 text-right">
                      {row.yield_variance_pct != null ? (
                        <span className={Number(row.yield_variance_pct) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {Number(row.yield_variance_pct) >= 0 ? '+' : ''}{pct(row.yield_variance_pct)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-surface-500 whitespace-nowrap">
                      {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}
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
