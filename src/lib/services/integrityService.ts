import { prisma } from '@/lib/db/prisma'
import type { MakerStatus, CustomerStatus, IntegrityIssue } from '@/types'

const MAKER_ORDERED_OR_LATER: MakerStatus[] = [
  'ordered',
  'delivery_confirmed',
  'shipped',
  'completed',
]

const MAKER_DELIVERY_OR_LATER: MakerStatus[] = [
  'delivery_confirmed',
  'shipped',
  'completed',
]

export function checkIntegrity(
  makerStatus: string,
  customerStatus: string
): IntegrityIssue | null {
  // Rule 1 (high): A側発注済だがC側が未着手
  if (
    MAKER_ORDERED_OR_LATER.includes(makerStatus as MakerStatus) &&
    customerStatus === 'pending'
  ) {
    return {
      severity: 'high',
      description: 'A側発注済だがC側が未着手です',
    }
  }

  // Rule 2 (high): A側納期確認済だがC側が受注未取得
  if (
    MAKER_DELIVERY_OR_LATER.includes(makerStatus as MakerStatus) &&
    ['pending', 'quoting'].includes(customerStatus)
  ) {
    return {
      severity: 'high',
      description: 'A側納期確認済だがC側が受注未取得です',
    }
  }

  // Rule 3 (medium): A側出荷済だがC側が請求未実施
  if (
    makerStatus === 'shipped' &&
    !['invoiced', 'paid', 'completed'].includes(customerStatus)
  ) {
    return {
      severity: 'medium',
      description: 'A側出荷済だがC側が請求未実施です',
    }
  }

  return null
}

export async function refreshProjectIntegrity(projectId: number): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return

  const issue = checkIntegrity(project.makerStatus, project.customerStatus)

  await prisma.project.update({
    where: { id: projectId },
    data: {
      hasIntegrityIssue: issue !== null,
      integrityIssueDesc: issue?.description ?? null,
    },
  })
}

export async function refreshAllProjectIntegrity(): Promise<void> {
  const projects = await prisma.project.findMany({
    select: { id: true, makerStatus: true, customerStatus: true },
  })

  for (const project of projects) {
    const issue = checkIntegrity(project.makerStatus, project.customerStatus)
    await prisma.project.update({
      where: { id: project.id },
      data: {
        hasIntegrityIssue: issue !== null,
        integrityIssueDesc: issue?.description ?? null,
      },
    })
  }
}
