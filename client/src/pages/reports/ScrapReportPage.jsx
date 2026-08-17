import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { ScrapCategoryBadge } from '@/components/quality/ScrapCategoryBadge'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }
function money(n) { return n != null ? `₹${Number(n).toLocaleString()}` : '—' }

export function ScrapReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 25 })

  useEffect(() => {
    setLoading(true)
    const { from_date, to_date } = filters
    Promise.all([
      reportsService.getScrapReport(filters),
      reportsService.getScrapSummary({ from_date, to_date }),
    ])
      .then(([report, sum]) => {
        setData(report.data ?? [])
        setMeta(report.meta)
        setSummary(sum)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters])

  const filterFields = [
    { key: 'scrap_category', label: 'Category', type: 'select', options: [
      'dimensional','surface','hardness','crack','material','machining','heat_treatment','other'
    ].map(v => ({ value: v, label: v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) })) },
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date',   label: 'To Date',   type: 'date' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scrap Report"
        subtitle="Scrap records by category, machine, department and cost."
      />

      <ReportFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ page: 1, pageSize: 25 })}
      />

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Records',    value: fmt(summary.total_records) },
            { label: 'Total Qty Scrapped', value: fmt(summary.total_qty_scrapped) },
            { label: 'Total Scrap Cost', value: money(summary.total_scrap_cost) },
          ].map(s => (
            <div key={s.label}
              className="rounded-xl border border-surface-200 bg-white px-4 py-3">
              <p className="text-xs text-surface-500">{s.label}</p>
              <p className="text-xl font-bold text-surface-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-sm text-surface-400">No scrap records match the filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  {['Date','Batch','Product','Category','Qty','Weight (kg)','Machine','Department','Operator','Unit Cost','Total Cost','Disposal'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-surface-100 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                    <td className="px-3 py-3 text-surface-500 whitespace-nowrap">
                      {row.scrap_date ? new Date(row.scrap_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-3 font-medium text-surface-800 whitespace-nowrap">{row.batch?.batch_number ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-600 max-w-[160px] truncate">{row.batch?.product?.name ?? '—'}</td>
                    <td className="px-3 py-3"><ScrapCategoryBadge category={row.scrap_category} /></td>
                    <td className="px-3 py-3 text-right font-semibold text-rose-700">{fmt(row.qty_scrapped)}</td>
                    <td className="px-3 py-3 text-right text-surface-700">{fmt(row.weight_kg)}</td>
                    <td className="px-3 py-3 text-surface-600">{row.machine?.name ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-600">{row.department ?? '—'}</td>
                    <td className="px-3 py-3 text-surface-600">{row.operator_name ?? '—'}</td>
                    <td className="px-3 py-3 text-right text-surface-700">{money(row.unit_cost)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-rose-600">{money(row.total_scrap_cost)}</td>
                    <td className="px-3 py-3 text-surface-500">{row.disposal_method ?? '—'}</td>
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
