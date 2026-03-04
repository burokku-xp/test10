'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { IntegrityStatusPanel } from '@/components/projects/IntegrityStatusPanel'
import { DeadlineCountdown } from '@/components/alerts/DeadlineCountdown'
import { formatDate, formatDateTime } from '@/lib/utils/dateUtils'
import { MAKER_STATUS_OPTIONS, CUSTOMER_STATUS_OPTIONS } from '@/types'

interface Project {
  id: number
  projectNo: string
  name: string
  makerStatus: string
  customerStatus: string
  hasIntegrityIssue: boolean
  integrityIssueDesc?: string
  description?: string
  startDate?: string
  expectedEndDate?: string
  notes?: string
  updatedAt: string
  maker?: { id: number; name: string }
  customer?: { id: number; name: string }
  quotationRequests: QuotationRequest[]
  ordersToMaker: OrderToMaker[]
  customerDeals: CustomerDeal[]
  activityLogs: ActivityLog[]
}

interface QuotationRequest {
  id: number
  requestNo?: string
  subject?: string
  requestDate: string
  responseDeadline?: string
  alertStatus: string
  details?: string
  company?: { name: string }
  quotationResponse?: {
    id: number
    amount?: number
    currency: string
    details?: string
    responseDate: string
  }
}

interface OrderToMaker {
  id: number
  orderNo?: string
  orderDate: string
  amount?: number
  currency: string
  deliveryDate?: string
  status: string
  details?: string
  company?: { name: string }
}

interface CustomerDeal {
  id: number
  dealType: string
  dealNo?: string
  dealDate: string
  amount?: number
  currency: string
  dueDate?: string
  status: string
  details?: string
  company?: { name: string }
}

interface ActivityLog {
  id: number
  action: string
  fieldName?: string
  oldValue?: string
  newValue?: string
  description?: string
  createdAt: string
}

const DEAL_TYPE_LABELS: Record<string, string> = {
  quote: '見積提出',
  order: '受注',
  invoice: '請求',
  payment: '入金確認',
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editStatus, setEditStatus] = useState<{ makerStatus: string; customerStatus: string } | null>(null)

  // モーダル状態
  const [showQRModal, setShowQRModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState<number | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showDealModal, setShowDealModal] = useState(false)

  // フォーム
  const [qrForm, setQrForm] = useState({ subject: '', requestNo: '', responseDeadline: '', details: '' })
  const [responseForm, setResponseForm] = useState({ amount: '', details: '', validUntil: '' })
  const [orderForm, setOrderForm] = useState({ orderNo: '', amount: '', deliveryDate: '', details: '' })
  const [dealForm, setDealForm] = useState({ dealType: 'quote', dealNo: '', amount: '', dueDate: '', details: '' })

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${resolvedParams.id}`)
    if (!res.ok) { router.push('/projects'); return }
    const data = await res.json()
    setProject(data)
    setLoading(false)
  }

  useEffect(() => { fetchProject() }, [resolvedParams.id])

  const updateStatus = async () => {
    if (!editStatus || !project) return
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editStatus),
    })
    if (res.ok) {
      setEditStatus(null)
      fetchProject()
    }
  }

  const createQuotationRequest = async () => {
    if (!project) return
    const res = await fetch('/api/quotation-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...qrForm, projectId: project.id, companyId: project.maker?.id }),
    })
    if (res.ok) { setShowQRModal(false); setQrForm({ subject: '', requestNo: '', responseDeadline: '', details: '' }); fetchProject() }
  }

  const createResponse = async (qrId: number) => {
    const res = await fetch('/api/quotation-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...responseForm, quotationRequestId: qrId }),
    })
    if (res.ok) { setShowResponseModal(null); setResponseForm({ amount: '', details: '', validUntil: '' }); fetchProject() }
  }

  const createOrder = async () => {
    if (!project) return
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderForm, projectId: project.id, companyId: project.maker?.id }),
    })
    if (res.ok) { setShowOrderModal(false); setOrderForm({ orderNo: '', amount: '', deliveryDate: '', details: '' }); fetchProject() }
  }

  const createDeal = async () => {
    if (!project) return
    const res = await fetch('/api/customer-deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dealForm, projectId: project.id, companyId: project.customer?.id }),
    })
    if (res.ok) { setShowDealModal(false); setDealForm({ dealType: 'quote', dealNo: '', amount: '', dueDate: '', details: '' }); fetchProject() }
  }

  if (loading) return <div className="p-6 text-gray-400">読み込み中...</div>
  if (!project) return null

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/projects" className="text-gray-400 hover:text-gray-600 text-sm">← 案件一覧</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 text-sm">{project.projectNo}</p>
        </div>
        <Button variant="ghost" onClick={() => setEditStatus({ makerStatus: project.makerStatus, customerStatus: project.customerStatus })}>
          ステータス変更
        </Button>
      </div>

      {/* 整合性ステータスパネル */}
      <IntegrityStatusPanel
        makerStatus={project.makerStatus}
        customerStatus={project.customerStatus}
        hasIntegrityIssue={project.hasIntegrityIssue}
        integrityIssueDesc={project.integrityIssueDesc}
      />

      <div className="grid grid-cols-3 gap-5">
        {/* 基本情報 */}
        <Card className="col-span-1">
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-gray-500">A側 (仕入先)</div>
              <div className="font-medium">{project.maker?.name ?? '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">C側 (顧客)</div>
              <div className="font-medium">{project.customer?.name ?? '-'}</div>
            </div>
            {project.description && (
              <div>
                <div className="text-xs text-gray-500">概要</div>
                <div className="text-gray-700">{project.description}</div>
              </div>
            )}
            {project.startDate && (
              <div>
                <div className="text-xs text-gray-500">開始日</div>
                <div>{formatDate(project.startDate)}</div>
              </div>
            )}
            {project.expectedEndDate && (
              <div>
                <div className="text-xs text-gray-500">予定完了日</div>
                <div>{formatDate(project.expectedEndDate)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500">最終更新</div>
              <div>{formatDate(project.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>

        {/* A側: 見積依頼 */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>A側 見積依頼</CardTitle>
            <Button size="sm" variant="primary" onClick={() => setShowQRModal(true)}>
              ＋ 見積依頼
            </Button>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {project.quotationRequests.length === 0 ? (
              <div className="px-6 py-4 text-sm text-gray-400">見積依頼はありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-2 text-xs text-gray-500">依頼No</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">件名</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">回答期限</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">回答金額</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {project.quotationRequests.map((qr) => (
                    <tr key={qr.id} className="border-b border-gray-50">
                      <td className="px-5 py-2 text-gray-600">{qr.requestNo || `#${qr.id}`}</td>
                      <td className="px-4 py-2">{qr.subject || '-'}</td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-500">{formatDate(qr.responseDeadline)}</div>
                        <DeadlineCountdown deadline={qr.responseDeadline} alertStatus={qr.alertStatus} />
                      </td>
                      <td className="px-4 py-2">
                        {qr.quotationResponse ? (
                          <span className="text-green-600 font-medium">
                            ¥{qr.quotationResponse.amount?.toLocaleString() ?? '未定'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">未回答</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {!qr.quotationResponse && (
                          <Button size="sm" variant="ghost" onClick={() => setShowResponseModal(qr.id)}>
                            回答登録
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* A側: 発注 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>A側 発注情報</CardTitle>
            <Button size="sm" variant="primary" onClick={() => setShowOrderModal(true)}>＋ 発注登録</Button>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {project.ordersToMaker.length === 0 ? (
              <div className="px-6 py-4 text-sm text-gray-400">発注情報はありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-2 text-xs text-gray-500">発注No</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">金額</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">納期</th>
                  </tr>
                </thead>
                <tbody>
                  {project.ordersToMaker.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50">
                      <td className="px-5 py-2 text-gray-600">{order.orderNo || `#${order.id}`}</td>
                      <td className="px-4 py-2">¥{order.amount?.toLocaleString() ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{formatDate(order.deliveryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* C側: 取引 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>C側 取引情報</CardTitle>
            <Button size="sm" variant="primary" onClick={() => setShowDealModal(true)}>＋ C側登録</Button>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {project.customerDeals.length === 0 ? (
              <div className="px-6 py-4 text-sm text-gray-400">C側取引情報はありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-2 text-xs text-gray-500">種別</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">金額</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">日付</th>
                  </tr>
                </thead>
                <tbody>
                  {project.customerDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-gray-50">
                      <td className="px-5 py-2">
                        <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}
                        </span>
                      </td>
                      <td className="px-4 py-2">¥{deal.amount?.toLocaleString() ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{formatDate(deal.dealDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 活動タイムライン */}
      <Card>
        <CardHeader><CardTitle>活動タイムライン</CardTitle></CardHeader>
        <CardContent>
          {project.activityLogs.length === 0 ? (
            <div className="text-sm text-gray-400">活動ログはありません</div>
          ) : (
            <div className="space-y-3">
              {project.activityLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="text-gray-400 text-xs mt-0.5 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </div>
                  <div className="text-gray-700">{log.description}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* モーダル: ステータス変更 */}
      <Modal isOpen={!!editStatus} onClose={() => setEditStatus(null)} title="ステータス変更">
        {editStatus && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">A側ステータス</label>
              <select
                value={editStatus.makerStatus}
                onChange={(e) => setEditStatus({ ...editStatus, makerStatus: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {MAKER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">C側ステータス</label>
              <select
                value={editStatus.customerStatus}
                onChange={(e) => setEditStatus({ ...editStatus, customerStatus: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {CUSTOMER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditStatus(null)}>キャンセル</Button>
              <Button variant="primary" onClick={updateStatus}>更新</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* モーダル: 見積依頼 */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="見積依頼作成">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">依頼番号</label>
            <input type="text" value={qrForm.requestNo} onChange={(e) => setQrForm({ ...qrForm, requestNo: e.target.value })} placeholder="QR-2024-XXX" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
            <input type="text" value={qrForm.subject} onChange={(e) => setQrForm({ ...qrForm, subject: e.target.value })} placeholder="見積依頼件名" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">回答期限</label>
            <input type="date" value={qrForm.responseDeadline} onChange={(e) => setQrForm({ ...qrForm, responseDeadline: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
            <textarea value={qrForm.details} onChange={(e) => setQrForm({ ...qrForm, details: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowQRModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={createQuotationRequest}>作成</Button>
          </div>
        </div>
      </Modal>

      {/* モーダル: 見積回答 */}
      <Modal isOpen={showResponseModal !== null} onClose={() => setShowResponseModal(null)} title="見積回答登録">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円)</label>
            <input type="number" value={responseForm.amount} onChange={(e) => setResponseForm({ ...responseForm, amount: e.target.value })} placeholder="1500000" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">有効期限</label>
            <input type="date" value={responseForm.validUntil} onChange={(e) => setResponseForm({ ...responseForm, validUntil: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea value={responseForm.details} onChange={(e) => setResponseForm({ ...responseForm, details: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowResponseModal(null)}>キャンセル</Button>
            <Button variant="primary" onClick={() => showResponseModal && createResponse(showResponseModal)}>登録</Button>
          </div>
        </div>
      </Modal>

      {/* モーダル: 発注 */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="発注登録">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">発注番号</label>
            <input type="text" value={orderForm.orderNo} onChange={(e) => setOrderForm({ ...orderForm, orderNo: e.target.value })} placeholder="PO-2024-XXX" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円)</label>
            <input type="number" value={orderForm.amount} onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">納期</label>
            <input type="date" value={orderForm.deliveryDate} onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea value={orderForm.details} onChange={(e) => setOrderForm({ ...orderForm, details: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOrderModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={createOrder}>発注登録</Button>
          </div>
        </div>
      </Modal>

      {/* モーダル: C側取引 */}
      <Modal isOpen={showDealModal} onClose={() => setShowDealModal(false)} title="C側取引登録">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
            <select value={dealForm.dealType} onChange={(e) => setDealForm({ ...dealForm, dealType: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="quote">見積提出</option>
              <option value="order">受注</option>
              <option value="invoice">請求</option>
              <option value="payment">入金確認</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">番号</label>
            <input type="text" value={dealForm.dealNo} onChange={(e) => setDealForm({ ...dealForm, dealNo: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円)</label>
            <input type="number" value={dealForm.amount} onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
            <input type="date" value={dealForm.dueDate} onChange={(e) => setDealForm({ ...dealForm, dueDate: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea value={dealForm.details} onChange={(e) => setDealForm({ ...dealForm, details: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDealModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={createDeal}>登録</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
