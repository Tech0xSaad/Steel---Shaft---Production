import { useState, useEffect, useCallback } from 'react'
import { useNavigate }    from 'react-router-dom'
import toast              from 'react-hot-toast'
import { Plus, RefreshCw, Eye } from 'lucide-react'

import { productionService }  from '@/services/productionService'
import { productsService }    from '@/services/productsService'
import { PageHeader }         from '@/components/common/PageHeader'
import { DataTable }          from '@/components/common/DataTable'
import { SearchBar }          from '@/components/common/SearchBar'
import { Pagination }         from '@/components/common/Pagination'
import { BatchForm }          from './BatchForm'
import { BatchStatusBadge }   from '@/components/production/BatchStatusBadge'
import { Button }             from '@/components/ui/Button'
import { Select }             from '@/components/ui/Select'
import { useDebounce }        from '@/hooks/useDebounce'

// ── status filter options ─────────────────────────────────────
const STATUS_FILTER = [
  { value: '',                  label: 'All Statuses'       },
  { value: 'created',           label: 'Created'            },
  { value: 'reserved',          label: 'Reserved'           },
  { value: 'issued',            label: 'Issued'             },
  { value: 'production_started',label: 'Production Started' },
  { value: 'in_progress',       label: 'In Progress'        },
  { value: 'inspection',        label: 'Inspection'         },
  { value: 'completed',         label: 'Completed'          },
  { value: 'closed',            label: 'Closed'             },
]

function fmt(n, d = 0) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN')
}

// ── table columns ─────────────────────────────────────────────
const COLUMNS = (onView) => [
  {
    key: 'batch_number',
    header: 'Batch No.',
    className: 'font-mono font-semibold text-surface-900 whitespace-nowrap',
  },
  {
    key: 'product',
    header: 'Product',
    render: (v) => v ? `${v.code} — ${v.name}` : '—',
  },
  {
    key: 'planned_qty',
    header: 'Planned Qty',
    headerClassName: 'w-28',
    render: (v, row) => v != null ? `${fmt(v, 0)} ${row.uom}` : '—',
  },
  {
    key: 'expected_yield_qty',
    header: 'Exp. Yield',
    headerClassName: 'w-28',
    render: (v, row) => v != null ? `${fmt(v, 3)} ${row.uom}` : '—',
  },
  {
    key: 'planned_start_date',
    header: 'Start Date',
    headerClassName: 'w-28',
    render: (v) => fmtDate(v),
  },
  {
    key: 'planned_end_date',
    header: 'End Date',
    headerClassName: 'w-28',
    render: (v) => fmtDate(v),
  },
  {
    key: 'priority',
    header: 'Pri.',
    headerClassName: 'w-12',
    render: (v) => (
      <span className={`text-xs font-bold ${v <= 3 ? 'text-red-600' : v <= 7 ? 'text-amber-600' : 'text-surface-500'}`}>
        P{v}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    headerClassName: 'w-36',
    render: (v) => <BatchStatusBadge status={v} size="sm" />,
  },
  {
    key: '_actions',
    header: '',
    headerClassName: 'w-12',
    render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); onView(row.id) }}
        className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors"
        aria-label="View batch"
      >
        <Eye className="h-4 w-4" />
      </button>
    ),
  },
]

export function BatchListPage() {
  const navigate = useNavigate()

  const [rows,    setRows]    = useState([])
  const [meta,    setMeta]    = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [productId, setProductId] = useState('')
  const [page,    setPage]    = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [saving,   setSaving]   = useState(false)

  const [products, setProducts] = useState([])

  const debouncedSearch = useDebounce(search, 350)

  // Load product dropdown for filter
  useEffect(() => {
    productsService.dropdown()
      .then(d => setProducts(d ?? []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productionService.list({
        page,
        pageSize: 20,
        search:     debouncedSearch || undefined,
        status:     status          || undefined,
        product_id: productId       || undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load batches.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, productId])

  useEffect(() => { setPage(1) }, [debouncedSearch, status, productId])
  useEffect(() => { load() },    [load])

  async function handleCreate(payload) {
    setSaving(true)
    try {
      const created = await productionService.create(payload)
      toast.success(`Batch ${created.batch_number} created.`)
      setFormOpen(false)
      navigate(`/dashboard/production/${created.id}`)
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to create batch.')
    } finally {
      setSaving(false)
    }
  }

  const productFilter = [
    { value: '', label: 'All Products' },
    ...products.map(p => ({ value: p.id, label: `${p.code} — ${p.name}` })),
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Production Batches"
        description="Plan, track and manage every production run through its full lifecycle."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load}
              leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}>
              New Batch
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search batch number…"
          className="sm:w-56"
        />
        <Select
          value={status}
          onChange={e => setStatus(e.target.value)}
          options={STATUS_FILTER}
          className="sm:w-48"
          aria-label="Filter by status"
        />
        <Select
          value={productId}
          onChange={e => setProductId(e.target.value)}
          options={productFilter}
          className="sm:w-64"
          aria-label="Filter by product"
        />
      </div>

      <DataTable
        columns={COLUMNS(id => navigate(`/dashboard/production/${id}`))}
        data={rows}
        loading={loading}
        onRowClick={row => navigate(`/dashboard/production/${row.id}`)}
        emptyMessage="No production batches found. Create your first batch to get started."
      />

      <Pagination
        page={meta.page ?? 1}
        totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 20}
        onPageChange={setPage}
      />

      <BatchForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        initial={null}
        loading={saving}
      />
    </div>
  )
}
