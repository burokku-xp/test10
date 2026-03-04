import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const company = await prisma.company.findUnique({
    where: { id: parseInt(id) },
    include: { contacts: true },
  })
  if (!company) return NextResponse.json({ error: '取引先が見つかりません' }, { status: 404 })
  return NextResponse.json(company)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const company = await prisma.company.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      type: body.type,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(company)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.company.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
