import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate }          from 'react-router-dom'
import toast                               from 'react-hot-toast'
import {
  ArrowLeft, RefreshCw, Pencil, Trash2,
  Package, Clock, BarChart3, AlertTriangle,
  ClipboardList, ChevronRight, ClipboardCheck,
} from 'lucide-react'

import { productionService }      from '@/services/productionService'
import { manufacturingService }   from '@/services/manufacturingService'
import { qualityService }         from '@/services/qualityService'
import { BatchStatusBadge }       from '@/components/production/BatchStatusBadge'
import { LifecycleTimeline }      from '@/components/production/LifecycleTimeline'
import { OperationStatusBadge }   from '@/components/manufacturing/OperationStatusBadge'
import { TransitionModal }        from './TransitionModal'
import { BatchForm }              from './BatchForm'
import { ConfirmDialog }          from '@/components/common/ConfirmDialog'
import { Button }                 from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge }                  from '@/components/ui/Badge'
import { Spinner }                from '@/components/ui/Spinner'
import { AVAILABLE_TRANSITIONS, BATCH_STATUS } from '@/constants/batchStatus'

// ─── small helper ────────────────────────────────────────────
function fmt(n, digits = 3) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
function fmtCurr(n) {
  if (n == null) return '—'
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN')
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN')
}

function StatCard({ icon: Icon, color, bg, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-surface-200 px-4 py-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="text-lg font-bold text-surface-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-surface-400">{sub}</p>}
      </div>
    </div>
  )
}

export function BatchDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [batch,         setBatch]         = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [editOpen,      setEditOpen]      = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [deleteOpen,    setDeleteOpen]    = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [transition,    setTransition]    = useState(null)   // { to, label }
  const [transLoading,  setTransLoading]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productionService.getById(id)
      setBatch(data)
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load batch.')
      navigate('/dashboard/production')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // ── Edit ──────────────────────────────────────────────────
  async function handleEdit(payload) {
    setSaving(true)
    try {
      await productionService.update(id, payload)
      toast.success('Batch updated.')
      setEditOpen(false)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      await productionService.remove(id)
      toast.success('Batch deleted.')
      navigate('/dashboard/production')
    } catch (err) {
      toast.error(err.userMessage ?? 'Delete failed.')
      setDeleting(false)
    }
  }

  // ── Lifecycle transition ──────────────────────────────────
  async function handleTransition({ notes, actual_qty_produced, actual_qty_scrapped }) {
    setTransLoading(true)
    try {
      const updated = await productionService.transition(id, {
        to_status: transition.to,
        notes,
        actual_qty_produced: actual_qty_produced ? +actual_qty_produced : undefined,
        actual_qty_scrapped: actual_qty_scrapped ? +actual_qty_scrapped : undefined,
      })
      setBatch(updated)
      setTransition(null)
      toast.success(`Batch moved to "${transition.label}".`)
    } catch (err) {
      toast.error(err.userMessage ?? 'Transition failed.')
    } finally {
      setTransLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!batch) return null

  const transitions = AVAILABLE_TRANSITIONS[batch.status] ?? []
  const canEdit     = batch.status === BATCH_STATUS.CREATED
  const canDelete   = batch.status === BATCH_STATUS.CREATED

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/production')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-surface-900 truncate">{batch.batch_number}</h1>
              <BatchStatusBadge status={batch.status} size="md" />
              <Badge variant="default">Priority {batch.priority}</Badge>
            </div>
            <p className="text-sm text-surface-500 mt-0.5">
              {batch.product?.code} — {batch.product?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}
              leftIcon={<Pencil className="h-4 w-4" />}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}>
              Delete
            </Button>
          )}
          {/* Lifecycle action buttons */}
          {transitions.map(t => (
            <Button key={t.to} variant={t.variant} size="sm"
              onClick={() => setTransition(t)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}   color="text-primary-600" bg="bg-primary-50"
          label="Planned Qty"    value={`${fmt(batch.planned_qty, 0)} ${batch.uom}`} />
        <StatCard icon={BarChart3} color="text-green-600"   bg="bg-green-50"
          label="Expected Yield" value={`${fmt(batch.expected_yield_qty, 3)} ${batch.uom}`}
          sub={batch.actual_qty_produced != null ? `Actual: ${fmt(batch.actual_qty_produced, 3)}` : undefined} />
        <StatCard icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50"
          label="Expected Scrap" value={`${fmt(batch.expected_scrap_qty, 3)} ${batch.uom}`}
          sub={batch.actual_qty_scrapped != null ? `Actual: ${fmt(batch.actual_qty_scrapped, 3)}` : undefined} />
        <StatCard icon={Clock}     color="text-purple-600"  bg="bg-purple-50"
          label="Est. Total Time" value={`${fmt(batch.estimated_total_time_min, 0)} min`}
          sub={`Setup ${fmt(batch.estimated_setup_time_min, 0)} + Cycle ${fmt(batch.estimated_cycle_time_min, 0)}`} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: details + reservations */}
        <div className="lg:col-span-2 space-y-5">

          {/* Planning Details */}
          <Card>
            <CardHeader><CardTitle>Planning Details</CardTitle></CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <Detail label="BOM Version"      value={`v${batch.bom?.version ?? '—'}`} />
                <Detail label="Planned Start"    value={fmtDate(batch.planned_start_date)} />
                <Detail label="Planned End"      value={fmtDate(batch.planned_end_date)} />
                <Detail label="Actual Start"     value={fmtDateTime(batch.actual_start_at)} />
                <Detail label="Actual End"       value={fmtDateTime(batch.actual_end_at)} />
                <Detail label="Machine"          value={batch.machine?.name ?? '—'} />
                <Detail label="Output Warehouse" value={batch.warehouse?.name ?? '—'} />
                <Detail label="Est. Mat. Cost"   value={fmtCurr(batch.estimated_material_cost)} />
                <Detail label="Created"          value={fmtDateTime(batch.created_at)} />
              </dl>
              {batch.notes && (
                <p className="mt-4 text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">
                  {batch.notes}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Material Reservations */}
          <Card>
            <CardHeader>
              <CardTitle>Material Reservations</CardTitle>
              <span className="text-xs text-surface-500">{batch.reservations?.length ?? 0} lines</span>
            </CardHeader>
            <CardBody className="p-0">
              {!batch.reservations?.length ? (
                <p className="text-sm text-surface-400 text-center py-8">
                  No materials reserved yet. Transition to "Reserved" to lock stock.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 border-b border-surface-200">
                      <tr>
                        {['Material','Required','Reserved','Issued','UOM','Status'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {batch.reservations.map(r => (
                        <tr key={r.id} className="hover:bg-surface-50">
                          <td className="px-4 py-2.5 font-medium text-surface-900">
                            {r.raw_material?.code} — {r.raw_material?.name}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">{fmt(r.required_qty)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{fmt(r.reserved_qty)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{fmt(r.issued_qty)}</td>
                          <td className="px-4 py-2.5">{r.uom}</td>
                          <td className="px-4 py-2.5">
                            <ReservationBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* BOM Lines reference */}
          {batch.bom?.items?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>BOM Reference</CardTitle>
                <span className="text-xs text-surface-500">{batch.bom.items.length} material lines</span>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 border-b border-surface-200">
                      <tr>
                        {['Material','Qty/Unit','UOM','Scrap %','Total Needed'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {batch.bom.items.map(item => {
                        const totalNeeded = +(item.quantity_required) * +(batch.planned_qty) * (1 + +(item.scrap_allowance_pct ?? 0) / 100)
                        const available   = +(item.raw_material?.current_stock_qty ?? 0)
                        const shortage    = available < totalNeeded
                        return (
                          <tr key={item.id} className={shortage ? 'bg-red-50' : 'hover:bg-surface-50'}>
                            <td className="px-4 py-2.5 font-medium text-surface-900">
                              {item.raw_material?.code} — {item.raw_material?.name}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">{fmt(item.quantity_required)}</td>
                            <td className="px-4 py-2.5">{item.uom}</td>
                            <td className="px-4 py-2.5 tabular-nums">{item.scrap_allowance_pct ?? 0}%</td>
                            <td className={`px-4 py-2.5 tabular-nums font-medium ${shortage ? 'text-red-600' : ''}`}>
                              {fmt(totalNeeded)} {item.uom}
                              {shortage && <span className="ml-1 text-xs">(⚠ only {fmt(available)} avail.)</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
          {/* ── Manufacturing Operations summary ── */}
          <OperationsSummaryCard batchId={id} batchStatus={batch.status} navigate={navigate} />

          {/* ── Quality Inspection summary ── */}
          <QualityInspectionCard batchId={id} batchStatus={batch.status} navigate={navigate} />

        </div>

        {/* Right: lifecycle timeline */}
        <div>
          <Card className="sticky top-6">
            <CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader>
            <CardBody>
              <LifecycleTimeline
                currentStatus={batch.status}
                logs={batch.lifecycle_logs ?? []}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}
      <BatchForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        initial={batch}
        loading={saving}
      />

      <TransitionModal
        open={!!transition}
        transition={transition}
        onClose={() => setTransition(null)}
        onConfirm={handleTransition}
        loading={transLoading}
        batchStatus={batch.status}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Production Batch?"
        message={`Batch "${batch.batch_number}" will be permanently deleted. This cannot be undone.`}
      />
    </div>
  )
}

// ── Small sub-components ──────────────────────────────────────
function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-surface-400 mb-0.5">{label}</dt>
      <dd className="font-medium text-surface-900">{value ?? '—'}</dd>
    </div>
  )
}

const RESERVATION_VARIANTS = {
  reserved:  'info',
  issued:    'primary',
  returned:  'success',
  cancelled: 'default',
}
function ReservationBadge({ status }) {
  return (
    <Badge variant={RESERVATION_VARIANTS[status] ?? 'default'}>
      {status}
    </Badge>
  )
}

// ── Operations summary card (live, fetches its own data) ──────
function OperationsSummaryCard({ batchId, batchStatus, navigate }) {
  const [ops,     setOps]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await manufacturingService.getOperationsByBatch(batchId)
      setOps(data ?? [])
    } catch {
      // Silent — ops section is supplementary
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => { load() }, [load])

  const total     = ops.length
  const completed = ops.filter(o => o.status === 'completed').length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary-600" aria-hidden="true" />
          <CardTitle>Manufacturing Operations</CardTitle>
          {total > 0 && (
            <Badge variant="default">{completed}/{total}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/manufacturing/${batchId}/operations`)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          {total === 0 ? 'Add Operations' : 'Manage'}
        </Button>
      </CardHeader>

      <CardBody>
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        ) : total === 0 ? (
          <div className="py-6 text-center">
            <ClipboardList className="h-8 w-8 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">No operations added yet.</p>
            {batchStatus !== 'closed' && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => navigate(`/dashboard/manufacturing/${batchId}/operations`)}
              >
                Add Operations
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-surface-500">
                <span>Progress</span>
                <span className="font-medium text-surface-700">{pct}% complete</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-100 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Operation rows */}
            <div className="space-y-1.5">
              {ops.slice(0, 6).map(op => (
                <div key={op.id} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-surface-50 text-sm">
                  <span className="text-xs text-surface-400 w-5 text-center font-medium shrink-0">
                    {op.sequence_no ?? '—'}
                  </span>
                  <span className="flex-1 font-medium text-surface-800 truncate">
                    {op.operation_type?.name ?? op.operation_code}
                  </span>
                  {op.qty_output > 0 && (
                    <span className="text-xs text-green-700 tabular-nums shrink-0">
                      {Number(op.qty_output).toLocaleString('en-IN', { maximumFractionDigits: 0 })} pcs
                    </span>
                  )}
                  <OperationStatusBadge status={op.status} size="sm" />
                </div>
              ))}
              {ops.length > 6 && (
                <p className="text-xs text-surface-400 text-center pt-1">
                  +{ops.length - 6} more operations
                </p>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// ── Quality Inspection summary card ──────────────────────────
function QualityInspectionCard({ batchId, batchStatus, navigate }) {
  const [checks,   setChecks]   = useState([])
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [checksData, summaryData] = await Promise.all([
        qualityService.getByBatch(batchId),
        qualityService.getCompletionSummary(batchId).catch(() => null),
      ])
      setChecks(checksData ?? [])
      setSummary(summaryData)
    } catch {
      // Silent — quality section is supplementary on this page
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => { load() }, [load])

  const totalPassed   = checks.reduce((s, c) => s + Number(c.qty_passed   ?? 0), 0)
  const totalRejected = checks.reduce((s, c) => s + Number(c.qty_rejected  ?? 0), 0)
  const totalInspected = checks.reduce((s, c) => s + Number(c.qty_inspected ?? 0), 0)
  const passRate = totalInspected > 0
    ? ((totalPassed / totalInspected) * 100).toFixed(1)
    : null

  // Show the card on inspection status and beyond
  const showQc = [
    'inspection', 'completed', 'closed',
  ].includes(batchStatus)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <CardTitle>Quality Inspection</CardTitle>
          {checks.length > 0 && (
            <Badge variant="info">{checks.length} check{checks.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/quality/batches/${batchId}/inspections`)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          {checks.length === 0 ? 'Start Inspection' : 'View All'}
        </Button>
      </CardHeader>

      <CardBody>
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        ) : checks.length === 0 ? (
          <div className="py-6 text-center">
            <ClipboardCheck className="h-8 w-8 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">No quality checks recorded yet.</p>
            {showQc && batchStatus !== 'closed' && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => navigate(`/dashboard/quality/batches/${batchId}/inspections`)}
              >
                Create Inspection
              </Button>
            )}
            {!showQc && (
              <p className="text-xs text-surface-400 mt-1">
                Available once batch reaches Inspection status.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pass rate bar */}
            {passRate && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-surface-500">
                  <span>Pass Rate</span>
                  <span className="font-medium text-green-700">{passRate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${passRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* QC totals */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                <p className="text-xs text-green-600">Passed</p>
                <p className="font-bold text-green-800">
                  {Number(totalPassed).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 px-3 py-2 text-center">
                <p className="text-xs text-red-600">Rejected</p>
                <p className="font-bold text-red-800">
                  {Number(totalRejected).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg bg-surface-50 px-3 py-2 text-center">
                <p className="text-xs text-surface-500">Inspected</p>
                <p className="font-bold text-surface-800">
                  {Number(totalInspected).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Completion KPIs (if available) */}
            {summary && (
              <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-3 grid grid-cols-2 gap-2 text-xs">
                <KpiLine label="Yield"         value={summary.yield_pct         != null ? `${Number(summary.yield_pct).toFixed(1)}%`          : '—'} />
                <KpiLine label="Rejection"     value={summary.rejection_pct     != null ? `${Number(summary.rejection_pct).toFixed(1)}%`      : '—'} />
                <KpiLine label="Scrap"         value={summary.scrap_pct         != null ? `${Number(summary.scrap_pct).toFixed(1)}%`          : '—'} />
                <KpiLine label="Material Util" value={summary.material_utilization_pct != null ? `${Number(summary.material_utilization_pct).toFixed(1)}%` : '—'} />
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function KpiLine({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-surface-500">{label}</span>
      <span className="font-semibold text-surface-800">{value}</span>
    </div>
  )
}
