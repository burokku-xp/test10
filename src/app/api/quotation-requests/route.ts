import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { calcAlertStatus, getWarningDays } from '@/lib/services/alertService'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, companyId, requestNo, subject, details, responseDeadline } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId は必須です' }, { status: 400 })
  }

  const warningDays = await getWarningDays()
  const deadline = responseDeadline ? new Date(responseDeadline) : null
  const alertStatus = calcAlertStatus(deadline, warningDays)

  const req = await prisma.quotationRequest.create({
    data: {
      projectId: parseInt(projectId),
      companyId: companyId ? parseInt(companyId) : null,
      requestNo: requestNo || null,
      subject: subject || null,
      details: details || null,
      responseDeadline: deadline,
      alertStatus,
    },
    include: { company: true },
  })

  await prisma.activityLog.create({
    data: {
      projectId: parseInt(projectId),
      quotationRequestId: req.id,
      entityType: 'quotation_request',
      entityId: req.id,
      action: 'created',
      description: `見積依頼「${subject || requestNo || req.id}」を作成しました`,
    },
  })

  return NextResponse.json(req, { status: 201 })
}
