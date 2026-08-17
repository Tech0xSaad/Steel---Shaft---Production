import { useState, useEffect, useCallback } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useAuth }           from '@/context/AuthContext'
import { analyticsService }  from '@/services/analyticsService'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Button }            from '@/components/ui/Button'
import { Badge }             from '@/components/ui/Badge'
import { Spinner }           from '@/components/ui/Spinner'
import {
  Factory, Package, CheckCircle, TrendingUp,
  AlertTriangle, BarChart3, ArrowRight, RefreshCw,
  Layers, Trash2, Boxes, Clock, Activity,
  Database, Cog, ClipboardCheck, ChevronRight,
} from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────

function fmt(n, decimals = 1) {
  if (n == null) return '—'
  const num = Number(n)
  if (isNaN(num)) return '—'
  return num % 1 === 0 ? num.toLocaleString() : num.toFixed(decimals)
}

function pct(n) {
  if (n == null) return '—'
  return `${Number(n).toFixed(1)}%`
}

const BATCH_STATUS_COLOR = {
  created:           'bg-surface-100 text-surface-600',
  reserved:          'bg-blue-100 text-blue-700',
  issued:            'bg-indigo-100 text-indigo-700',
  production_started:'bg-amber-100 text-amber-700',
  in_progress:       'bg-orange-100 text-orange-700',
  inspection:        'bg-purple-100 text-purple-700',
  completed:         'bg-green-100 text-green-700',
  closed:            'bg-surface-200 text-surface-500',
}

const STATUS_LABEL = {
  created:           'Created',
  reserved:          'Reserved',
  issued:            'Issued',
  production_started:'Started',
  in_progress:       'In Progress',
  inspection:        'Inspection',
  completed:         'Completed',
  closed:            'Closed',
}

const ACTIVITY_LABEL = {
  created:           { label: 'Batch created',     color: 'bg-surface-400' },
  reserved:          { label: 'Materials reserved', color: 'bg-blue-500' },
  issued:            { label: 'Materials issued',   color: 'bg-indigo-500' },
  production_started:{ label: 'Production started', color: 'bg-amber-500' },
  in_progress:       { label: 'In progress',        color: 'bg-orange-500' },
  inspection:        { label: 'Sent to inspection', color: 'bg-purple-500' },
  completed:         { label: 'Completed',           color: 'bg-green-500' },
  closed:            { label: 'Closed',              color: 'bg-surface-500' },
}

// ─── sub-components ──────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, onClick, alert }) {
  return (
    <button
      onClick={onClick ?? undefined}
      className={`flex items-center gap-4 bg-white rounded-xl border px-4 py-4 text-left w-full
        transition-shadow border-surface-200
        ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-surface-500 truncate">{label}</p>
        <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-surface-900'}`}>{value}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
      </div>
    </button>
  )
}

function SectionCard({ title, icon: Icon, iconBg, iconColor, onViewAll, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}
            rightIcon={<ArrowRight className="h-4 w-4" />}>
            View all
          </Button>
        )}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  )
}

function StatRow({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-surface-100 last:border-0">
      <span className="text-sm text-surface-600">{label}</span>
      <span className={`text-sm font-semibold ${valueClass || 'text-surface-900'}`}>{value}</span>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────

export function DashboardHome() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const name      = user?.user_metadata?.full_name ?? user?.email ?? 'Admin'

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    analyticsService.getDashboard()
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e?.message ?? 'Failed to load dashboard.'); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  // ── derived values ────────────────────────────────────────────
  const statusCounts   = data?.batch_status_counts      ?? {}
  const running        = data?.running_batches           ?? []
  const recentDone     = data?.recently_completed        ?? []
  const kpis           = data?.production_kpis           ?? {}
  const inv            = data?.inventory_snapshot        ?? {}
  const fg             = data?.finished_goods_snapshot   ?? {}
  const scrapCats      = data?.scrap_by_category         ?? []
  const activity       = data?.recent_activity           ?? []
  const masters        = data?.master_counts             ?? {}

  const activeBatches  = (statusCounts.issued ?? 0)
    + (statusCounts.production_started ?? 0)
    + (statusCounts.in_progress ?? 0)
    + (statusCounts.inspection ?? 0)
  const totalCompleted = statusCounts.completed ?? 0
  const alertCount     = (inv.below_minimum_count ?? 0) + (inv.needs_reorder_count ?? 0)

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Welcome back, {name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Here's your shop-floor overview for today.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white
                     px-3 py-2 text-sm text-surface-600 hover:bg-surface-50 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={load} className="ml-auto font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      {/* ── Top KPI strip ────────────────────────────────────── */}
      {loading && !data ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Factory}
              iconBg="bg-amber-50"  iconColor="text-amber-600"
              label="Active Batches"
              value={loading ? '…' : activeBatches}
              sub={`${totalCompleted} completed total`}
              onClick={() => navigate('/dashboard/production')}
            />
            <KpiCard
              icon={TrendingUp}
              iconBg="bg-green-50"  iconColor="text-green-600"
              label="Avg Yield"
              value={loading ? '…' : pct(kpis.avg_yield_pct)}
              sub={`${fmt(kpis.total_batches_completed, 0)} batches analysed`}
              onClick={() => navigate('/dashboard/reports/batch-summary')}
            />
            <KpiCard
              icon={AlertTriangle}
              iconBg="bg-red-50"  iconColor="text-red-600"
              label="Stock Alerts"
              value={loading ? '…' : alertCount}
              sub={`${inv.below_minimum_count ?? 0} below min · ${inv.needs_reorder_count ?? 0} reorder`}
              onClick={alertCount > 0 ? () => navigate('/dashboard/inventory') : null}
              alert={alertCount > 0}
            />
            <KpiCard
              icon={Boxes}
              iconBg="bg-purple-50"  iconColor="text-purple-600"
              label="Finished Goods"
              value={loading ? '…' : fmt(fg.total_fg_qty, 0)}
              sub={`${fg.total_products_in_stock ?? 0} products in stock`}
              onClick={() => navigate('/dashboard/quality/finished-goods')}
            />
          </div>

          {/* ── Second KPI row ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-4">
            {[
              { label: 'Total Produced',       value: fmt(kpis.total_produced, 0),       icon: Layers,         iconBg: 'bg-sky-50',      iconColor: 'text-sky-600' },
              { label: 'Total Scrapped',        value: fmt(kpis.total_scrapped, 0),       icon: Trash2,         iconBg: 'bg-rose-50',     iconColor: 'text-rose-600' },
              { label: 'Material Utilisation',  value: pct(kpis.avg_material_utilization_pct), icon: Activity,  iconBg: 'bg-teal-50',     iconColor: 'text-teal-600' },
              { label: 'FG Stock Value',        value: `₹${fmt(fg.total_fg_value, 0)}`,  icon: BarChart3,      iconBg: 'bg-indigo-50',   iconColor: 'text-indigo-600' },
            ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
              <div key={label}
                className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">{label}</p>
                  <p className="text-lg font-bold text-surface-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main grid ────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* Running Batches */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Running Batches"
                icon={Factory} iconBg="bg-amber-50" iconColor="text-amber-600"
                onViewAll={() => navigate('/dashboard/production')}
              >
                {running.length === 0 ? (
                  <p className="py-6 text-center text-sm text-surface-400">No active batches right now.</p>
                ) : (
                  <div className="space-y-2">
                    {running.map(b => (
                      <button
                        key={b.id}
                        onClick={() => navigate(`/dashboard/production/${b.id}`)}
                        className="w-full flex items-center justify-between rounded-lg border
                                   border-surface-200 bg-surface-50 px-3 py-2.5 text-left
                                   hover:border-amber-300 hover:bg-amber-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5
                                           text-xs font-medium ${BATCH_STATUS_COLOR[b.status] ?? 'bg-surface-100 text-surface-600'}`}>
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-surface-800 truncate">{b.batch_number}</p>
                            <p className="text-xs text-surface-500 truncate">{b.product?.name ?? '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-surface-500">Planned</p>
                            <p className="text-sm font-medium text-surface-700">{fmt(b.planned_qty, 0)} {b.uom}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-amber-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Batch Status Breakdown */}
            <SectionCard
              title="Batch Status"
              icon={Layers} iconBg="bg-sky-50" iconColor="text-sky-600"
              onViewAll={() => navigate('/dashboard/production')}
            >
              <div className="space-y-1.5">
                {Object.entries(STATUS_LABEL).map(([key, label]) => {
                  const count = statusCounts[key] ?? 0
                  if (count === 0) return null
                  return (
                    <div key={key}
                      className="flex items-center justify-between rounded-lg px-3 py-2
                                 border border-surface-100 bg-surface-50">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5
                                        text-xs font-medium ${BATCH_STATUS_COLOR[key]}`}>
                        {label}
                      </span>
                      <span className="text-sm font-bold text-surface-800">{count}</span>
                    </div>
                  )
                })}
                {Object.values(statusCounts).every(v => v === 0) && (
                  <p className="py-4 text-center text-sm text-surface-400">No batches yet.</p>
                )}
              </div>
            </SectionCard>
          </div>

          {/* ── Second row ───────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* Inventory Snapshot */}
            <SectionCard
              title="Inventory Snapshot"
              icon={Package} iconBg="bg-green-50" iconColor="text-green-600"
              onViewAll={() => navigate('/dashboard/inventory/stock')}
            >
              <StatRow label="Active Materials"    value={fmt(inv.total_active_materials, 0)} />
              <StatRow label="Total Stock Qty"     value={`${fmt(inv.total_stock_qty, 0)} kg`} />
              <StatRow label="Reserved Qty"        value={`${fmt(inv.total_reserved_qty, 0)} kg`} />
              <StatRow label="WIP Qty"             value={`${fmt(inv.total_wip_qty, 0)} kg`} />
              <StatRow label="Total Stock Value"   value={`₹${fmt(inv.total_stock_value, 0)}`} />
              <StatRow
                label="Below Minimum"
                value={inv.below_minimum_count ?? 0}
                valueClass={inv.below_minimum_count > 0 ? 'text-red-600' : 'text-green-600'}
              />
              <StatRow
                label="Needs Reorder"
                value={inv.needs_reorder_count ?? 0}
                valueClass={inv.needs_reorder_count > 0 ? 'text-amber-600' : 'text-green-600'}
              />
            </SectionCard>

            {/* Production KPIs */}
            <SectionCard
              title="Production KPIs"
              icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600"
              onViewAll={() => navigate('/dashboard/reports/batch-summary')}
            >
              <StatRow label="Batches Completed"      value={fmt(kpis.total_batches_completed, 0)} />
              <StatRow label="Total Planned Qty"      value={fmt(kpis.total_planned_qty, 0)} />
              <StatRow label="Total Produced"         value={fmt(kpis.total_produced, 0)} />
              <StatRow label="Total Passed QC"        value={fmt(kpis.total_passed_qc, 0)} />
              <StatRow label="Total Rejected QC"      value={fmt(kpis.total_rejected_qc, 0)} />
              <StatRow label="Avg Yield"              value={pct(kpis.avg_yield_pct)}
                valueClass={Number(kpis.avg_yield_pct ?? 0) >= 90 ? 'text-green-600' : 'text-amber-600'} />
              <StatRow label="Avg Rejection"          value={pct(kpis.avg_rejection_pct)}
                valueClass={Number(kpis.avg_rejection_pct ?? 0) > 5 ? 'text-red-600' : 'text-green-600'} />
            </SectionCard>

            {/* Scrap by Category */}
            <SectionCard
              title="Scrap by Category"
              icon={Trash2} iconBg="bg-rose-50" iconColor="text-rose-600"
              onViewAll={() => navigate('/dashboard/reports/scrap')}
            >
              {scrapCats.length === 0 ? (
                <p className="py-6 text-center text-sm text-surface-400">No scrap recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {scrapCats.slice(0, 6).map(c => (
                    <div key={c.scrap_category}
                      className="flex items-center justify-between py-1.5
                                 border-b border-surface-100 last:border-0">
                      <span className="text-sm text-surface-600 capitalize">
                        {c.scrap_category.replace('_', ' ')}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-surface-800">
                          {fmt(c.total_qty, 2)}
                        </span>
                        <span className="ml-1 text-xs text-surface-400">pcs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Third row ────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* Recent Activity feed */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Recent Activity"
                icon={Activity} iconBg="bg-violet-50" iconColor="text-violet-600"
              >
                {activity.length === 0 ? (
                  <p className="py-6 text-center text-sm text-surface-400">No activity yet.</p>
                ) : (
                  <ol className="space-y-0">
                    {activity.map((evt, i) => {
                      const info = ACTIVITY_LABEL[evt.to_status] ?? { label: evt.to_status, color: 'bg-surface-400' }
                      return (
                        <li key={evt.id} className="flex gap-3">
                          {/* timeline spine */}
                          <div className="flex flex-col items-center">
                            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${info.color}`} />
                            {i < activity.length - 1 && (
                              <span className="w-px grow bg-surface-200 my-0.5" />
                            )}
                          </div>
                          <div className="pb-3 min-w-0">
                            <p className="text-sm text-surface-700">
                              <span className="font-medium">
                                {evt.batch?.batch_number ?? '—'}
                              </span>
                              {' '}
                              <span className="text-surface-500">·</span>
                              {' '}
                              {info.label}
                            </p>
                            <p className="text-xs text-surface-400 truncate">
                              {evt.batch?.product?.name ?? ''}{evt.actor_email ? ` · ${evt.actor_email}` : ''}
                            </p>
                            <p className="text-xs text-surface-400">
                              {new Date(evt.created_at).toLocaleString()}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </SectionCard>
            </div>

            {/* Quick actions + master counts */}
            <div className="space-y-5">
              {/* Master Data counts */}
              <SectionCard
                title="Master Data"
                icon={Database} iconBg="bg-primary-50" iconColor="text-primary-600"
                onViewAll={() => navigate('/dashboard/masters')}
              >
                {[
                  { label: 'Products',      value: masters.products,      path: '/dashboard/masters/products' },
                  { label: 'Raw Materials', value: masters.raw_materials, path: '/dashboard/masters/raw-materials' },
                  { label: 'Machines',      value: masters.machines,      path: '/dashboard/masters/machines' },
                  { label: 'Warehouses',    value: masters.warehouses,    path: '/dashboard/masters/warehouses' },
                ].map(({ label, value, path }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className="w-full flex items-center justify-between rounded-lg border
                               border-surface-200 px-3 py-2 text-left
                               hover:bg-primary-50 hover:border-primary-200 transition-colors">
                    <span className="text-sm text-surface-700">{label}</span>
                    <span className="text-sm font-bold text-surface-900">{fmt(value, 0)}</span>
                  </button>
                ))}
              </SectionCard>

              {/* Quick Links */}
              <SectionCard
                title="Reports"
                icon={BarChart3} iconBg="bg-indigo-50" iconColor="text-indigo-600"
                onViewAll={() => navigate('/dashboard/reports')}
              >
                {[
                  { label: 'Production Report',  path: '/dashboard/reports/production' },
                  { label: 'Inventory Report',   path: '/dashboard/reports/inventory' },
                  { label: 'Scrap Report',       path: '/dashboard/reports/scrap' },
                  { label: 'Batch Summary',      path: '/dashboard/reports/batch-summary' },
                ].map(({ label, path }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className="w-full flex items-center justify-between rounded-lg border
                               border-surface-200 px-3 py-2 text-left
                               hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
                    <span className="text-sm text-surface-700">{label}</span>
                    <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-indigo-500" />
                  </button>
                ))}
              </SectionCard>
            </div>
          </div>

          {/* ── Recently Completed ───────────────────────────── */}
          {recentDone.length > 0 && (
            <SectionCard
              title="Recently Completed Batches"
              icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600"
              onViewAll={() => navigate('/dashboard/reports/batch-summary')}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200">
                      {['Batch', 'Product', 'Planned', 'Produced', 'Passed QC', 'Yield', 'Scrap %', 'Completed'].map(h => (
                        <th key={h} className="pb-2 pr-4 text-left text-xs font-medium text-surface-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentDone.map(r => (
                      <tr key={r.batch_id}
                        className="border-b border-surface-100 last:border-0 hover:bg-surface-50 cursor-pointer"
                        onClick={() => navigate(`/dashboard/production/${r.batch_id}`)}>
                        <td className="py-2 pr-4 font-medium text-surface-800 whitespace-nowrap">
                          {r.batch?.batch_number ?? '—'}
                        </td>
                        <td className="py-2 pr-4 text-surface-600 truncate max-w-[160px]">
                          {r.batch?.product?.name ?? '—'}
                        </td>
                        <td className="py-2 pr-4 text-surface-700">{fmt(r.planned_qty, 0)}</td>
                        <td className="py-2 pr-4 text-surface-700">{fmt(r.qty_produced, 0)}</td>
                        <td className="py-2 pr-4 text-surface-700">{fmt(r.qty_passed_qc, 0)}</td>
                        <td className="py-2 pr-4">
                          <span className={`font-semibold ${Number(r.yield_pct ?? 0) >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                            {pct(r.yield_pct)}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`font-semibold ${Number(r.scrap_pct ?? 0) > 5 ? 'text-red-600' : 'text-surface-700'}`}>
                            {pct(r.scrap_pct)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-surface-500 whitespace-nowrap">
                          {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}
