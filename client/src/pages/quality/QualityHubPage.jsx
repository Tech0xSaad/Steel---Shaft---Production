import { useNavigate }  from 'react-router-dom'
import {
  ClipboardCheck, Trash2, Package,
  ArrowRight, TrendingDown, CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'

const MODULES = [
  {
    id:       'inspections',
    title:    'Quality Inspections',
    desc:     'Record pass/fail results per batch. Approved qty automatically moves to Finished Goods; rejected qty becomes a scrap entry.',
    icon:     ClipboardCheck,
    iconBg:   'bg-blue-50',
    iconColor:'text-blue-600',
    path:     null,          // batch-scoped; navigate from batch detail
    hint:     'Open a Production Batch and click "Quality Inspection" to start.',
    actions: [],
  },
  {
    id:       'scrap',
    title:    'Scrap Management',
    desc:     'View, log, and track all scrap events across batches. Filter by category, machine, or date range and mark disposed items.',
    icon:     Trash2,
    iconBg:   'bg-red-50',
    iconColor:'text-red-600',
    path:     '/dashboard/quality/scrap',
    hint:     null,
  },
  {
    id:       'finished-goods',
    title:    'Finished Goods Inventory',
    desc:     'Monitor FG stock levels, dispatch products to customers, and review the complete FG transaction ledger.',
    icon:     Package,
    iconBg:   'bg-green-50',
    iconColor:'text-green-600',
    path:     '/dashboard/quality/finished-goods',
    hint:     null,
  },
]

const WORKFLOW_STEPS = [
  { label: 'Batch reaches Inspection status' },
  { label: 'Create Quality Check — log qty inspected' },
  { label: 'Submit result: passed / rejected / on-hold' },
  { label: 'Passed qty → moved to Finished Goods stock' },
  { label: 'Rejected qty → auto-logged as Scrap' },
  { label: 'Batch Completion Summary generated' },
  { label: 'Close batch once all qty accounted for' },
]

export function QualityHubPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quality Control"
        subtitle="Close the production cycle — inspect batches, manage scrap, and track finished goods."
      />

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {MODULES.map(m => (
          <div
            key={m.id}
            className={`group relative flex flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${m.path ? 'cursor-pointer' : ''}`}
            onClick={() => m.path && navigate(m.path)}
            role={m.path ? 'button' : undefined}
            tabIndex={m.path ? 0 : undefined}
            onKeyDown={e => m.path && e.key === 'Enter' && navigate(m.path)}
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${m.iconBg}`}>
              <m.icon className={`h-6 w-6 ${m.iconColor}`} aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-surface-900 mb-1">{m.title}</h3>
            <p className="text-sm text-surface-500 leading-relaxed flex-1">{m.desc}</p>

            {m.hint && (
              <p className="mt-3 text-xs text-surface-400 italic">{m.hint}</p>
            )}

            {m.path && (
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                Open <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workflow guide */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary-500" />
            Phase 6 Workflow
          </h3>
          <ol className="space-y-2">
            {WORKFLOW_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-surface-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
                  {i + 1}
                </span>
                {step.label}
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl bg-surface-50 border border-surface-200 p-4 text-sm text-surface-600">
            <p className="font-medium text-surface-800 mb-1 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-primary-500" />
              Batch Completion KPIs
            </p>
            <p>Once an inspection result is submitted, the system automatically calculates:</p>
            <ul className="mt-2 space-y-0.5 list-disc list-inside text-surface-500">
              <li>Yield % — passed qty ÷ planned qty</li>
              <li>Rejection % — rejected qty ÷ produced qty</li>
              <li>Scrap % — scrapped qty ÷ produced qty</li>
              <li>Material Utilisation % — produced qty ÷ material issued</li>
              <li>Time Efficiency % — planned cycle time ÷ actual cycle time</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
