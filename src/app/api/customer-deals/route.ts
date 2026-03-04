import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { refreshProjectIntegrity } from '@/lib/services/integrityService'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, companyId, dealType, dealNo, amount, currency, dueDate, details } = body

  if (!projectId || !dealType) {
    return NextResponse.json({ error: 'projectId と dealType は必須です' }, { status: 400 })
  }

  const pId = parseInt(projectId)
  const deal = await prisma.customerDeal.create({
    data: {
      projectId: pId,
      companyId: companyId ? parseInt(companyId) : null,
      dealType,
      dealNo: dealNo || null,
      amount: amount ? parseFloat(amount) : null,
      currency: currency || 'JPY',
      dueDate: dueDate ? new Date(dueDate) : null,
      details: details || null,
    },
  })

  // C側ステータス自動更新
  const dealTypeToStatus: Record<string, string> = {
    quote: 'quoting',
    order: 'ordered',
    invoice: 'invoiced',
    payment: 'paid',
  }
  const newStatus = dealTypeToStatus[dealType]
  if (newStatus) {
    await prisma.project.update({
      where: { id: pId },
      data: { customerStatus: newStatus },
    })
    await refreshProjectIntegrity(pId)
  }

  const dealTypeLabels: Record<string, string> = {
    quote: '見積提出',
    order: '受注',
    invoice: '請求',
    payment: '入金確認',
  }

  await prisma.activityLog.create({
    data: {
      projectId: pId,
      customerDealId: deal.id,
      entityType: 'customer_deal',
      entityId: deal.id,
      action: 'created',
      description: `C側 ${dealTypeLabels[dealType] || dealType}を登録しました`,
    },
  })

  return NextResponse.json(deal, { status: 201 })
}
