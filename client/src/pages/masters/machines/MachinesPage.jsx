import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'

import { machinesService } from '@/services/machinesService'
import { PageHeader }      from '@/components/common/PageHeader'
import { DataTable }       from '@/components/common/DataTable'
import { SearchBar }       from '@/components/common/SearchBar'
import { Pagination }      from '@/components/common/Pagination'
import { ConfirmDialog }   from '@/components/common/ConfirmDialog'
import { MachineForm }     from './MachineForm'
import { Button }          from '@/components/ui/Button'
import { Badge }           from '@/components/ui/Badge'
import { Select }          from '@/components/ui/Select'
import { useDebounce }     from '@/hooks/useDebounce'

const STATUS_BADGE = {
  active:      'success',
  idle:        'default',
  maintenance: 'warning',
  retired:     'danger',
}

const STATUS_FILTER = [
  { value: '',            label: 'All Statuses' },
  { value: 'active',      label: 'Active' },
  { value: 'idle',        label: 'Idle' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired',     label: 'Retired' },
]

const COLUMNS = (onEdit, onDelete) => [
  { key: 'code', header: 'Code', className: 'font-medium text-surface-900 whitespace-nowrap' },
  { key: 'name', header: 'Name' },
  { key: 'machine_type', header: 'Type', render: v => v || '—' },
  { key: 'make', header: 'Make', render: v => v || '—' },
  { key: 'department', header: 'Department', render: v => v || '—' },
  {
    key: 'hourly_rate',
    header: 'Rate/hr',
    render: v => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'next_maintenance_at',
    header: 'Next Service',
    render: v => {
      if (!v) return '—'
      const d = new Date(v)
      const overdue = d < new Date()
      return <span className={overdue ? 'text-red-600 font-medium' : ''}>{d.toLocaleDateString('en-IN')}</span>
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: v => <Badge variant={STATUS_BADGE[v] ?? 'default'}>{v}</Badge>,
    headerClassName: 'w-28',
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

export function MachinesPage() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
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
      const res = await machinesService.list({
        page, pageSize: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
      })
      setRows(res.data ?? [])
      setMeta(res.meta ?? {})
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load machines.')
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
        await machinesService.update(editing.id, payload)
        toast.success('Machine updated.')
      } else {
        await machinesService.create(payload)
        toast.success('Machine created.')
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
      await machinesService.remove(deleteTarget.id)
      toast.success('Machine deleted.')
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
        title="Machine Master"
        description="Manage machines, capacities, maintenance schedules and hourly rates."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }} leftIcon={<Plus className="h-4 w-4" />}>New Machine</Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search code or name…" className="sm:w-72" />
        <Select value={status} onChange={e => setStatus(e.target.value)}
          options={STATUS_FILTER} className="sm:w-48" aria-label="Filter by status" />
      </div>

      <DataTable
        columns={COLUMNS(r => { setEditing(r); setFormOpen(true) }, r => setDeleteTarget(r))}
        data={rows} loading={loading}
        emptyMessage="No machines found. Add your first machine to get started."
      />

      <Pagination page={meta.page ?? 1} totalPages={meta.totalPages ?? 0}
        total={meta.total ?? 0} pageSize={meta.pageSize ?? 20} onPageChange={setPage} />

      <MachineForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit} initial={editing} loading={saving} />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Machine?"
        message={`"${deleteTarget?.name}" will be permanently deleted.`} />
    </div>
  )
}
