import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate }      from 'react-router-dom'
import toast                                 from 'react-hot-toast'
import { RefreshCw, ArrowLeft }              from 'lucide-react'

import { inventoryService }    from '@/services/inventoryService'
import { rawMaterialsService } from '@/services/rawMaterialsService'
import { PageHeader }          from '@/components/common/PageHeader'
import { DataTable }           from '@/components/common/DataTable'
import { SearchBar }           from '@/components/common/SearchBar'
import { Pagination }          from '@/components/common/Pagination'
import { Button }              from '@/components/ui/Button'
import { Select }              from '@/components/ui/Select'
import { Input }               from '@/components/ui/Input'
import { MovementTypeBadge }   from '@/components/inventory/MovementTypeBadge'
import { TXN_TYPE_OPTIONS, TXN_DIRECTION } from '@/constants/inventoryTypes'
import { useDebounce }         from '@/hooks/useDebounce'

// ─── helpers ─────────────────────────────────────────────────
function fmt(n, d = 3) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d })
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TXN_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  ...TXN_TYPE_OPTIONS,
]

// ─── Columns ─────────────────────────────────────────────────
const COLUMNS = [
  {
    key: 'created_at',
    header: 'Date / Time',
    render: v => <span className="whitespace-nowrap text-xs">{fmtDateTime(v)}</span>,
  },
  {
    key: 'transaction_type',
    header: 'Type',
    headerClassName: 'w-44',
    render: (v) => <MovementTypeBadge type={v} showDirection />,
  },
  {
    key: 'raw_material',
    header: 'Material',
    render: (v) => v
      ? <span className="font-medium text-surface-900">{v.code} — {v.name}</span>
      : '—',
  },
  {
    key: 'quantity',
    header: 'Qty',
    headerClassName: 'w-24',
    render: (v, row) => {
      const dir = TXN_DIRECTION[row.transaction_type] ?? ''
      const isNeg = dir === '−'
      return (
        <span className={`tabular-nums font-medium ${isNeg ? 'text-red-600' : dir === '+' ? 'text-green-700' : 'text-surface-700'}`}>
          {dir} {fmt(v)} {row.uom}
        </span>
      )
    },
  },
  {
    key: 'balance_after',
    header: 'Balance After',
    headerClassName: 'w-28',
    render: (v, row) => (
      <span className="tabular-nums text-surface-700">{fmt(v)} {row.uom}</span>
    ),
  },
  {
    key: 'total_cost',
    header: 'Value',
    headerClassName: 'w-28',
    render: (v) => v != null && Number(v) > 0
      ? <span className="tabular-nums">₹{Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      : '—',
  },
  {
    key: 'reference_number',
    header: 'Reference',
    render: v => v || '—',
  },
  {
    key: 'batch',
    header: 'Batch',
    render: (v) => v?.batch_number
      ? <span className="font-mono text-xs text-primary-700">{v.batch_number}</span>
      : '—',
  },
  {
    key: 'actor_email',
    header: 'By',
    render: v => v
      ? <span className="text-xs text-surface-500 truncate max-w-[120px] block">{v}</span>
      : '—',
  },
  {
    key: 'notes',
    header: 'Notes',
    render: v => v
      ? <span className="text-xs text-surface-500 truncate max-w-[140px] block" title={v}>{v}</span>
      : '—',
  },
]

// ─── Page ─────────────────────────────────────────────────────
export function LedgerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows,    setRows]    = useState([])
  const [meta,    setMeta]    = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(1)

  // Filters (pre-populated from URL search params)
  const [search,   setSearch]   = useState(searchParams.get('search') ?? '')
  const [txnType,  setTxnType]  = useState(searchParams.get('transaction_type') ?? '')
  const [matId,    setMatId]    = useState(searchParams.get('raw_material_id') ?? '')
  const [fromDate, setFromDate] = useState(searchParams.get('from_date') ?? '')
  const [toDate,   setToDate]   = useState(searchParams.get('to_date') ?? '')

  // Material dropdown
  const [materials, setMaterials] = useState([])

  const debouncedSearch = useDebounce(search, 350)

  useEffect(() => {
    rawMaterialsService.dropdown()
      .then(d => setMaterials([
        { value: '', label: 'All Materials' },
        ...(d ?? []).map(m => ({ value: m.id, label: `${m.code} — ${m.name}` })),
      ]))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inventoryService.listTransactions({
        page, pageSize: 50,
        search:           debouncedSearch || undefined,
        transaction_type: txnType         || undefined,
        raw_material_id:  matId           || undefined,
        from_date:        fromDate        || undefined,
        to_date:          toDate          || undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load ledger.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, txnType, matId, fromDate, toDate])

  useEffect(() => { setPage(1) }, [debouncedSearch, txnType, matId, fromDate, toDate])
  useEffect(() => { load() }, [load])

  const materialName = materials.find(m => m.value === matId)?.label

  return (
    <div className="space-y-5">
      <PageHeader
        title={matId ? `Ledger — ${materialName ?? ''}` : 'Inventory Ledger'}
        description="Every inventory movement — immutable, chronological, fully traceable."
        actions={
          <>
            {matId && (
              <Button variant="secondary" size="sm"
                onClick={() => { setMatId(''); setSearchParams({}) }}
                leftIcon={<ArrowLeft className="h-4 w-4" />}>
                All Materials
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={load}
              leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="flex items-center gap-4 text-sm text-surface-500">
        <span>
          <span className="font-semibold text-surface-900">{meta.total ?? 0}</span> transactions
        </span>
        {meta.total > 0 && (
          <span className="text-xs">
            Showing page {meta.page} of {meta.totalPages}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch}
          placeholder="Search reference no…" className="sm:w-56" />
        <Select value={txnType} onChange={e => setTxnType(e.target.value)}
          options={TXN_FILTER_OPTIONS} className="sm:w-52" aria-label="Filter by type" />
        <Select value={matId} onChange={e => setMatId(e.target.value)}
          options={materials} className="sm:w-60" aria-label="Filter by material" />
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="w-36 text-sm" aria-label="From date" />
          <span className="text-surface-400 text-sm">to</span>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="w-36 text-sm" aria-label="To date" />
        </div>
        {(txnType || matId || fromDate || toDate || search) && (
          <Button variant="ghost" size="sm" onClick={() => {
            setSearch(''); setTxnType(''); setMatId(''); setFromDate(''); setToDate('')
            setSearchParams({})
          }}>
            Clear filters
          </Button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        data={rows}
        loading={loading}
        emptyMessage="No transactions found for the selected filters."
      />

      <Pagination
        page={meta.page ?? 1}
        totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 50}
        onPageChange={setPage}
      />
    </div>
  )
}
