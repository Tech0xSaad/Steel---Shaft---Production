import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams }      from 'react-router-dom'
import toast                                 from 'react-hot-toast'
import {
  RefreshCw, Plus, SlidersHorizontal,
  BookOpen, ArrowDownToLine, Minus,
} from 'lucide-react'

import { inventoryService }   from '@/services/inventoryService'
import { warehousesService }  from '@/services/warehousesService'
import { PageHeader }         from '@/components/common/PageHeader'
import { DataTable }          from '@/components/common/DataTable'
import { SearchBar }          from '@/components/common/SearchBar'
import { Pagination }         from '@/components/common/Pagination'
import { Button }             from '@/components/ui/Button'
import { Select }             from '@/components/ui/Select'
import { StockBadge }         from '@/components/inventory/StockBadge'
import { StockLevelBar }      from '@/components/inventory/StockLevelBar'
import { ReceiveStockModal }  from './modals/ReceiveStockModal'
import { AdjustStockModal }   from './modals/AdjustStockModal'
import { ScrapStockModal }    from './modals/ScrapStockModal'
import { useDebounce }        from '@/hooks/useDebounce'

// ─── helpers ─────────────────────────────────────────────────
function fmt(n, d = 3) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d })
}
function fmtCurr(n) {
  if (n == null) return '—'
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const LOW_STOCK_OPTIONS = [
  { value: '',     label: 'All Materials'   },
  { value: 'true', label: 'Low Stock Only'  },
]

const STATUS_FILTER = [
  { value: '',         label: 'All Statuses' },
  { value: 'active',   label: 'Active'       },
  { value: 'inactive', label: 'Inactive'     },
]

// ─── Table columns ────────────────────────────────────────────
function buildColumns(onReceive, onAdjust, onScrap, onLedger) {
  return [
    {
      key: 'code',
      header: 'Code',
      className: 'font-mono font-medium text-surface-900 whitespace-nowrap',
    },
    {
      key: 'name',
      header: 'Material',
      render: (v, row) => (
        <div>
          <p className="font-medium text-surface-900">{v}</p>
          {row.category && <p className="text-xs text-surface-400">{row.category}</p>}
        </div>
      ),
    },
    {
      key: 'physical_stock_qty',
      header: 'Physical',
      headerClassName: 'w-24',
      render: (v, row) => (
        <span className="tabular-nums font-medium">{fmt(v)} {row.uom}</span>
      ),
    },
    {
      key: 'available_qty',
      header: 'Available',
      headerClassName: 'w-24',
      render: (v, row) => (
        <span className={`tabular-nums font-semibold ${Number(v) <= Number(row.min_stock_qty ?? 0) ? 'text-red-600' : 'text-green-700'}`}>
          {fmt(v)} {row.uom}
        </span>
      ),
    },
    {
      key: 'reserved_qty',
      header: 'Reserved',
      headerClassName: 'w-24',
      render: (v, row) => (
        <span className="tabular-nums text-sky-700">{fmt(v)} {row.uom}</span>
      ),
    },
    {
      key: 'wip_qty',
      header: 'WIP',
      headerClassName: 'w-24',
      render: (v, row) => (
        <span className="tabular-nums text-amber-700">{fmt(v)} {row.uom}</span>
      ),
    },
    {
      key: 'stock_value',
      header: 'Value',
      headerClassName: 'w-28',
      render: (v) => <span className="tabular-nums">{fmtCurr(v)}</span>,
    },
    {
      key: '_bar',
      header: 'Stock Level',
      headerClassName: 'w-32',
      render: (_, row) => (
        <StockLevelBar
          available={row.available_qty}
          reserved={row.reserved_qty}
          wip={row.wip_qty}
          minStock={row.min_stock_qty}
        />
      ),
    },
    {
      key: '_status',
      header: 'Status',
      headerClassName: 'w-24',
      render: (_, row) => (
        <StockBadge
          available={row.available_qty}
          minStock={row.min_stock_qty}
          reorderQty={row.reorder_qty}
        />
      ),
    },
    {
      key: '_actions',
      header: '',
      headerClassName: 'w-28',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <ActionBtn
            label="Receive" icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
            color="text-green-600 hover:bg-green-50"
            onClick={e => { e.stopPropagation(); onReceive(row) }}
          />
          <ActionBtn
            label="Adjust" icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            color="text-amber-600 hover:bg-amber-50"
            onClick={e => { e.stopPropagation(); onAdjust(row) }}
          />
          <ActionBtn
            label="Scrap" icon={<Minus className="h-3.5 w-3.5" />}
            color="text-red-500 hover:bg-red-50"
            onClick={e => { e.stopPropagation(); onScrap(row) }}
          />
          <ActionBtn
            label="Ledger" icon={<BookOpen className="h-3.5 w-3.5" />}
            color="text-primary-600 hover:bg-primary-50"
            onClick={e => { e.stopPropagation(); onLedger(row) }}
          />
        </div>
      ),
    },
  ]
}

function ActionBtn({ label, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 text-surface-400 transition-colors ${color}`}
    >
      {icon}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export function StockPositionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [rows,    setRows]    = useState([])
  const [meta,    setMeta]    = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [lowOnly, setLowOnly] = useState(searchParams.get('low_stock_only') === 'true' ? 'true' : '')
  const [page,    setPage]    = useState(1)

  const [warehouses, setWarehouses] = useState([])

  // Modal state
  const [receiveTarget, setReceiveTarget] = useState(null)
  const [adjustTarget,  setAdjustTarget]  = useState(null)
  const [scrapTarget,   setScrapTarget]   = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  // Load warehouse dropdown once
  useEffect(() => {
    warehousesService.dropdown()
      .then(d => setWarehouses((d ?? []).map(w => ({ value: w.id, label: `${w.code} — ${w.name}` }))))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inventoryService.listPositions({
        page, pageSize: 50,
        search:         debouncedSearch || undefined,
        status:         status          || undefined,
        low_stock_only: lowOnly === 'true' ? true : undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load stock positions.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, lowOnly])

  useEffect(() => { setPage(1) }, [debouncedSearch, status, lowOnly])
  useEffect(() => { load() }, [load])

  // ── Action handlers ────────────────────────────────────────
  async function handleReceive(payload) {
    setActionLoading(true)
    try {
      await inventoryService.receive(payload)
      toast.success('Stock received and ledger updated.')
      setReceiveTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Receive failed.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAdjust(payload) {
    setActionLoading(true)
    try {
      await inventoryService.adjust(payload)
      toast.success('Stock adjusted and ledger updated.')
      setAdjustTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Adjustment failed.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleScrap(payload) {
    setActionLoading(true)
    try {
      await inventoryService.scrap(payload)
      toast.success('Stock scrapped and ledger updated.')
      setScrapTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Scrap failed.')
    } finally {
      setActionLoading(false)
    }
  }

  function goLedger(row) {
    navigate(`/dashboard/inventory/ledger?raw_material_id=${row.raw_material_id}`)
  }

  // ── KPI summary ────────────────────────────────────────────
  const totalValue    = rows.reduce((s, r) => s + Number(r.stock_value ?? 0), 0)
  const lowStockCount = rows.filter(r => Number(r.available_qty) <= Number(r.min_stock_qty ?? 0)).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Positions"
        description="Live view of all raw material quantities — physical, available, reserved and WIP."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load}
              leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm"
              onClick={() => navigate('/dashboard/inventory/ledger')}
              leftIcon={<BookOpen className="h-4 w-4" />}
              variant="secondary">
              View Ledger
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Materials"  value={meta.total ?? 0} />
        <KpiCard label="Total Stock Value" value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
        <KpiCard label="Low Stock Alerts"  value={lowStockCount} highlight={lowStockCount > 0} />
        <KpiCard label="Page Showing"      value={`${rows.length} items`} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-surface-500">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-green-400 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-sky-400 inline-block" /> Reserved</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-amber-400 inline-block" /> WIP</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch}
          placeholder="Search code or name…" className="sm:w-64" />
        <Select value={status} onChange={e => setStatus(e.target.value)}
          options={STATUS_FILTER} className="sm:w-40" aria-label="Filter by status" />
        <Select value={lowOnly} onChange={e => setLowOnly(e.target.value)}
          options={LOW_STOCK_OPTIONS} className="sm:w-44" aria-label="Low stock filter" />
      </div>

      <DataTable
        columns={buildColumns(
          setReceiveTarget,
          setAdjustTarget,
          setScrapTarget,
          goLedger,
        )}
        data={rows}
        loading={loading}
        rowKey="raw_material_id"
        emptyMessage="No stock positions found. Receive stock to get started."
      />

      <Pagination
        page={meta.page ?? 1}
        totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 50}
        onPageChange={setPage}
      />

      {/* Modals */}
      <ReceiveStockModal
        open={!!receiveTarget}
        onClose={() => setReceiveTarget(null)}
        material={receiveTarget}
        onSubmit={handleReceive}
        loading={actionLoading}
        warehouses={warehouses}
      />

      <AdjustStockModal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        material={adjustTarget}
        onSubmit={handleAdjust}
        loading={actionLoading}
        warehouses={warehouses}
      />

      <ScrapStockModal
        open={!!scrapTarget}
        onClose={() => setScrapTarget(null)}
        material={scrapTarget}
        onSubmit={handleScrap}
        loading={actionLoading}
      />
    </div>
  )
}

function KpiCard({ label, value, highlight }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-4 py-3">
      <p className="text-xs text-surface-500">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${highlight ? 'text-red-600' : 'text-surface-900'}`}>{value}</p>
    </div>
  )
}
