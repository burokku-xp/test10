'use client'

import { getDaysUntil } from '@/lib/utils/dateUtils'

interface DeadlineCountdownProps {
  deadline: string | Date | null | undefined
  alertStatus?: string
}

export function DeadlineCountdown({ deadline, alertStatus }: DeadlineCountdownProps) {
  if (!deadline) return <span className="text-gray-400 text-xs">期限未設定</span>

  const days = getDaysUntil(deadline)
  if (days === null) return <span className="text-gray-400 text-xs">-</span>

  if (alertStatus === 'overdue' || days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">
        🚨 {Math.abs(days)}日超過
      </span>
    )
  }

  if (alertStatus === 'warning' || days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-semibold">
        ⚠️ 残{days}日
      </span>
    )
  }

  return (
    <span className="text-gray-600 text-xs">
      残{days}日
    </span>
  )
}
