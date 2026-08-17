import { useState, useEffect, useCallback } from 'react'
import { useNavigate }   from 'react-router-dom'
import toast             from 'react-hot-toast'
import {
  Plus, RefreshCw, Trash2, Pencil,
  CheckCircle2, AlertCircle, Filter,
} from 'lucide-react'

import { scrapService }        from '@/services/scrapService'
import { PageHeader }          from '@/components/common/PageHeader'
import { ConfirmDialog }       from '@/components/common/ConfirmDialog'
import { SearchBar }           from '@/components/common/SearchBar'
import { Pagination }          from '@/components/common/Pagination'
import { Button }              from '@/components/ui/Button'
import { Card, CardBody }      from '@/components/ui/Card'
import { Select }              from '@/components/ui/Select'
import { Spinner }             from '@/components/ui/Spinner'
import { ScrapCategoryBadge }  from '@/components/quality/ScrapCategoryBadge'
import { ScrapForm }           from './modals/ScrapForm'
import { DisposeScrapModal }   from './modals/DisposeScrapModal'
import {
  SCRAP_CATEGORY_OPTIONS,
  SCRAP_CATEGORY_LABELS,
} from '@/constants/qualityTypes'

// ─── helpers ─────────────────────────────────────────────────
function fmt(n, d = 2) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d })
}
function fmtCurr(n) {
  if (n == null) return '—'
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 15

export function ScrapPage() {
  const navigate = useNavigate()

  const [records,       setRecords]       = useState([])
  const [meta,          setMeta]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [page,          setPage]          = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [createOpen,    setCreateOpen]    = useState(false)
  const [creating,      setCreating]      = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [disposeTarget, setDisposeTarget] = useState(null)
  const [disposing,     setDisposing]     = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize: PAGE_SIZE }
      if (categoryFilter) params.scrap_category = categoryFilter
      const result = await scrapService.list(params)
      setRecords(result.data ?? [])
      setMeta(result.meta)
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load scrap records.')
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [categoryFilter])

  async function handleCreate(payload) {
    setCreating(true)
    try {
      await scrapService.create(payload)
      toast.success('Scrap record created.')
      setCreateOpen(false)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to create scrap record.')
    } finally {
      setCreating(false)
    }
  }

  async function handleEdit(payload) {
    setSaving(true)
    try {
      await scrapService.update(editTarget.id, payload)
      toast.success('Scrap record updated.')
      setEditTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDispose(payload) {
    setDisposing(true)
    try {
      await scrapService.markDisposed(disposeTarget.id, payload)
      toast.success('Scrap marked as disposed.')
      setDisposeTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to update disposal.')
    } finally {
      setDisposing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await scrapService.delete(deleteTarget.id)
      toast.success('Scrap record deleted.')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  const totalScrapQty  = records.reduce((s, r) => s + Number(r.qty_scrapped     ?? 0), 0)
  const totalScrapCost = records.reduce((s, r) => s + Number(r.total_scrap_cost ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scrap Management"
        subtitle="Track and manage all scrap events across production batches"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={load}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Log Scrap
            </Button>
          </div>
        }
      />

      {/* Summary strip */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SummaryCard label="Records (this page)" value={records.length} />
          <SummaryCard label="Total Qty Scrapped"  value={`${fmt(totalScrapQty, 2)} pcs`} />
          <SummaryCard label="Total Scrap Cost"    value={fmtCurr(totalScrapCost)} highlight />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-48">
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            options={[{ value: '', label: 'All Categories' }, ...SCRAP_CATEGORY_OPTIONS]}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-surface-500">No scrap records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  {['Date', 'Batch', 'Category', 'Qty', 'Weight', 'Cost', 'Dept / Operator', 'Disposed', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(r.scrap_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        className="text-primary-600 hover:underline font-medium"
                        onClick={() => navigate(`/dashboard/production/${r.batch_id}`)}
                      >
                        {r.batch?.batch_number ?? '—'}
                      </button>
                      <p className="text-xs text-surface-400">{r.batch?.product?.name ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ScrapCategoryBadge category={r.scrap_category} />
                      {r.description && (
                        <p className="text-xs text-surface-400 mt-0.5 max-w-[160px] truncate">
                          {r.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {fmt(r.qty_scrapped)} {r.uom}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.weight_kg ? `${fmt(r.weight_kg, 2)} kg` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.total_scrap_cost > 0 ? fmtCurr(r.total_scrap_cost) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-surface-700">{r.department || '—'}</p>
                      <p className="text-xs text-surface-400">{r.operator_name || ''}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.disposed_at ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {fmtDate(r.disposed_at)}
                        </span>
                      ) : (
                        <span className="text-xs text-surface-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!r.disposed_at && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => setDisposeTarget(r)}
                            title="Mark Disposed"
                          >
                            Dispose
                          </Button>
                        )}
                        <button
                          onClick={() => setEditTarget(r)}
                          className="p-1.5 rounded hover:bg-surface-100 text-surface-500 hover:text-surface-700"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {/* Modals */}
      <ScrapForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        saving={creating}
      />
      <ScrapForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        saving={saving}
        initial={editTarget}
      />
      <DisposeScrapModal
        open={!!disposeTarget}
        onClose={() => setDisposeTarget(null)}
        onSubmit={handleDispose}
        saving={disposing}
        record={disposeTarget}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Scrap Record"
        description="This scrap record will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? 'border-red-200 bg-red-50' : 'border-surface-200 bg-white'}`}>
      <p className="text-xs text-surface-500">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-red-700' : 'text-surface-900'}`}>{value}</p>
    </div>
  )
}
