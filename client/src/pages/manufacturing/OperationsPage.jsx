import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate }            from 'react-router-dom'
import toast                                 from 'react-hot-toast'
import {
  ArrowLeft, Plus, RefreshCw,
  Pencil, Trash2, ClipboardList,
} from 'lucide-react'

import { manufacturingService } from '@/services/manufacturingService'
import { machinesService }       from '@/services/machinesService'
import { productionService }     from '@/services/productionService'
import { PageHeader }            from '@/components/common/PageHeader'
import { ConfirmDialog }         from '@/components/common/ConfirmDialog'
import { Button }                from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge }                 from '@/components/ui/Badge'
import { Spinner }               from '@/components/ui/Spinner'
import { OperationStatusBadge }  from '@/components/manufacturing/OperationStatusBadge'
import { OperationForm }            from './modals/OperationForm'
import { TransitionOperationModal } from './modals/TransitionOperationModal'
import { ProductionEntryForm }      from './modals/ProductionEntryForm'
import { ProductionEntriesPanel }   from './ProductionEntriesPanel'
import { OP_AVAILABLE_TRANSITIONS, OP_STATUS } from '@/constants/operationStatus'

// ─── helpers ────────────────────────────────────────────────
function fmtTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function fmt(n, d = 2) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d })
}

// ─── Single operation card ───────────────────────────────────
function OperationCard({
  op, onEdit, onDelete, onTransition, onAddEntry, onToggleEntries, showEntries,
  machines, addEntryLoading, transitionLoading, activeTransition,
}) {
  const transitions = OP_AVAILABLE_TRANSITIONS[op.status] ?? []
  const canEdit   = op.status === OP_STATUS.PENDING
  const canDelete = op.status === OP_STATUS.PENDING

  const totalTime = op.entries?.reduce((s, e) => s + Number(e.time_taken_minutes ?? 0), 0) ?? 0
  const entryCount = op.entries?.length ?? 0

  return (
    <Card padded bordered className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Sequence + name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-bold text-surface-600">
            {op.sequence_no ?? '—'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-surface-900 truncate">
              {op.operation_type?.name ?? op.operation_code}
            </p>
            <p className="text-xs text-surface-500">{op.operation_type?.category ?? ''}</p>
          </div>
        </div>
        <OperationStatusBadge status={op.status} />
      </div>

      {/* KPI mini-row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Planned Qty"  value={fmt(op.planned_qty, 0)} />
        <Metric label="Produced"     value={fmt(op.qty_output,  0)} />
        <Metric label="Rejected"     value={fmt(op.qty_rejected,0)} highlight={Number(op.qty_rejected) > 0} />
        <Metric label="Efficiency"   value={op.efficiency_pct != null ? `${fmt(op.efficiency_pct)}%` : '—'} />
      </div>

      {/* Machine / operator / times */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-surface-500">
        <span><b>Machine:</b> {op.machine?.name ?? '—'}</span>
        <span><b>Operator:</b> {op.operator_name ?? '—'}</span>
        <span><b>Started:</b> {fmtTime(op.actual_start_at)}</span>
        <span><b>Ended:</b> {fmtTime(op.actual_end_at)}</span>
      </div>

      {op.cycle_time_actual_min != null && (
        <p className="text-xs text-surface-500">
          Actual cycle time: <b>{fmt(op.cycle_time_actual_min)} min/pc</b>
          {op.operation_type?.standard_time_minutes && (
            <span className="ml-2 text-surface-400">
              (std: {op.operation_type.standard_time_minutes} min/pc)
            </span>
          )}
        </p>
      )}

      {op.rejection_reason && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          Rejection: {op.rejection_reason}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-surface-100">
        {/* Lifecycle transitions */}
        {transitions.map(t => (
          <Button key={t.to} variant={t.variant} size="sm"
            loading={transitionLoading && activeTransition?.to === t.to}
            disabled={transitionLoading}
            onClick={() => onTransition(op, t)}>
            {t.label}
          </Button>
        ))}

        {/* Add production entry */}
        {(op.status === OP_STATUS.IN_PROGRESS || op.status === OP_STATUS.ON_HOLD) && (
          <Button size="sm" variant="secondary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onAddEntry(op)}>
            Add Entry
          </Button>
        )}

        {/* Toggle entries panel */}
        <button
          onClick={() => onToggleEntries(op.id)}
          className="ml-auto text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          {entryCount} entr{entryCount !== 1 ? 'ies' : 'y'}
          {showEntries ? ' ▲' : ' ▼'}
        </button>

        {canEdit && (
          <button onClick={() => onEdit(op)}
            className="rounded p-1 text-surface-400 hover:text-primary-600 hover:bg-surface-100"
            aria-label="Edit operation">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(op)}
            className="rounded p-1 text-surface-400 hover:text-red-600 hover:bg-red-50"
            aria-label="Delete operation">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Production entries panel */}
      {showEntries && (
        <ProductionEntriesPanel
          operation={op}
          machines={machines}
          onEntryAdded={() => {}}
        />
      )}
    </Card>
  )
}

function Metric({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs text-surface-400">{label}</p>
      <p className={`font-semibold text-surface-900 ${highlight ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export function OperationsPage() {
  const { batchId } = useParams()
  const navigate    = useNavigate()

  const [batch,      setBatch]      = useState(null)
  const [ops,        setOps]        = useState([])
  const [loading,    setLoading]    = useState(true)
  const [machines,   setMachines]   = useState([])

  // Modals
  const [formOpen,      setFormOpen]      = useState(false)
  const [editingOp,     setEditingOp]     = useState(null)
  const [formLoading,   setFormLoading]   = useState(false)

  const [transition,    setTransition]    = useState(null)  // { op, action: { to, label, variant } }
  const [transLoading,  setTransLoading]  = useState(false)

  const [entryTarget,   setEntryTarget]   = useState(null)
  const [entryLoading,  setEntryLoading]  = useState(false)

  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  const [expandedOps,   setExpandedOps]   = useState(new Set())

  // Load machines dropdown once
  useEffect(() => {
    machinesService.dropdown()
      .then(d => setMachines((d ?? []).map(m => ({ value: m.id, label: `${m.code} — ${m.name}` }))))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [batchData, opsData] = await Promise.all([
        productionService.getById(batchId),
        manufacturingService.getOperationsByBatch(batchId),
      ])
      setBatch(batchData)
      setOps(opsData ?? [])
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load operations.')
      navigate('/dashboard/production')
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => { load() }, [load])

  // ── Add / edit operation ──────────────────────────────────
  async function handleFormSubmit(payload) {
    setFormLoading(true)
    try {
      if (editingOp) {
        await manufacturingService.updateOperation(editingOp.id, payload)
        toast.success('Operation updated.')
      } else {
        await manufacturingService.addOperation(batchId, payload)
        toast.success('Operation added.')
      }
      setFormOpen(false); setEditingOp(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Save failed.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Delete operation ─────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      await manufacturingService.deleteOperation(deleteTarget.id)
      toast.success('Operation deleted.')
      setDeleteTarget(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Transition operation ──────────────────────────────────
  async function handleTransition(payload) {
    setTransLoading(true)
    try {
      await manufacturingService.transitionOperation(transition.op.id, payload)
      toast.success(`Operation "${transition.action.label}" successfully.`)
      setTransition(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Transition failed.')
    } finally {
      setTransLoading(false)
    }
  }

  // ── Production entry ─────────────────────────────────────
  async function handleAddEntry(payload) {
    setEntryLoading(true)
    try {
      await manufacturingService.addEntry(entryTarget.id, payload)
      toast.success('Production entry recorded.')
      // Auto-expand entries for this operation
      setExpandedOps(prev => new Set([...prev, entryTarget.id]))
      setEntryTarget(null); load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Entry failed.')
    } finally {
      setEntryLoading(false)
    }
  }

  function toggleEntries(opId) {
    setExpandedOps(prev => {
      const next = new Set(prev)
      next.has(opId) ? next.delete(opId) : next.add(opId)
      return next
    })
  }

  // ── Progress summary ─────────────────────────────────────
  const totalOps    = ops.length
  const completedOps = ops.filter(o => o.status === 'completed').length
  const progressPct  = totalOps > 0 ? Math.round((completedOps / totalOps) * 100) : 0
  const totalProduced = ops.reduce((s, o) => s + Number(o.qty_output ?? 0), 0)
  const totalRejected = ops.reduce((s, o) => s + Number(o.qty_rejected ?? 0), 0)

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title={`Operations — ${batch?.batch_number ?? ''}`}
        description={`${batch?.product?.code} — ${batch?.product?.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"
              onClick={() => navigate(`/dashboard/production/${batchId}`)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Batch
            </Button>
            <Button variant="secondary" size="sm" onClick={load}
              leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            {batch?.status !== 'closed' && (
              <Button size="sm" onClick={() => { setEditingOp(null); setFormOpen(true) }}
                leftIcon={<Plus className="h-4 w-4" />}>
                Add Operation
              </Button>
            )}
          </div>
        }
      />

      {/* Progress summary */}
      {totalOps > 0 && (
        <Card padded bordered>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-surface-600">Overall Progress</span>
                <span className="font-semibold text-surface-900">{completedOps}/{totalOps} operations</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-surface-400">{progressPct}% complete</p>
            </div>
            <div className="flex gap-6 text-sm shrink-0">
              <div>
                <p className="text-xs text-surface-400">Total Produced</p>
                <p className="font-bold text-green-700">{fmt(totalProduced, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Total Rejected</p>
                <p className={`font-bold ${totalRejected > 0 ? 'text-red-600' : 'text-surface-400'}`}>
                  {fmt(totalRejected, 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Operations list */}
      {ops.length === 0 ? (
        <Card padded bordered>
          <div className="py-12 text-center">
            <ClipboardList className="h-10 w-10 text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-500">No operations added yet.</p>
            <p className="text-xs text-surface-400 mt-1">
              Add operations to track every step of the manufacturing process.
            </p>
            {batch?.status !== 'closed' && (
              <Button size="sm" className="mt-4"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setFormOpen(true)}>
                Add First Operation
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {ops.map(op => (
            <OperationCard
              key={op.id}
              op={op}
              machines={machines}
              onEdit={r => { setEditingOp(r); setFormOpen(true) }}
              onDelete={r => setDeleteTarget(r)}
              onTransition={(r, action) => setTransition({ op: r, action })}
              onAddEntry={r => setEntryTarget(r)}
              onToggleEntries={toggleEntries}
              showEntries={expandedOps.has(op.id)}
              addEntryLoading={entryLoading}
              transitionLoading={transLoading}
              activeTransition={transition?.action}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <OperationForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingOp(null) }}
        onSubmit={handleFormSubmit}
        initial={editingOp}
        loading={formLoading}
        machines={machines}
      />

      <TransitionOperationModal
        open={!!transition}
        transition={transition?.action}
        operation={transition?.op}
        onClose={() => setTransition(null)}
        onConfirm={handleTransition}
        loading={transLoading}
        machines={machines}
      />

      {/* Production entry form is inside ProductionEntriesPanel, but also available
          via the "Add Entry" button on each card */}
      {entryTarget && (
        <div style={{ display: 'none' }} />  // placeholder — actual form rendered below
      )}

      <ProductionEntryForm
        open={!!entryTarget}
        onClose={() => setEntryTarget(null)}
        operation={entryTarget}
        onSubmit={handleAddEntry}
        loading={entryLoading}
        machines={machines}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Operation?"
        message={`"${deleteTarget?.operation_type?.name}" will be permanently removed from this batch.`}
      />
    </div>
  )
}
