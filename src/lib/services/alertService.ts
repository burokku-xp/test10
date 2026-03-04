import { prisma } from '@/lib/db/prisma'
import { getDaysUntil } from '@/lib/utils/dateUtils'
import type { AlertStatus } from '@/types'

export async function getWarningDays(): Promise<number> {
  const setting = await prisma.alertSetting.findUnique({
    where: { settingKey: 'warning_days_before' },
  })
  return setting ? parseInt(setting.settingValue, 10) : 3
}

export function calcAlertStatus(
  responseDeadline: Date | null | undefined,
  warningDays: number
): AlertStatus {
  if (!responseDeadline) return 'none'
  const diff = getDaysUntil(responseDeadline)
  if (diff === null) return 'none'
  if (diff < 0) return 'overdue'
  if (diff <= warningDays) return 'warning'
  return 'none'
}

export async function refreshAlertStatuses(): Promise<void> {
  const warningDays = await getWarningDays()
  const requests = await prisma.quotationRequest.findMany({
    where: {
      responseDeadline: { not: null },
      quotationResponse: null, // 未回答のもののみ
    },
  })

  for (const req of requests) {
    const newStatus = calcAlertStatus(req.responseDeadline, warningDays)
    if (req.alertStatus !== newStatus) {
      await prisma.quotationRequest.update({
        where: { id: req.id },
        data: { alertStatus: newStatus },
      })
    }
  }
}

export async function getAlertSummary() {
  await refreshAlertStatuses()

  const [overdueCount, warningCount, integrityCount] = await Promise.all([
    prisma.quotationRequest.count({ where: { alertStatus: 'overdue' } }),
    prisma.quotationRequest.count({ where: { alertStatus: 'warning' } }),
    prisma.project.count({ where: { hasIntegrityIssue: true } }),
  ])

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const completedThisMonth = await prisma.project.count({
    where: {
      updatedAt: { gte: startOfMonth },
      makerStatus: 'completed',
      customerStatus: { in: ['paid', 'completed'] },
    },
  })

  return { overdueCount, warningCount, integrityCount, completedThisMonth }
}
