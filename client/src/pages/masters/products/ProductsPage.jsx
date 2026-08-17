import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'

import { productsService }  from '@/services/productsService'
import { PageHeader }       from '@/components/common/PageHeader'
import { DataTable }        from '@/components/common/DataTable'
import { SearchBar }        from '@/components/common/SearchBar'
import { Pagination }       from '@/components/common/Pagination'
import { ConfirmDialog }    from '@/components/common/ConfirmDialog'
import { ProductForm }      from './ProductForm'
import { Button }           from '@/components/ui/Button'
import { Badge }            from '@/components/ui/Badge'
import { Select }           from '@/components/ui/Select'
import { useDebounce }      from '@/hooks/useDebounce'

const STATUS_BADGE = {
  active:       'success',
  inactive:     'warning',
  discontinued: 'danger',
}

const STATUS_FILTER = [
  { value: '',             label: 'All Statuses' },
  { value: 'active',       label: 'Active' },
  { value: 'inactive',     label: 'Inactive' },
  { value: 'discontinued', label: 'Discontinued' },
]

const COLUMNS = (onEdit, onDelete) => [
  { key: 'code',   header: 'Code',   className: 'font-medium text-surface-900 whitespace-nowrap' },
  { key: 'name',   header: 'Name' },
  { key: 'category', header: 'Category', render: v => v || '—' },
  { key: 'uom',    header: 'UOM', headerClassName: 'w-16' },
  {
    key: 'expected_scrap_pct',
    header: 'Scrap %',
    render: v => v != null ? `${v}%` : '—',
    headerClassName: 'w-20',
  },
  {
    key: 'standard_cost',
    header: 'Std Cost',
    render: v => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: v => <Badge variant={STATUS_BADGE[v] ?? 'default'}>{v}</Badge>,
    headerClassName: 'w-28',
  },
  {
    key: '_actions',
    header: '',
    headerClassName: 'w-20',
    render: (_, row) => (
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={e => { e.stopPropagation(); onEdit(row) }}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(row) }}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
  },
]

export function ProductsPage() {
  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [page, setPage]         = useState(1)

  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [saving, setSaving]           = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productsService.list({ page, pageSize: 20, search: debouncedSearch || undefined, status: status || undefined })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status])

  useEffect(() => { setPage(1) }, [debouncedSearch, status])
  useEffect(() => { load() }, [load])

  async function handleSubmit(payload) {
    setSaving(true)
    try {
      if (editing) {
        await productsService.update(editing.id, payload)
        toast.success('Product updated.')
      } else {
        await productsService.create(payload)
        toast.success('Product created.')
      }
      setFormOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await productsService.remove(deleteTarget.id)
      toast.success('Product deleted.')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  function openNew()   { setEditing(null); setFormOpen(true) }
  function openEdit(r) { setEditing(r);    setFormOpen(true) }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product Master"
        description="Define finished products with manufacturing standards and production parameters."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button size="sm" onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>New Product</Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search code or name…" className="sm:w-72" />
        <Select
          value={status}
          onChange={e => setStatus(e.target.value)}
          options={STATUS_FILTER}
          className="sm:w-44"
          aria-label="Filter by status"
        />
      </div>

      <DataTable
        columns={COLUMNS(openEdit, r => setDeleteTarget(r))}
        data={rows}
        loading={loading}
        emptyMessage="No products found. Create your first product to get started."
      />

      <Pagination
        page={meta.page ?? 1}
        totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0}
        pageSize={meta.pageSize ?? 20}
        onPageChange={setPage}
      />

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product?"
        message={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
      />
    </div>
  )
}
