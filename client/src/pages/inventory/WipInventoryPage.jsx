import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams }      from 'react-router-dom'
import toast                                 from 'react-hot-toast'
import { RefreshCw, ExternalLink }           from 'lucide-react'

import { inventoryService }  from '@/services/inventoryService'
import { PageHeader }        from '@/components/common/PageHeader'
import { DataTable }         from '@/components/common/DataTable'
import { Pagination }        from '@/components/common/Pagination'
import { Button }            from '@/components/ui/Button'
import { Select }            from '@/components/ui/Select'
import { Badge }             from '@/components/ui/Badge'
import { BatchStatusBadge }  from '@/components/production/BatchStatusBadge'

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n, d = 3) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d })
}

const CLOSED_FILTER = [
  { value: '',      label: 'All WIP'        },
  { value: 'false', label: 'Open (Active)'  },
  { value: 'true',  label: 'Closed'         },
]

// ─── Columns ─────────────────────────────────────────────────
const buildColumns = (onViewBatch) => [
  {
    key: 'batch',
    header: 'Batch',
    render: (v, row) => v
      ? (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-surface-900">{v.batch_number}</span>
          <BatchStatusBadge status={v.status} size="sm" />
        </div>
      ) : '—',
  },
  {
    key: 'raw_material',
    header: 'Material',
    render: (v) => v
      ? <span className="font-medium text-surface-900">{v.code} — {v.name}</span>
      : '—',
  },
  {
    key: 'qty_issued',
    header: 'Issued',
    headerClassName: 'w-24',
    render: (v, row) => (
      <span className="tabular-nums text-primary-700 font-medium">
        {fmt(v)} {row.raw_material?.uom}
      </span>
    ),
  },
  {
    key: 'qty_consumed',
    header: 'Consumed',
    headerClassName: 'w-24',
    render: (v, row) => (
      <span className="tabular-nums text-surface-700">{fmt(v)} {row.raw_material?.uom}</span>
    ),
  },
  {
    key: 'qty_returned',
    header: 'Returned',
    headerClassName: 'w-24',
    render: (v, row) => (
      <span className="tabular-nums text-green-700">{fmt(v)} {row.raw_material?.uom}</span>
    ),
  },
  {
    key: 'qty_scrapped',
    header: 'Scrapped',
    headerClassName: 'w-24',
    render: (v, row) => (
      <span className={`tabular-nums ${Number(v) > 0 ? 'text-red-600 font-medium' : 'text-surface-400'}`}>
        {fmt(v)} {row.raw_material?.uom}
      </span>
    ),
  },
  {
    key: '_balance',
    header: 'On Floor',
    headerClassName: 'w-24',
    render: (_, row) => {
      const onFloor = Number(row.qty_issued ?? 0)
        - Number(row.qty_consumed ?? 0)
        - Number(row.qty_returned ?? 0)
        - Number(row.qty_scrapped ?? 0)
      return (
        <span className={`tabular-nums font-semibold ${onFloor > 0 ? 'text-amber-700' : 'text-surface-400'}`}>
          {fmt(Math.max(0, onFloor))} {row.raw_material?.uom}
        </span>
      )
    },
  },
  {
    key: 'is_closed',
    header: 'WIP Status',
    headerClassName: 'w-24',
    render: v => (
      <Badge variant={v ? 'default' : 'warning'}>
        {v ? 'Closed' : 'Open'}
      </Badge>
    ),
  },
  {
    key: '_link',
    header: '',
    headerClassName: 'w-10',
    render: (_, row) => row.batch?.id
      ? (
        <button
          onClick={e => { e.stopPropagation(); onViewBatch(row.batch.id) }}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors"
          aria-label="View batch"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      ) : null,
  },
]

// ─── Page ─────────────────────────────────────────────────────
export function WipInventoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [rows,    setRows]    = useState([])
  const [meta,    setMeta]    = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [isClosed, setIsClosed] = useState(searchParams.get('is_closed') ?? 'false')
  const [page,    setPage]    = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inventoryService.listWip({
        page, pageSize: 20,
        is_closed: isClosed !== '' ? isClosed : undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load WIP inventory.')
    } finally {
      setLoading(false)
    }
  }, [page, isClosed])

  useEffect(() => { setPage(1) }, [isClosed])
  useEffect(() => { load() }, [load])

  // Aggregate totals for visible rows
  const totalOnFloor = rows.reduce((s, r) => {
    const v = Number(r.qty_issued ?? 0) - Number(r.qty_consumed ?? 0)
      - Number(r.qty_returned ?? 0) - Number(r.qty_scrapped ?? 0)
    return s + Math.max(0, v)
  }, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Work In Progress"
        description="Raw material quantities currently on the shop floor, broken down by production batch."
        actions={
          <Button variant="secondary" size="sm" onClick={load}
            leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="WIP Lines"     value={meta.total ?? 0} />
        <KpiCard label="Total on Floor" value={fmt(totalOnFloor)} />
        <KpiCard label="Showing"        value={isClosed === 'false' ? 'Open only' : isClosed === 'true' ? 'Closed only' : 'All'} />
      </div>

      {/* Column legend */}
      <p className="text-xs text-surface-400">
        <b>On Floor</b> = Issued − Consumed − Returned − Scrapped
      </p>

      {/* Filter */}
      <div className="flex gap-3">
        <Select
          value={isClosed}
          onChange={e => setIsClosed(e.target.value)}
          options={CLOSED_FILTER}
          className="w-44"
          aria-label="Filter by WIP status"
        />
      </div>

      <DataTable
        columns={buildColumns(id => navigate(`/dashboard/production/${id}`))}
        data={rows}
        loading={loading}
        emptyMessage="No WIP inventory lines found. Issue materials to a production batch to see them here."
      />

      <Pagination
        page={meta.page ?? 1}
        totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 20}
        onPageChange={setPage}
      />
    </div>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-4 py-3">
      <p className="text-xs text-surface-500">{label}</p>
      <p className="text-lg font-bold text-surface-900 mt-0.5">{value}</p>
    </div>
  )
}
