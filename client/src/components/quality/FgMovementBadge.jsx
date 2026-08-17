import { Badge } from '@/components/ui/Badge'
import { FG_MOVEMENT_LABELS, FG_MOVEMENT_VARIANTS } from '@/constants/qualityTypes'

export function FgMovementBadge({ movementType, size }) {
  if (!movementType) return null
  return (
    <Badge
      variant={FG_MOVEMENT_VARIANTS[movementType] ?? 'default'}
      size={size}
    >
      {FG_MOVEMENT_LABELS[movementType] ?? movementType}
    </Badge>
  )
}
