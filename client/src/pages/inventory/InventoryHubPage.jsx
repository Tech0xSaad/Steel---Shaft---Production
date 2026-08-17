import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, BookOpen, Layers, ArrowRight,
  TrendingDown, AlertTriangle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { PageHeader }   from '@/components/common/PageHeader'
import { Badge }        from '@/components/ui/Badge'
import { inventoryService } from '@/services/inventoryService'

const MODULES = [
  {
    icon:    Package,
    color:   'text-primary-600',
    bg:      'bg-primary-50',
    label:   'Stock Positions',
    desc:    'View total, available, reserved and WIP quantities for every raw material.',
    path:    '/dashboard/inventory/stock',
    primary: true,
  },
  {
    icon:    BookOpen,
    color:   'text-green-600',
    bg:      'bg-green-50',
    label:   'Inventory Ledger',
    desc:    'Immutable transaction history — every movement recorded and traceable.',
    path:    '/dashboard/inventory/ledger',
    primary: true,
  },
  {
    icon:    Layers,
    color:   'text-amber-600',
    bg:      'bg-amber-50',
    label:   'Work In Progress',
    desc:    'Track material issued to the shop floor per production batch.',
    path:    '/dashboard/inventory/wip',
    primary: true,
  },
]

export function InventoryHubPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    inventoryService.getAlerts()
      .then(d => setAlerts(d ?? []))
      .catch(() => {})
  }, [])

  const belowMin  = alerts.filter(a => a.alert_type === 'below_minimum')
  const reorder   = alerts.filter(a => a.alert_type === 'reorder_point')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track every kilogram — receive, reserve, issue, return and scrap raw materials."
      />

      {/* Alert summary bar */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {belowMin.length > 0 && (
            <button
              onClick={() => navigate('/dashboard/inventory/stock?low_stock_only=true')}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              {belowMin.length} material{belowMin.length !== 1 ? 's' : ''} below minimum stock
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {reorder.length > 0 && (
            <button
              onClick={() => navigate('/dashboard/inventory/stock?low_stock_only=true')}
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <TrendingDown className="h-4 w-4" />
              {reorder.length} material{reorder.length !== 1 ? 's' : ''} need reorder
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(({ icon: Icon, color, bg, label, desc, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
          >
            <Card padded bordered className="h-full transition-shadow duration-150 group-hover:shadow-md group-hover:border-primary-200">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-surface-900">{label}</p>
                    <ArrowRight className="h-4 w-4 text-surface-300 group-hover:text-primary-500 transition-colors shrink-0" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-xs text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {/* Active alerts detail */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Stock Alerts</CardTitle>
            <Badge variant="danger">{alerts.length}</Badge>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-200">
                  <tr>
                    {['Material', 'Alert', 'Current Qty', 'Threshold', 'Since'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {alerts.map(a => (
                    <tr key={a.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-medium text-surface-900">
                        {a.raw_material?.code} — {a.raw_material?.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.alert_type === 'below_minimum' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {a.alert_type === 'below_minimum' ? 'Below Minimum' : 'Reorder Point'}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-red-600 font-medium">
                        {Number(a.current_stock_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} {a.raw_material?.uom}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-surface-600">
                        {Number(a.threshold_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} {a.raw_material?.uom}
                      </td>
                      <td className="px-4 py-3 text-surface-500">
                        {new Date(a.triggered_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
