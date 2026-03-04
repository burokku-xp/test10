import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { refreshProjectIntegrity } from '@/lib/services/integrityService'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
    include: {
      maker: true,
      customer: true,
      quotationRequests: {
        include: { quotationResponse: true, company: true },
        orderBy: { createdAt: 'desc' },
      },
      ordersToMaker: {
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      },
      customerDeals: {
        include: { company: true },
        orderBy: { dealDate: 'desc' },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const projectId = parseInt(id)

  const existing = await prisma.project.findUnique({ where: { id: projectId } })
  if (!existing) {
    return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })
  }

  const logs: Array<{ field: string; old: string; new: string }> = []

  const updateData: Record<string, unknown> = {}
  const fields = [
    'name', 'makerId', 'customerId', 'makerStatus', 'customerStatus',
    'description', 'startDate', 'expectedEndDate', 'notes',
  ] as const

  for (const field of fields) {
    if (field in body) {
      const newVal = body[field]
      const oldVal = (existing as Record<string, unknown>)[field]
      if (String(newVal) !== String(oldVal ?? '')) {
        logs.push({ field, old: String(oldVal ?? ''), new: String(newVal ?? '') })
      }
      if (field === 'startDate' || field === 'expectedEndDate') {
        updateData[field] = newVal ? new Date(newVal) : null
      } else {
        updateData[field] = newVal ?? null
      }
    }
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: { maker: true, customer: true },
  })

  // 整合性チェック
  await refreshProjectIntegrity(projectId)

  // 活動ログ記録
  for (const log of logs) {
    await prisma.activityLog.create({
      data: {
        projectId: projectId,
        entityType: 'project',
        entityId: projectId,
        action: 'status_changed',
        fieldName: log.field,
        oldValue: log.old,
        newValue: log.new,
        description: `${log.field} を変更しました`,
      },
    })
  }

  return NextResponse.json(project)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const projectId = parseInt(id)

  await prisma.project.delete({ where: { id: projectId } })
  return NextResponse.json({ success: true })
}
