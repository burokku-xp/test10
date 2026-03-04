import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const where: Record<string, unknown> = {}
  if (type) {
    where.OR = [{ type }, { type: 'both' }]
  }

  const companies = await prisma.company.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(companies)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, type, phone, email, address, notes } = body

  if (!name || !type) {
    return NextResponse.json({ error: '会社名と種別は必須です' }, { status: 400 })
  }

  const company = await prisma.company.create({
    data: { name, type, phone: phone || null, email: email || null, address: address || null, notes: notes || null },
  })

  return NextResponse.json(company, { status: 201 })
}
