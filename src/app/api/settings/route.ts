import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const settings = await prisma.alertSetting.findMany()
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { settingKey, settingValue } = body

  if (!settingKey || settingValue === undefined) {
    return NextResponse.json({ error: 'settingKey と settingValue は必須です' }, { status: 400 })
  }

  const setting = await prisma.alertSetting.upsert({
    where: { settingKey },
    update: { settingValue: String(settingValue) },
    create: { settingKey, settingValue: String(settingValue) },
  })

  return NextResponse.json(setting)
}
