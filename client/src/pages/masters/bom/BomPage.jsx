import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw, Eye } from 'lucide-react'

import { bomService }        from '@/services/bomService'
import { productsService }   from '@/services/productsService'
import { PageHeader }        from '@/components/common/PageHeader'
import { DataTable }         from '@/components/common/DataTable'
import { SearchBar }         from '@/components/common/SearchBar'
import { Pagination }        from '@/components/common/Pagination'
import { ConfirmDialog }     from '@/components/common/ConfirmDialog'
import { BomForm }           from './BomForm'
import { BomDetailModal }    from './BomDetailModal'
import { Button }            from '@/components/ui/Button'
import { Badge }             from '@/components/ui/Badge'
import { Select }            from '@/components/ui/Select'
import { useDebounce }       from '@/hooks/useDebounce'

const COLUMNS = (onView, onEdit, onDelete) => [
  {
    key: 'product',
    header: 'Product',
    render: (v) => v ? (
      <span className="font-medium text-surface-900">{v.code} — {v.name}</span>
    ) : '—',
  },
  { key: 'version', header: 'Version', headerClassName: 'w-24' },
  {
    key: 'items',
    header: 'Lines',
    headerClassName: 'w-16',
    render: (v) => v?.length ?? '—',
  },
  {
    key: 'is_active',
    header: 'Status',
    headerClassName: 'w-24',
    render: v => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Badge>,
  },
  {
    key: 'created_at',
    header: 'Created',
    render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—',
  },
  {
    key: '_actions', header: '', headerClassName: 'w-28',
    render: (_, row) => (
      <div className="flex items-center gap-1 justify-end">
        <button onClick={e => { e.stopPropagation(); onView(row) }}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors" aria-label="View">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit(row) }}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors" aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(row) }}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
  },
]

const ACTIVE_FILTER = [
  { value: '',     label: 'All BOMs' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
]

export function BomPage() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')
  const [isActive, setIsActive]   = useState('')
  const [page, setPage]           = useState(1)

  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState(null)  // holds list row (no items yet)
  const [editFull, setEditFull]         = useState(null)  // holds full BOM with items
  const [saving, setSaving]             = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [viewTarget, setViewTarget]     = useState(null)
  const [viewLoading, setViewLoading]   = useState(false)

  const [products, setProducts] = useState([])

  useEffect(() => {
    productsService.dropdown().then(d => setProducts(d ?? [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await bomService.list({
        page, pageSize: 20,
        product_id: productId || undefined,
        is_active:  isActive !== '' ? isActive : undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load BOMs.')
    } finally {
      setLoading(false)
    }
  }, [page, productId, isActive])

  useEffect(() => { setPage(1) }, [productId, isActive])
  useEffect(() => { load() }, [load])

  async function openEdit(row) {
    // Fetch full BOM (with items) before opening form
    try {
      const full = await bomService.getById(row.id)
      setEditing(row)
      setEditFull(full)
      setFormOpen(true)
    } catch (err) {
      toast.error('Failed to load BOM details.')
    }
  }

  async function openView(row) {
    setViewLoading(true)
    try {
      const full = await bomService.getById(row.id)
      setViewTarget(full)
    } catch {
      toast.error('Failed to load BOM details.')
    } finally {
      setViewLoading(false)
    }
  }

  async function handleSubmit(payload) {
    setSaving(true)
    try {
      if (editing) {
        await bomService.update(editing.id, payload)
        toast.success('BOM updated.')
      } else {
        await bomService.create(payload)
        toast.success('BOM created.')
      }
      setFormOpen(false); setEditing(null); setEditFull(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await bomService.remove(deleteTarget.id)
      toast.success('BOM deleted.')
      setDeleteTarget(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  const productFilter = [
    { value: '', label: 'All Products' },
    ...products.map(p => ({ value: p.id, label: `${p.code} — ${p.name}` })),
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bill of Materials"
        description="Define the raw material composition for each finished product."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button size="sm" onClick={() => { setEditing(null); setEditFull(null); setFormOpen(true) }}
              leftIcon={<Plus className="h-4 w-4" />}>New BOM</Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={productId} onChange={e => setProductId(e.target.value)}
          options={productFilter} className="sm:w-72" aria-label="Filter by product" />
        <Select value={isActive} onChange={e => setIsActive(e.target.value)}
          options={ACTIVE_FILTER} className="sm:w-40" aria-label="Filter by status" />
      </div>

      <DataTable
        columns={COLUMNS(openView, openEdit, r => setDeleteTarget(r))}
        data={rows} loading={loading || viewLoading}
        emptyMessage="No BOMs found. Create a BOM to link products to their raw materials."
      />

      <Pagination page={meta.page ?? 1} totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0} pageSize={meta.pageSize ?? 20} onPageChange={setPage} />

      <BomForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setEditFull(null) }}
        onSubmit={handleSubmit}
        initial={editFull}
        loading={saving}
      />

      <BomDetailModal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        bom={viewTarget}
      />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete BOM?"
        message={`BOM version "${deleteTarget?.version}" will be permanently deleted along with all material lines.`} />
    </div>
  )
}
