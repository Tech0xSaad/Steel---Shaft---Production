import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link }     from 'react-router-dom'
import toast                                from 'react-hot-toast'
import {
  ArrowLeft, Plus, RefreshCw, ClipboardCheck,
  CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react'

import { qualityService }       from '@/services/qualityService'
import { PageHeader }           from '@/components/common/PageHeader'
import { ConfirmDialog }        from '@/components/common/ConfirmDialog'
import { Button }               from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge }                from '@/components/ui/Badge'
import { Spinner }              from '@/components/ui/Spinner'
import { InspectionStatusBadge } from '@/components/quality/InspectionStatusBadge'
import { ScrapCategoryBadge }   from '@/components/quality/ScrapCategoryBadge'
import { QualityCheckForm }     from './modals/QualityCheckForm'
import { SubmitResultModal }    from './modals/SubmitResultModal'
import { INSPECTION_STATUS }    from '@/constants/qualityTypes'

// ── helpers ──────────────────────────────────────────────────
function fmt(n, d = 0) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-surface-200 px-4 py-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="text-lg font-bold text-surface-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-surface-400">{sub}</p>}
      </div>
    </div>
  )
}

function CheckCard({ check, onSubmit, onDelete, submitLoading, activeId }) {
  const canSubmit = check.status === INSPECTION_STATUS.PENDING ||
                    check.status === INSPECTION_STATUS.IN_PROGRESS
  const canDelete = check.status === INSPECTION_STATUS.PENDING

  const passRate = Number(check.qty_inspected) > 0 && Number(check.qty_passed) > 0
    ? ((Number(check.qty_passed) / Number(check.qty_inspected)) * 100).toFixed(1)
    : null

  return (
    <Card padded bordered className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-100 text-xs font-bold text-surface-600">
            #{check.check_number}
          </span>
          <div>
            <p className="font-semibold text-surface-900">
              {check.inspector_name || 'Inspector not set'}
            </p>
            <p className="text-xs text-surface-400">{fmtDate(check.inspection_date)}</p>
          </div>
        </div>
        <InspectionStatusBadge status={check.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-surface-400">Inspected</p>
          <p className="font-semibold">{fmt(check.qty_inspected)}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400">Passed</p>
          <p className="font-semibold text-green-700">{fmt(check.qty_passed)}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400">Rejected</p>
          <p className={`font-semibold ${Number(check.qty_rejected) > 0 ? 'text-red-600' : ''}`}>
            {fmt(check.qty_rejected)}
          </p>
        </div>
        <div>
          <p className="text-xs text-surface-400">On Hold</p>
          <p className={`font-semibold ${Number(check.qty_on_hold) > 0 ? 'text-yellow-600' : ''}`}>
            {fmt(check.qty_on_hold)}
          </p>
        </div>
      </div>

      {passRate && (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full bg-surface-100 h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <span className="text-xs text-surface-500 shrink-0">{passRate}% pass</span>
        </div>
      )}

      {check.rejection_reasons?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {check.rejection_reasons.map((r, i) => (
            <span key={i} className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
              {r}
            </span>
          ))}
        </div>
      )}

      {check.report_reference && (
        <p className="text-xs text-surface-400">Ref: {check.report_reference}</p>
      )}

      <div className="flex gap-2 pt-1 border-t border-surface-100">
        {canSubmit && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<ClipboardCheck className="h-3.5 w-3.5" />}
            loading={submitLoading && activeId === check.id}
            onClick={() => onSubmit(check)}
          >
            Submit Result
          </Button>
        )}
        {canDelete && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(check)}
          >
            Delete
          </Button>
        )}
      </div>
    </Card>
  )
}

export function InspectionsPage() {
  const { batchId } = useParams()
  const navigate    = useNavigate()

  const [checks,         setChecks]         = useState([])
  const [batch,          setBatch]          = useState(null)
  const [summary,        setSummary]        = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [createOpen,     setCreateOpen]     = useState(false)
  const [creating,       setCreating]       = useState(false)
  const [submitOpen,     setSubmitOpen]     = useState(false)
  const [submitting,     setSubmitting]     = useState(false)
  const [activeCheck,    setActiveCheck]    = useState(null)
  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [checksData, summaryData] = await Promise.all([
        qualityService.getByBatch(batchId),
        qualityService.getCompletionSummary(batchId).catch(() => null),
      ])
      setChecks(checksData)
      setSummary(summaryData)
      if (checksData.length > 0) {
        setBatch(checksData[0].batch)
      }
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load quality checks.')
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => { load() }, [load])

  async function handleCreate(payload) {
    setCreating(true)
    try {
      await qualityService.create(batchId, payload)
      toast.success('Quality check created.')
      setCreateOpen(false)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to create quality check.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSubmitResult(payload) {
    if (!activeCheck) return
    setSubmitting(true)
    try {
      await qualityService.submitResult(activeCheck.id, payload)
      toast.success('Inspection result submitted.')
      setSubmitOpen(false)
      setActiveCheck(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to submit result.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await qualityService.delete(deleteTarget.id)
      toast.success('Quality check deleted.')
      setDeleteOpen(false)
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const totalPassed   = checks.reduce((s, c) => s + Number(c.qty_passed   ?? 0), 0)
  const totalRejected = checks.reduce((s, c) => s + Number(c.qty_rejected  ?? 0), 0)
  const totalOnHold   = checks.reduce((s, c) => s + Number(c.qty_on_hold   ?? 0), 0)
  const totalInspected = checks.reduce((s, c) => s + Number(c.qty_inspected ?? 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Inspection"
        subtitle={batch ? `Batch: ${batch.batch_number}` : `Batch: ${batchId}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(`/dashboard/production/${batchId}`)}
            >
              Back to Batch
            </Button>
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
              New Check
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={ClipboardCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Inspected"
          value={fmt(totalInspected)}
          sub={`${checks.length} check${checks.length !== 1 ? 's' : ''}`}
        />
        <KpiCard
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          label="Passed"
          value={fmt(totalPassed)}
          sub={totalInspected > 0 ? `${((totalPassed / totalInspected) * 100).toFixed(1)}%` : '—'}
        />
        <KpiCard
          icon={XCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          label="Rejected"
          value={fmt(totalRejected)}
          sub={totalInspected > 0 ? `${((totalRejected / totalInspected) * 100).toFixed(1)}%` : '—'}
        />
        <KpiCard
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
          label="On Hold"
          value={fmt(totalOnHold)}
          sub="awaiting decision"
        />
      </div>

      {/* Completion summary (if available) */}
      {summary && (
        <Card padded bordered>
          <CardHeader>
            <CardTitle>Batch Completion Summary</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Metric label="Yield %"          value={summary.yield_pct != null ? `${Number(summary.yield_pct).toFixed(1)}%` : '—'} />
              <Metric label="Rejection %"      value={summary.rejection_pct != null ? `${Number(summary.rejection_pct).toFixed(1)}%` : '—'} />
              <Metric label="Scrap %"          value={summary.scrap_pct != null ? `${Number(summary.scrap_pct).toFixed(1)}%` : '—'} />
              <Metric label="Material Util. %" value={summary.material_utilization_pct != null ? `${Number(summary.material_utilization_pct).toFixed(1)}%` : '—'} />
              <Metric label="Planned Qty"      value={fmt(summary.planned_qty)} />
              <Metric label="Qty Produced"     value={fmt(summary.qty_produced)} />
              <Metric label="Moved to FG"      value={fmt(summary.qty_moved_to_fg)} />
              <Metric label="Total Scrapped"   value={fmt(summary.qty_scrapped)} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Checks list */}
      {checks.length === 0 ? (
        <Card padded>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-surface-500">No quality checks yet for this batch.</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create First Check
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {checks.map(check => (
            <CheckCard
              key={check.id}
              check={check}
              submitLoading={submitting}
              activeId={activeCheck?.id}
              onSubmit={c => { setActiveCheck(c); setSubmitOpen(true) }}
              onDelete={c => { setDeleteTarget(c); setDeleteOpen(true) }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <QualityCheckForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        saving={creating}
        batchId={batchId}
      />

      <SubmitResultModal
        open={submitOpen}
        onClose={() => { setSubmitOpen(false); setActiveCheck(null) }}
        onSubmit={handleSubmitResult}
        saving={submitting}
        check={activeCheck}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Quality Check"
        description="This quality check will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs text-surface-400">{label}</p>
      <p className="font-semibold text-surface-900">{value}</p>
    </div>
  )
}
