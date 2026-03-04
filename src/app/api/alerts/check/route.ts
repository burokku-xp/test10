import { NextResponse } from 'next/server'
import { refreshAlertStatuses } from '@/lib/services/alertService'
import { refreshAllProjectIntegrity } from '@/lib/services/integrityService'

export async function POST() {
  await Promise.all([refreshAlertStatuses(), refreshAllProjectIntegrity()])
  return NextResponse.json({ success: true, message: 'アラートを再スキャンしました' })
}
