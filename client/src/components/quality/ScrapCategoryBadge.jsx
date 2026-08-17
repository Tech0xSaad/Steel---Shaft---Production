import { Badge } from '@/components/ui/Badge'
import { SCRAP_CATEGORY_LABELS } from '@/constants/qualityTypes'

export function ScrapCategoryBadge({ category, size }) {
  if (!category) return null
  return (
    <Badge variant="default" size={size}>
      {SCRAP_CATEGORY_LABELS[category] ?? category}
    </Badge>
  )
}
