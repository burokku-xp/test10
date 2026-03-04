import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { refreshAlertStatuses } from '@/lib/services/alertService'

export async function GET() {
  await refreshAlertStatuses()

  const [overdueRequests, warningRequests, integrityProjects] = await Promise.all([
    prisma.quotationRequest.findMany({
      where: { alertStatus: 'overdue' },
      include: {
        project: { include: { maker: true, customer: true } },
        company: true,
      },
      orderBy: { responseDeadline: 'asc' },
    }),
    prisma.quotationRequest.findMany({
      where: { alertStatus: 'warning' },
      include: {
        project: { include: { maker: true, customer: true } },
        company: true,
      },
      orderBy: { responseDeadline: 'asc' },
    }),
    prisma.project.findMany({
      where: { hasIntegrityIssue: true },
      include: { maker: true, customer: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  return NextResponse.json({ overdueRequests, warningRequests, integrityProjects })
}
