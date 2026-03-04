import { Badge } from '@/components/ui/Badge'
import { MAKER_STATUS_LABELS, CUSTOMER_STATUS_LABELS } from '@/types'
import type { MakerStatus, CustomerStatus } from '@/types'

interface MakerStatusBadgeProps {
  status: string
}

const makerStatusVariant: Record<MakerStatus, 'default' | 'info' | 'warning' | 'success' | 'secondary'> = {
  pending: 'default',
  quoting: 'info',
  quoted: 'warning',
  ordered: 'secondary',
  delivery_confirmed: 'secondary',
  shipped: 'warning',
  completed: 'success',
}

const customerStatusVariant: Record<CustomerStatus, 'default' | 'info' | 'warning' | 'success' | 'secondary'> = {
  pending: 'default',
  quoting: 'info',
  quoted: 'warning',
  ordered: 'secondary',
  invoiced: 'warning',
  paid: 'success',
  completed: 'success',
}

export function MakerStatusBadge({ status }: MakerStatusBadgeProps) {
  const label = MAKER_STATUS_LABELS[status as MakerStatus] ?? status
  const variant = makerStatusVariant[status as MakerStatus] ?? 'default'
  return <Badge variant={variant}>{label}</Badge>
}

export function CustomerStatusBadge({ status }: MakerStatusBadgeProps) {
  const label = CUSTOMER_STATUS_LABELS[status as CustomerStatus] ?? status
  const variant = customerStatusVariant[status as CustomerStatus] ?? 'default'
  return <Badge variant={variant}>{label}</Badge>
}
