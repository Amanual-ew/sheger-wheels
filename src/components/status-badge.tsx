import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusBadgeClass, statusLabel } from '@/lib/format'

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('border', statusBadgeClass(status))}
    >
      {statusLabel(status)}
    </Badge>
  );
}
