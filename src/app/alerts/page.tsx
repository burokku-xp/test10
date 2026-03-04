'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MakerStatusBadge, CustomerStatusBadge } from '@/components/projects/StatusBadge'
import { DeadlineCountdown } from '@/components/alerts/DeadlineCountdown'
import { formatDate } from '@/lib/utils/dateUtils'

interface AlertData {
  overdueRequests: QuotationRequestWithProject[]
  warningRequests: QuotationRequestWithProject[]
  integrityProjects: ProjectWithCompanies[]
}

interface QuotationRequestWithProject {
  id: number
  requestNo?: string
  subject?: string
  responseDeadline?: string
  alertStatus: string
  project: {
    id: number
    projectNo: string
    name: string
    makerStatus: string
    customerStatus: string
    maker?: { name: string }
    customer?: { name: string }
  }
  company?: { name: string }
}

interface ProjectWithCompanies {
  id: number
  projectNo: string
  name: string
  makerStatus: string
  customerStatus: string
  hasIntegrityIssue: boolean
  integrityIssueDesc?: string
  maker?: { name: string }
  customer?: { name: string }
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rescanning, setRescanning] = useState(false)

  const fetchAlerts = async () => {
    setLoading(true)
    const res = await fetch('/api/alerts/list')
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  const rescan = async () => {
    setRescanning(true)
    await fetch('/api/alerts/check', { method: 'POST' })
    await fetchAlerts()
    setRescanning(false)
  }

  useEffect(() => { fetchAlerts() }, [])

  if (loading) return <div className="p-6 text-gray-400">読み込み中...</div>

  const total = (data?.overdueRequests.length ?? 0) + (data?.warningRequests.length ?? 0) + (data?.integrityProjects.length ?? 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アラート一覧</h1>
          <p className="text-gray-500 text-sm">要対応事項 合計 {total}件</p>
        </div>
        <Button variant="secondary" onClick={rescan} disabled={rescanning}>
          {rescanning ? '再スキャン中...' : '🔄 再スキャン'}
        </Button>
      </div>

      {/* 期限超過 */}
      {(data?.overdueRequests.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🚨 見積回答期限超過 ({data!.overdueRequests.length}件)</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-2 text-xs text-gray-500">案件</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">見積依頼</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">回答期限</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">A側</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">C側</th>
                </tr>
              </thead>
              <tbody>
                {data!.overdueRequests.map((req) => (
                  <tr key={req.id} className="border-b border-red-50 hover:bg-red-50/30">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${req.project.id}`} className="text-blue-600 hover:underline font-medium">
                        {req.project.projectNo}
                      </Link>
                      <div className="text-xs text-gray-500">{req.project.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{req.subject || req.requestNo || `#${req.id}`}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">{formatDate(req.responseDeadline)}</div>
                      <DeadlineCountdown deadline={req.responseDeadline} alertStatus={req.alertStatus} />
                    </td>
                    <td className="px-4 py-3"><MakerStatusBadge status={req.project.makerStatus} /></td>
                    <td className="px-4 py-3"><CustomerStatusBadge status={req.project.customerStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 期限警告 */}
      {(data?.warningRequests.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ 見積回答期限警告 ({data!.warningRequests.length}件)</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-2 text-xs text-gray-500">案件</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">見積依頼</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">回答期限</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">A側</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">C側</th>
                </tr>
              </thead>
              <tbody>
                {data!.warningRequests.map((req) => (
                  <tr key={req.id} className="border-b border-yellow-50 hover:bg-yellow-50/30">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${req.project.id}`} className="text-blue-600 hover:underline font-medium">
                        {req.project.projectNo}
                      </Link>
                      <div className="text-xs text-gray-500">{req.project.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{req.subject || req.requestNo || `#${req.id}`}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">{formatDate(req.responseDeadline)}</div>
                      <DeadlineCountdown deadline={req.responseDeadline} alertStatus={req.alertStatus} />
                    </td>
                    <td className="px-4 py-3"><MakerStatusBadge status={req.project.makerStatus} /></td>
                    <td className="px-4 py-3"><CustomerStatusBadge status={req.project.customerStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 整合性問題 */}
      {(data?.integrityProjects.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⚡ 整合性問題 ({data!.integrityProjects.length}件)</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-2 text-xs text-gray-500">案件</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">顧客</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">A側</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">C側</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">問題内容</th>
                </tr>
              </thead>
              <tbody>
                {data!.integrityProjects.map((project) => (
                  <tr key={project.id} className="border-b border-orange-50 hover:bg-orange-50/30">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline font-medium">
                        {project.projectNo}
                      </Link>
                      <div className="text-xs text-gray-500">{project.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{project.customer?.name ?? '-'}</td>
                    <td className="px-4 py-3"><MakerStatusBadge status={project.makerStatus} /></td>
                    <td className="px-4 py-3"><CustomerStatusBadge status={project.customerStatus} /></td>
                    <td className="px-4 py-3 text-orange-700 text-xs">{project.integrityIssueDesc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {total === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-700">アラートはありません</h2>
          <p className="text-gray-500 text-sm mt-2">全ての案件が正常に処理されています</p>
        </div>
      )}
    </div>
  )
}
