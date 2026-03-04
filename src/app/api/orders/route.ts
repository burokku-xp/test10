import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { refreshProjectIntegrity } from '@/lib/services/integrityService'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, companyId, orderNo, amount, currency, deliveryDate, details } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId は必須です' }, { status: 400 })
  }

  const pId = parseInt(projectId)
  const order = await prisma.orderToMaker.create({
    data: {
      projectId: pId,
      companyId: companyId ? parseInt(companyId) : null,
      orderNo: orderNo || null,
      amount: amount ? parseFloat(amount) : null,
      currency: currency || 'JPY',
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      details: details || null,
    },
  })

  // A側ステータスを発注済に更新
  await prisma.project.update({
    where: { id: pId },
    data: { makerStatus: 'ordered' },
  })
  await refreshProjectIntegrity(pId)

  await prisma.activityLog.create({
    data: {
      projectId: pId,
      orderToMakerId: order.id,
      entityType: 'order_to_maker',
      entityId: order.id,
      action: 'created',
      description: `発注を登録しました (発注No: ${orderNo || order.id})`,
    },
  })

  return NextResponse.json(order, { status: 201 })
}
