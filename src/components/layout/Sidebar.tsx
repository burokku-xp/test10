'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { AlertSummary } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/projects', label: '案件管理', icon: '📋' },
  { href: '/alerts', label: 'アラート', icon: '🚨' },
  { href: '/companies', label: '取引先マスタ', icon: '🏢' },
  { href: '/settings', label: '設定', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [summary, setSummary] = useState<AlertSummary | null>(null)

  useEffect(() => {
    fetch('/api/alerts/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
  }, [])

  const totalAlerts = summary ? summary.overdueCount + summary.warningCount + summary.integrityCount : 0

  return (
    <aside className="w-60 min-h-screen bg-slate-800 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white leading-tight">受発注管理</h1>
        <p className="text-xs text-slate-400 mt-0.5">Order Management</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const isAlerts = item.href === '/alerts'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isAlerts && totalAlerts > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalAlerts > 99 ? '99+' : totalAlerts}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {summary && (
        <div className="px-4 py-4 border-t border-slate-700 space-y-1.5">
          {summary.overdueCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <span>🚨</span>
              <span>期限超過 {summary.overdueCount}件</span>
            </div>
          )}
          {summary.warningCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <span>⚠️</span>
              <span>期限警告 {summary.warningCount}件</span>
            </div>
          )}
          {summary.integrityCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-400">
              <span>⚡</span>
              <span>整合性問題 {summary.integrityCount}件</span>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
