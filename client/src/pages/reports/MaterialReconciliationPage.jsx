import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { reportsService } from '@/services/reportsService'
import { ReportFilters } from './_shared/ReportFilters'

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }

export function MaterialReconciliationPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ page: 1, pageSize: 25 })

  useEffect(() => {
    setLoading(true)
    reportsService.getMaterialReconciliationReport(filters)
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
        title="Material Reconciliation"
        subtitle="Period-based material movements — received, issued, returned, adjusted, scrapped and net balance."
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
        <p className="py-12 text-center text-sm text-surface-400">No transactions in the selected range.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr className="border-b border-surface-200">
                  {['Code','Name','UOM','Received','Issued','Returned','Adj In','Adj Out','Scrapped','Net Movement','Closing Stock'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-surface-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.raw_material_id}
                    className={`border-b border-surface-100 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                    <td className="px-3 py-3 font-mono text-xs text-surface-700">{row.material_code}</td>
                    <td className="px-3 py-3 font-medium text-surface-800 max-w-[180px] truncate">{row.material_name}</td>
                    <td className="px-3 py-3 text-surface-500 uppercase text-xs">{row.uom}</td>
                    <td className="px-3 py-3 text-right text-green-700 font-medium">{fmt(row.total_received)}</td>
                    <td className="px-3 py-3 text-right text-red-700">{fmt(row.total_issued)}</td>
                    <td className="px-3 py-3 text-right text-blue-700">{fmt(row.total_returned)}</td>
                    <td className="px-3 py-3 text-right text-teal-700">{fmt(row.total_adjusted_in)}</td>
                    <td className="px-3 py-3 text-right text-rose-700">{fmt(row.total_adjusted_out)}</td>
                    <td className="px-3 py-3 text-right text-rose-600">{fmt(row.total_scrapped)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={Number(row.net_movement ?? 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {Number(row.net_movement ?? 0) >= 0 ? '+' : ''}{fmt(row.net_movement)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-surface-800">{fmt(row.current_stock)}</td>
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
