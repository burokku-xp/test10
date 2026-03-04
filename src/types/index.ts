export type MakerStatus =
  | 'pending'
  | 'quoting'
  | 'quoted'
  | 'ordered'
  | 'delivery_confirmed'
  | 'shipped'
  | 'completed'

export type CustomerStatus =
  | 'pending'
  | 'quoting'
  | 'quoted'
  | 'ordered'
  | 'invoiced'
  | 'paid'
  | 'completed'

export type AlertStatus = 'none' | 'warning' | 'overdue'

export type CompanyType = 'maker' | 'customer' | 'both'

export const MAKER_STATUS_LABELS: Record<MakerStatus, string> = {
  pending: '未着手',
  quoting: '見積中',
  quoted: '見積済',
  ordered: '発注済',
  delivery_confirmed: '納期確認済',
  shipped: '出荷済',
  completed: '完了',
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  pending: '未着手',
  quoting: '見積中',
  quoted: '見積済',
  ordered: '受注済',
  invoiced: '請求済',
  paid: '入金済',
  completed: '完了',
}

export const MAKER_STATUS_OPTIONS: { value: MakerStatus; label: string }[] = [
  { value: 'pending', label: '未着手' },
  { value: 'quoting', label: '見積中' },
  { value: 'quoted', label: '見積済' },
  { value: 'ordered', label: '発注済' },
  { value: 'delivery_confirmed', label: '納期確認済' },
  { value: 'shipped', label: '出荷済' },
  { value: 'completed', label: '完了' },
]

export const CUSTOMER_STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: 'pending', label: '未着手' },
  { value: 'quoting', label: '見積中' },
  { value: 'quoted', label: '見積済' },
  { value: 'ordered', label: '受注済' },
  { value: 'invoiced', label: '請求済' },
  { value: 'paid', label: '入金済' },
  { value: 'completed', label: '完了' },
]

export interface AlertSummary {
  overdueCount: number
  warningCount: number
  integrityCount: number
  completedThisMonth: number
}

export interface IntegrityIssue {
  severity: 'high' | 'medium'
  description: string
}
