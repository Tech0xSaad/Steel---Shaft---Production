import { useNavigate } from 'react-router-dom'
import { Factory, Layers, ClipboardList, ArrowRight } from 'lucide-react'
import { Card }        from '@/components/ui/Card'
import { PageHeader }  from '@/components/common/PageHeader'

const MODULES = [
  {
    icon:    Factory,
    color:   'text-primary-600',
    bg:      'bg-primary-50',
    label:   'Production Batches',
    desc:    'Create and manage production runs. Track every batch from planning through completion.',
    path:    '/dashboard/production',
    primary: true,
  },
  {
    icon:    Layers,
    color:   'text-amber-600',
    bg:      'bg-amber-50',
    label:   'Material Reservations',
    desc:    'View and manage raw material reservations across all active batches.',
    path:    '/dashboard/production',   // Phase 4 will have its own page
    badge:   'Phase 4',
  },
  {
    icon:    ClipboardList,
    color:   'text-green-600',
    bg:      'bg-green-50',
    label:   'Production Reports',
    desc:    'Yield efficiency, scrap analysis, and machine utilisation summaries.',
    path:    '/dashboard/production',   // Phase 4
    badge:   'Phase 4',
  },
]

export function ProductionPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production"
        description="Plan production runs, manage batch lifecycles and track material consumption."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(({ icon: Icon, color, bg, label, desc, path, primary, badge }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
          >
            <Card
              padded bordered
              className={`h-full transition-shadow duration-150 group-hover:shadow-md ${
                primary ? 'group-hover:border-primary-200' : 'opacity-80'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-surface-900">{label}</p>
                    {badge ? (
                      <span className="text-xs font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full shrink-0">
                        {badge}
                      </span>
                    ) : (
                      <ArrowRight
                        className="h-4 w-4 text-surface-300 group-hover:text-primary-500 transition-colors shrink-0"
                        aria-hidden="true"
                      />
                    )}
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
