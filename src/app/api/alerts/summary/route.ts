import { NextResponse } from 'next/server'
import { getAlertSummary } from '@/lib/services/alertService'

export async function GET() {
  const summary = await getAlertSummary()
  return NextResponse.json(summary)
}
