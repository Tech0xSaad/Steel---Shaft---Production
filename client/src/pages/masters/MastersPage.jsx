import { useNavigate } from 'react-router-dom'
import { Box, FlaskConical, Cog, Warehouse, BookOpen, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/common/PageHeader'

const MODULES = [
  {
    icon: Box,
    color: 'text-primary-600',
    bg:    'bg-primary-50',
    label: 'Product Master',
    desc:  'Finished products with dimensions, standards and production parameters.',
    path:  '/dashboard/masters/products',
  },
  {
    icon: FlaskConical,
    color: 'text-amber-600',
    bg:    'bg-amber-50',
    label: 'Raw Material Master',
    desc:  'Raw materials with grades, stock thresholds, costs and supplier info.',
    path:  '/dashboard/masters/raw-materials',
  },
  {
    icon: Cog,
    color: 'text-green-600',
    bg:    'bg-green-50',
    label: 'Machine Master',
    desc:  'Machines, capacities, maintenance schedules and hourly rates.',
    path:  '/dashboard/masters/machines',
  },
  {
    icon: Warehouse,
    color: 'text-purple-600',
    bg:    'bg-purple-50',
    label: 'Warehouse Master',
    desc:  'Storage locations, types, capacities and contact details.',
    path:  '/dashboard/masters/warehouses',
  },
  {
    icon: BookOpen,
    color: 'text-rose-600',
    bg:    'bg-rose-50',
    label: 'Bill of Materials',
    desc:  'Link products to their required raw materials with quantities and scrap allowances.',
    path:  '/dashboard/masters/bom',
  },
]

export function MastersPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Configure the foundational data that drives production, inventory and costing."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(({ icon: Icon, color, bg, label, desc, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
          >
            <Card
              padded
              bordered
              className="h-full transition-shadow duration-150 group-hover:shadow-md group-hover:border-primary-200"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-surface-900">{label}</p>
                    <ArrowRight
                      className="h-4 w-4 text-surface-300 group-hover:text-primary-500 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1 text-xs text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
