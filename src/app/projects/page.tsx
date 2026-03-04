'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MakerStatusBadge, CustomerStatusBadge } from '@/components/projects/StatusBadge'
import { DeadlineCountdown } from '@/components/alerts/DeadlineCountdown'
import { formatDate } from '@/lib/utils/dateUtils'
import { MAKER_STATUS_OPTIONS, CUSTOMER_STATUS_OPTIONS } from '@/types'

interface Project {
  id: number
  projectNo: string
  name: string
  makerStatus: string
  customerStatus: string
  hasIntegrityIssue: boolean
  updatedAt: string
  maker?: { name: string }
  customer?: { name: string }
  quotationRequests: Array<{ alertStatus: string; responseDeadline: string | null }>
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [makerStatusFilter, setMakerStatusFilter] = useState('')
  const [customerStatusFilter, setCustomerStatusFilter] = useState('')
  const [alertOnly, setAlertOnly] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (makerStatusFilter) params.set('makerStatus', makerStatusFilter)
    if (customerStatusFilter) params.set('customerStatus', customerStatusFilter)
    if (alertOnly) params.set('alertOnly', 'true')

    const res = await fetch(`/api/projects?${params}`)
    const data = await res.json()
    setProjects(data)
    setLoading(false)
  }, [search, makerStatusFilter, customerStatusFilter, alertOnly])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const hasAlertRequests = (project: Project) =>
    project.quotationRequests.some((r) => r.alertStatus !== 'none')

  const topAlertReq = (project: Project) =>
    project.quotationRequests.find((r) => r.alertStatus !== 'none')

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">案件管理</h1>
          <p className="text-gray-500 text-sm">全案件の一覧</p>
        </div>
        <Link href="/projects/new">
          <Button variant="primary">＋ 新規案件</Button>
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="案件名・案件番号で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={makerStatusFilter}
          onChange={(e) => setMakerStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">A側: 全て</option>
          {MAKER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={customerStatusFilter}
          onChange={(e) => setCustomerStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">C側: 全て</option>
          {CUSTOMER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={alertOnly}
            onChange={(e) => setAlertOnly(e.target.checked)}
            className="rounded"
          />
          整合性問題のみ
        </label>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">読み込み中...</div>
        ) : projects.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            案件が見つかりませんでした
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">案件番号</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">案件名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">A側状況</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">C側状況</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">アラート</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">更新日</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const alertReq = topAlertReq(project)
                return (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:underline font-medium text-sm"
                      >
                        {project.projectNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-gray-900 hover:text-blue-600 font-medium"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{project.customer?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <MakerStatusBadge status={project.makerStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <CustomerStatusBadge status={project.customerStatus} />
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      {project.hasIntegrityIssue && (
                        <Badge variant="warning">⚡ 整合性</Badge>
                      )}
                      {alertReq && (
                        <DeadlineCountdown
                          deadline={alertReq.responseDeadline}
                          alertStatus={alertReq.alertStatus}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(project.updatedAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400">{projects.length}件</p>
    </div>
  )
}
