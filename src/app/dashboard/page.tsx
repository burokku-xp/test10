import { prisma } from '@/lib/db/prisma'
import { getAlertSummary } from '@/lib/services/alertService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MakerStatusBadge, CustomerStatusBadge } from '@/components/projects/StatusBadge'
import { DeadlineCountdown } from '@/components/alerts/DeadlineCountdown'
import { formatDate } from '@/lib/utils/dateUtils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [summary, urgentProjects, recentProjects] = await Promise.all([
    getAlertSummary(),
    prisma.project.findMany({
      where: {
        OR: [
          { hasIntegrityIssue: true },
          { quotationRequests: { some: { alertStatus: { in: ['overdue', 'warning'] } } } },
        ],
      },
      include: {
        maker: { select: { name: true } },
        customer: { select: { name: true } },
        quotationRequests: {
          select: { alertStatus: true, responseDeadline: true },
          orderBy: { responseDeadline: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ hasIntegrityIssue: 'desc' }, { updatedAt: 'desc' }],
      take: 10,
    }),
    prisma.project.findMany({
      include: {
        maker: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ])

  const summaryCards = [
    {
      title: '🚨 期限超過',
      value: summary.overdueCount,
      color: summary.overdueCount > 0 ? 'border-red-400 bg-red-50' : 'border-gray-200',
      textColor: summary.overdueCount > 0 ? 'text-red-600' : 'text-gray-400',
    },
    {
      title: '⚠️ 期限警告',
      value: summary.warningCount,
      color: summary.warningCount > 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200',
      textColor: summary.warningCount > 0 ? 'text-yellow-600' : 'text-gray-400',
    },
    {
      title: '⚡ 整合性問題',
      value: summary.integrityCount,
      color: summary.integrityCount > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-200',
      textColor: summary.integrityCount > 0 ? 'text-orange-600' : 'text-gray-400',
    },
    {
      title: '✅ 今月完了',
      value: summary.completedThisMonth,
      color: 'border-green-200 bg-green-50',
      textColor: 'text-green-600',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mt-1">受発注状況の概要</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border-2 p-5 ${card.color}`}
          >
            <div className="text-sm font-medium text-gray-600">{card.title}</div>
            <div className={`text-4xl font-bold mt-1 ${card.textColor}`}>{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">件</div>
          </div>
        ))}
      </div>

      {/* 緊急対応リスト */}
      {urgentProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔴 緊急対応が必要な案件</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">案件</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">顧客</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">A側</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">C側</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">アラート</th>
                </tr>
              </thead>
              <tbody>
                {urgentProjects.map((project) => {
                  const latestReq = project.quotationRequests[0]
                  return (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {project.projectNo}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">{project.name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{project.customer?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <MakerStatusBadge status={project.makerStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <CustomerStatusBadge status={project.customerStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {project.hasIntegrityIssue && (
                          <span className="text-orange-500 text-xs font-medium block">⚡ 整合性問題</span>
                        )}
                        {latestReq && latestReq.alertStatus !== 'none' && (
                          <DeadlineCountdown
                            deadline={latestReq.responseDeadline}
                            alertStatus={latestReq.alertStatus}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 最近の案件 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近更新された案件</CardTitle>
          <Link href="/projects" className="text-sm text-blue-600 hover:underline">
            全件表示 →
          </Link>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">案件</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">A側</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">C側</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">更新日</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project) => (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {project.projectNo}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">{project.name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{project.customer?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <MakerStatusBadge status={project.makerStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <CustomerStatusBadge status={project.customerStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(project.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
