import { useNavigate } from 'react-router-dom'
import { PageHeader }  from '@/components/common/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import {
  Factory, Package, Trash2, BarChart3,
  BookOpen, ArrowRight, RefreshCw, Layers,
} from 'lucide-react'

const REPORTS = [
  {
    key:   'production',
    title: 'Production Report',
    description: 'All batches with planned vs actual quantities, cycle times, yield and efficiency KPIs.',
    icon:  Factory,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    path:  '/dashboard/reports/production',
  },
  {
    key:   'inventory',
    title: 'Inventory Report',
    description: 'Raw material stock levels, reserve quantities, WIP, stock values and reorder alerts.',
    icon:  Package,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    path:  '/dashboard/reports/inventory',
  },
  {
    key:   'scrap',
    title: 'Scrap Report',
    description: 'Scrap records with category, machine, department, weight and cost breakdown.',
    icon:  Trash2,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    path:  '/dashboard/reports/scrap',
  },
  {
    key:   'batch-summary',
    title: 'Batch Summary',
    description: 'Completed batch summary with expected-vs-actual analysis, yield variance and material reconciliation.',
    icon:  BarChart3,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    path:  '/dashboard/reports/batch-summary',
  },
  {
    key:   'material-reconciliation',
    title: 'Material Reconciliation',
    description: 'Period-based material received, issued, returned, adjusted and closing balances.',
    icon:  RefreshCw,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    path:  '/dashboard/reports/material-reconciliation',
  },
  {
    key:   'finished-goods',
    title: 'Finished Goods Report',
    description: 'Finished goods transaction ledger — production receipts, dispatches and adjustments.',
    icon:  Layers,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    path:  '/dashboard/reports/finished-goods',
  },
  {
    key:   'inventory-ledger',
    title: 'Inventory Ledger',
    description: 'Full raw material transaction history — every receive, issue, return and adjustment.',
    icon:  BookOpen,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    path:  '/dashboard/reports/inventory-ledger',
  },
]

export function ReportsPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Production, inventory, scrap, and batch analytics — filter and export."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map(r => (
          <button
            key={r.key}
            onClick={() => navigate(r.path)}
            className="text-left group"
          >
            <Card className="h-full hover:shadow-md transition-shadow border-surface-200
                             group-hover:border-indigo-300">
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.iconBg}`}>
                    <r.icon className={`h-5 w-5 ${r.iconColor}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-surface-800 group-hover:text-indigo-700 transition-colors">
                        {r.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-surface-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                    </div>
                    <p className="mt-1 text-xs text-surface-500 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
