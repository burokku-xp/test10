import { differenceInDays, format, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

export function getDaysUntil(deadline: Date | string | null | undefined): number | null {
  if (!deadline) return null
  const d = new Date(deadline)
  if (!isValid(d)) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  return differenceInDays(target, today)
}

export function formatDate(date: Date | string | null | undefined, fmt = 'yyyy/MM/dd'): string {
  if (!date) return '-'
  const d = new Date(date)
  if (!isValid(d)) return '-'
  return format(d, fmt, { locale: ja })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'yyyy/MM/dd HH:mm')
}
