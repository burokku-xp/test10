import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const makerStatus = searchParams.get('makerStatus')
  const customerStatus = searchParams.get('customerStatus')
  const alertOnly = searchParams.get('alertOnly') === 'true'
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (makerStatus) where.makerStatus = makerStatus
  if (customerStatus) where.customerStatus = customerStatus
  if (alertOnly) where.hasIntegrityIssue = true
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { projectNo: { contains: search } },
    ]
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      maker: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      quotationRequests: {
        select: { id: true, alertStatus: true, responseDeadline: true },
        orderBy: { responseDeadline: 'asc' },
      },
    },
    orderBy: [{ hasIntegrityIssue: 'desc' }, { updatedAt: 'desc' }],
  })

  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { projectNo, name, makerId, customerId, description, startDate, expectedEndDate, notes } =
    body

  if (!projectNo || !name) {
    return NextResponse.json({ error: '案件番号と案件名は必須です' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      projectNo,
      name,
      makerId: makerId || null,
      customerId: customerId || null,
      description: description || null,
      startDate: startDate ? new Date(startDate) : null,
      expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
      notes: notes || null,
    },
    include: {
      maker: true,
      customer: true,
    },
  })

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      entityType: 'project',
      entityId: project.id,
      action: 'created',
      description: `案件「${name}」を作成しました`,
    },
  })

  return NextResponse.json(project, { status: 201 })
}
