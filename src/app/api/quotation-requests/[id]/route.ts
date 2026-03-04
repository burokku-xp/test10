import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { calcAlertStatus, getWarningDays } from '@/lib/services/alertService'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const reqId = parseInt(id)

  const existing = await prisma.quotationRequest.findUnique({ where: { id: reqId } })
  if (!existing) {
    return NextResponse.json({ error: '見積依頼が見つかりません' }, { status: 404 })
  }

  const warningDays = await getWarningDays()
  const deadline = body.responseDeadline ? new Date(body.responseDeadline) : existing.responseDeadline
  const alertStatus = calcAlertStatus(deadline, warningDays)

  const updated = await prisma.quotationRequest.update({
    where: { id: reqId },
    data: {
      subject: body.subject ?? existing.subject,
      details: body.details ?? existing.details,
      responseDeadline: deadline,
      alertStatus,
      companyId: body.companyId !== undefined ? (body.companyId || null) : existing.companyId,
      requestNo: body.requestNo !== undefined ? (body.requestNo || null) : existing.requestNo,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.quotationRequest.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
