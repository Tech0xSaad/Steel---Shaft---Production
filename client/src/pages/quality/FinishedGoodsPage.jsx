import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  RefreshCw, Plus, ArrowDownCircle, ArrowUpCircle,
  Truck, Package, AlertCircle, ClipboardList,
} from 'lucide-react'

import { finishedGoodsService } from '@/services/finishedGoodsService'
import { apiClient }            from '@/api/axiosClient'
import { PageHeader }           from '@/components/common/PageHeader'
import { Pagination }           from '@/components/common/Pagination'
import { Button }               from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Spinner }              from '@/components/ui/Spinner'
import { FgMovementBadge }      from '@/components/quality/FgMovementBadge'
import { FgMovementForm }       from './modals/FgMovementForm'

// ─── helpers ─────────────────────────────────────────────────
function fmt(n, d = 0) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtCurr(n) {
  if (n == null) return '—'
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const PAGE_SIZE = 15

// ─── Stock tab ────────────────────────────────────────────────
function StockTab({ products, warehouses }) {
  const [positions, setPositions]   = useState([])
  const [meta,      setMeta]        = useState(null)
  const [loading,   setLoading]     = useState(true)
  const [page,      setPage]        = useState(1)
  const [movMode,   setMovMode]     = useState(null)  // 'adjust_in' | 'adjust_out' | 'dispatch'
  const [saving,    setSaving]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await finishedGoodsService.listPositions({ page, pageSize: PAGE_SIZE })
      setPositions(result.data ?? [])
      setMeta(result.meta)
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load FG stock.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleMovement(payload) {
    setSaving(true)
    try {
      if (movMode === 'adjust_in')  await finishedGoodsService.adjustIn(payload)
      if (movMode === 'adjust_out') await finishedGoodsService.adjustOut(payload)
      if (movMode === 'dispatch')   await finishedGoodsService.dispatch(payload)
      toast.success('FG movement recorded.')
      setMovMode(null)
      load()
    } catch (err) {
      toast.error(err.userMessage ?? 'Movement failed.')
    } finally {
      setSaving(false)
    }
  }

  const totalValue = positions.reduce((s, p) => {
    return s + Number(p.qty_on_hand ?? 0) * Number(p.unit_cost ?? 0)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button size="sm" variant="primary"
            leftIcon={<ArrowDownCircle className="h-4 w-4" />}
            onClick={() => setMovMode('adjust_in')}>
            Adjust In
          </Button>
          <Button size="sm" variant="secondary"
            leftIcon={<ArrowUpCircle className="h-4 w-4" />}
            onClick={() => setMovMode('adjust_out')}>
            Adjust Out
          </Button>
          <Button size="sm" variant="secondary"
            leftIcon={<Truck className="h-4 w-4" />}
            onClick={() => setMovMode('dispatch')}>
            Dispatch
          </Button>
        </div>
        <Button size="sm" variant="ghost"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={load}>
          Refresh
        </Button>
      </div>

      {/* Total value banner */}
      {!loading && positions.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
          <Package className="h-5 w-5 text-green-600 shrink-0" />
          <span className="text-sm text-green-800">
            Total FG Stock Value: <span className="font-bold">{fmtCurr(totalValue)}</span>
            <span className="ml-3 text-green-600">across {positions.length} product line{positions.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
      )}

      {/* Positions table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-surface-500">No finished goods in stock yet.</p>
            <p className="text-xs text-surface-400 mt-1">Stock appears here after QC approvals move qty to finished goods.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  {['Product', 'Warehouse', 'On Hand', 'Available', 'Reserved', 'Dispatched', 'Unit Cost', 'Stock Value'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {positions.map(p => {
                  const available = Math.max(0, Number(p.qty_on_hand) - Number(p.qty_reserved))
                  return (
                    <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-surface-900">{p.product?.name ?? '—'}</p>
                        <p className="text-xs text-surface-400">{p.product?.code}</p>
                      </td>
                      <td className="px-4 py-3 text-surface-600">
                        {p.warehouse?.name ?? <span className="text-surface-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold">{fmt(p.qty_on_hand)} <span className="text-xs text-surface-400">{p.uom}</span></td>
                      <td className="px-4 py-3 text-green-700 font-semibold">{fmt(available)}</td>
                      <td className="px-4 py-3 text-yellow-700">{fmt(p.qty_reserved)}</td>
                      <td className="px-4 py-3 text-surface-500">{fmt(p.qty_dispatched)}</td>
                      <td className="px-4 py-3">{fmtCurr(p.unit_cost)}</td>
                      <td className="px-4 py-3 font-semibold">{fmtCurr(Number(p.qty_on_hand) * Number(p.unit_cost ?? 0))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}

      <FgMovementForm
        open={!!movMode}
        onClose={() => setMovMode(null)}
        onSubmit={handleMovement}
        saving={saving}
        mode={movMode}
        products={products}
        warehouses={warehouses}
      />
    </div>
  )
}

// ─── Ledger tab ───────────────────────────────────────────────
function LedgerTab() {
  const [txns,    setTxns]    = useState([])
  const [meta,    setMeta]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await finishedGoodsService.listTransactions({ page, pageSize: PAGE_SIZE })
      setTxns(result.data ?? [])
      setMeta(result.meta)
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to load FG ledger.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={load}>
          Refresh
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-surface-500">No finished goods transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  {['Date', 'Product', 'Movement', 'Qty', 'Before', 'After', 'Batch', 'Reference', 'Cost'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {txns.map(t => (
                  <tr key={t.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-surface-500">{fmtDateTime(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.product?.name ?? '—'}</p>
                      <p className="text-xs text-surface-400">{t.product?.code}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <FgMovementBadge movementType={t.movement_type} />
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {fmt(t.quantity)} <span className="text-xs text-surface-400">{t.uom}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-surface-500">{fmt(t.balance_before)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{fmt(t.balance_after)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.batch?.batch_number
                        ? <span className="text-primary-600 text-xs font-medium">{t.batch.batch_number}</span>
                        : <span className="text-surface-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-surface-500 text-xs">{t.reference_number ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.total_cost > 0 ? fmtCurr(t.total_cost) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export function FinishedGoodsPage() {
  const [activeTab, setActiveTab] = useState('stock')
  const [products,  setProducts]  = useState([])
  const [warehouses, setWarehouses] = useState([])

  useEffect(() => {
    // Pre-load products and warehouses for movement forms
    Promise.all([
      apiClient.get('/products', { params: { pageSize: 200 } }).then(r => r.data.data ?? []),
      apiClient.get('/warehouses', { params: { pageSize: 100 } }).then(r => r.data.data ?? []),
    ]).then(([prods, whs]) => {
      setProducts(prods)
      setWarehouses(whs)
    }).catch(() => {})
  }, [])

  const tabs = [
    { id: 'stock',  label: 'Stock Positions' },
    { id: 'ledger', label: 'Transaction Ledger' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finished Goods Inventory"
        subtitle="Completed shafts approved through QC and ready for dispatch"
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'stock'  && <StockTab  products={products} warehouses={warehouses} />}
      {activeTab === 'ledger' && <LedgerTab />}
    </div>
  )
}
