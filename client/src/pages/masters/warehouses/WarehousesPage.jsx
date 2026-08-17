import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'

import { warehousesService } from '@/services/warehousesService'
import { PageHeader }        from '@/components/common/PageHeader'
import { DataTable }         from '@/components/common/DataTable'
import { SearchBar }         from '@/components/common/SearchBar'
import { Pagination }        from '@/components/common/Pagination'
import { ConfirmDialog }     from '@/components/common/ConfirmDialog'
import { WarehouseForm }     from './WarehouseForm'
import { Button }            from '@/components/ui/Button'
import { Badge }             from '@/components/ui/Badge'
import { Select }            from '@/components/ui/Select'
import { useDebounce }       from '@/hooks/useDebounce'

const TYPE_LABEL = {
  raw_material:   'Raw Material',
  finished_goods: 'Finished Goods',
  wip:            'WIP',
  general:        'General',
}

const TYPE_FILTER = [
  { value: '',               label: 'All Types' },
  { value: 'raw_material',   label: 'Raw Material' },
  { value: 'finished_goods', label: 'Finished Goods' },
  { value: 'wip',            label: 'WIP' },
  { value: 'general',        label: 'General' },
]

const COLUMNS = (onEdit, onDelete) => [
  { key: 'code', header: 'Code', className: 'font-medium text-surface-900 whitespace-nowrap' },
  { key: 'name', header: 'Name' },
  { key: 'warehouse_type', header: 'Type', render: v => TYPE_LABEL[v] ?? v },
  { key: 'city',  header: 'City',  render: v => v || '—' },
  { key: 'state', header: 'State', render: v => v || '—' },
  { key: 'manager_name', header: 'Manager', render: v => v || '—' },
  {
    key: 'is_active',
    header: 'Status',
    render: v => <Badge variant={v ? 'success' : 'warning'}>{v ? 'Active' : 'Inactive'}</Badge>,
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

export function WarehousesPage() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [type, setType]       = useState('')
  const [page, setPage]       = useState(1)

  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState(null)
  const [saving, setSaving]             = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await warehousesService.list({
        page, pageSize: 20,
        search: debouncedSearch || undefined,
        type: type || undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load warehouses.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, type])

  useEffect(() => { setPage(1) }, [debouncedSearch, type])
  useEffect(() => { load() }, [load])

  async function handleSubmit(payload) {
    setSaving(true)
    try {
      if (editing) {
        await warehousesService.update(editing.id, payload)
        toast.success('Warehouse updated.')
      } else {
        await warehousesService.create(payload)
        toast.success('Warehouse created.')
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
      await warehousesService.remove(deleteTarget.id)
      toast.success('Warehouse deleted.')
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
        title="Warehouse Master"
        description="Manage storage locations, capacities and contacts."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }} leftIcon={<Plus className="h-4 w-4" />}>New Warehouse</Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search code or name…" className="sm:w-72" />
        <Select value={type} onChange={e => setType(e.target.value)}
          options={TYPE_FILTER} className="sm:w-48" aria-label="Filter by type" />
      </div>

      <DataTable
        columns={COLUMNS(r => { setEditing(r); setFormOpen(true) }, r => setDeleteTarget(r))}
        data={rows} loading={loading}
        emptyMessage="No warehouses found. Add your first warehouse to get started."
      />

      <Pagination page={meta.page ?? 1} totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0} pageSize={meta.pageSize ?? 20} onPageChange={setPage} />

      <WarehouseForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit} initial={editing} loading={saving} />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Warehouse?"
        message={`"${deleteTarget?.name}" will be permanently deleted.`} />
    </div>
  )
}
