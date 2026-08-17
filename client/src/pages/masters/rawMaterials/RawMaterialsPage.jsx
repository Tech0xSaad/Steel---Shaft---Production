import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'

import { rawMaterialsService } from '@/services/rawMaterialsService'
import { PageHeader }          from '@/components/common/PageHeader'
import { DataTable }           from '@/components/common/DataTable'
import { SearchBar }           from '@/components/common/SearchBar'
import { Pagination }          from '@/components/common/Pagination'
import { ConfirmDialog }       from '@/components/common/ConfirmDialog'
import { RawMaterialForm }     from './RawMaterialForm'
import { Button }              from '@/components/ui/Button'
import { Badge }               from '@/components/ui/Badge'
import { Select }              from '@/components/ui/Select'
import { useDebounce }         from '@/hooks/useDebounce'

const STATUS_FILTER = [
  { value: '',         label: 'All Statuses' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const COLUMNS = (onEdit, onDelete) => [
  { key: 'code', header: 'Code', className: 'font-medium text-surface-900 whitespace-nowrap' },
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Category', render: v => v || '—' },
  { key: 'uom',  header: 'UOM', headerClassName: 'w-16' },
  { key: 'grade', header: 'Grade', render: v => v || '—' },
  {
    key: 'current_stock_qty',
    header: 'Stock',
    render: (v, row) => {
      const low = v != null && row.min_stock_qty != null && v <= row.min_stock_qty
      return (
        <span className={low ? 'flex items-center gap-1 text-amber-600 font-medium' : ''}>
          {low && <AlertTriangle className="h-3.5 w-3.5" />}
          {v != null ? Number(v).toLocaleString('en-IN') : '—'}
        </span>
      )
    },
  },
  {
    key: 'unit_cost',
    header: 'Unit Cost',
    render: v => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: v => <Badge variant={v === 'active' ? 'success' : 'warning'}>{v}</Badge>,
    headerClassName: 'w-24',
  },
  {
    key: '_actions', header: '', headerClassName: 'w-20',
    render: (_, row) => (
      <div className="flex items-center gap-1 justify-end">
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

export function RawMaterialsPage() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [page, setPage]       = useState(1)

  const [formOpen, setFormOpen]           = useState(false)
  const [editing, setEditing]             = useState(null)
  const [saving, setSaving]               = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleting, setDeleting]           = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await rawMaterialsService.list({
        page, pageSize: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load raw materials.')
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
        await rawMaterialsService.update(editing.id, payload)
        toast.success('Raw material updated.')
      } else {
        await rawMaterialsService.create(payload)
        toast.success('Raw material created.')
      }
      setFormOpen(false); setEditing(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await rawMaterialsService.remove(deleteTarget.id)
      toast.success('Raw material deleted.')
      setDeleteTarget(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Raw Material Master"
        description="Manage raw materials, stock thresholds, supplier details and costing."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }} leftIcon={<Plus className="h-4 w-4" />}>New Material</Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search code or name…" className="sm:w-72" />
        <Select value={status} onChange={e => setStatus(e.target.value)}
          options={STATUS_FILTER} className="sm:w-44" aria-label="Filter by status" />
      </div>

      <DataTable
        columns={COLUMNS(r => { setEditing(r); setFormOpen(true) }, r => setDeleteTarget(r))}
        data={rows} loading={loading}
        emptyMessage="No raw materials found. Add your first material to get started."
      />

      <Pagination page={meta.page ?? 1} totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0} pageSize={meta.pageSize ?? 20} onPageChange={setPage} />

      <RawMaterialForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit} initial={editing} loading={saving} />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Raw Material?"
        message={`"${deleteTarget?.name}" will be permanently deleted. Any BOMs referencing it must be updated first.`} />
    </div>
  )
}
