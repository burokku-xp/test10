import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { quotationRequestId, amount, currency, validUntil, details } = body

  if (!quotationRequestId) {
    return NextResponse.json({ error: 'quotationRequestId は必須です' }, { status: 400 })
  }

  const qrId = parseInt(quotationRequestId)

  // 既存の回答があれば更新
  const existing = await prisma.quotationResponse.findUnique({
    where: { quotationRequestId: qrId },
  })

  let response
  if (existing) {
    response = await prisma.quotationResponse.update({
      where: { quotationRequestId: qrId },
      data: {
        amount: amount ? parseFloat(amount) : null,
        currency: currency || 'JPY',
        validUntil: validUntil ? new Date(validUntil) : null,
        details: details || null,
      },
    })
  } else {
    response = await prisma.quotationResponse.create({
      data: {
        quotationRequestId: qrId,
        amount: amount ? parseFloat(amount) : null,
        currency: currency || 'JPY',
        validUntil: validUntil ? new Date(validUntil) : null,
        details: details || null,
      },
    })

    // アラートをクリア
    await prisma.quotationRequest.update({
      where: { id: qrId },
      data: { alertStatus: 'none' },
    })
  }

  const qr = await prisma.quotationRequest.findUnique({ where: { id: qrId } })
  if (qr) {
    await prisma.activityLog.create({
      data: {
        projectId: qr.projectId,
        quotationRequestId: qrId,
        entityType: 'quotation_response',
        entityId: response.id,
        action: 'created',
        description: `見積回答を登録しました (金額: ${amount ? `¥${parseInt(amount).toLocaleString()}` : '未定'})`,
      },
    })
  }

  return NextResponse.json(response, { status: 201 })
}
