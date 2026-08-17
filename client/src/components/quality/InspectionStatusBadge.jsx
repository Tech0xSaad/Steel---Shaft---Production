import { Badge } from '@/components/ui/Badge'
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_VARIANTS,
} from '@/constants/qualityTypes'

export function InspectionStatusBadge({ status, size }) {
  if (!status) return null
  return (
    <Badge
      variant={INSPECTION_STATUS_VARIANTS[status] ?? 'default'}
      size={size}
    >
      {INSPECTION_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
