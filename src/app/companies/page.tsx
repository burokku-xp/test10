'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

interface Company {
  id: number
  name: string
  type: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

const TYPE_LABELS: Record<string, string> = {
  maker: 'メーカー (A側)',
  customer: '顧客 (C側)',
  both: '両方',
}

const TYPE_BADGE_VARIANT: Record<string, 'info' | 'success' | 'secondary'> = {
  maker: 'info',
  customer: 'success',
  both: 'secondary',
}

const emptyForm = { name: '', type: 'maker', phone: '', email: '', address: '', notes: '' }

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchCompanies = async () => {
    setLoading(true)
    const res = await fetch('/api/companies')
    setCompanies(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchCompanies() }, [])

  const openCreate = () => {
    setEditCompany(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (company: Company) => {
    setEditCompany(company)
    setForm({
      name: company.name,
      type: company.type,
      phone: company.phone ?? '',
      email: company.email ?? '',
      address: company.address ?? '',
      notes: company.notes ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name) return
    const url = editCompany ? `/api/companies/${editCompany.id}` : '/api/companies'
    const method = editCompany ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      fetchCompanies()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この取引先を削除しますか？')) return
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    if (res.ok) fetchCompanies()
  }

  const makers = companies.filter((c) => c.type === 'maker' || c.type === 'both')
  const customers = companies.filter((c) => c.type === 'customer' || c.type === 'both')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">取引先マスタ</h1>
          <p className="text-gray-500 text-sm">メーカー・顧客の管理</p>
        </div>
        <Button variant="primary" onClick={openCreate}>＋ 取引先追加</Button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* メーカー */}
        <Card>
          <CardHeader><CardTitle>🏭 メーカー (A側) {makers.length}社</CardTitle></CardHeader>
          <CardContent className="px-0 py-0">
            {loading ? (
              <div className="px-6 py-4 text-gray-400 text-sm">読み込み中...</div>
            ) : makers.length === 0 ? (
              <div className="px-6 py-4 text-gray-400 text-sm">メーカーはありません</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {makers.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="font-medium">{c.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={TYPE_BADGE_VARIANT[c.type] ?? 'default'}>
                            {TYPE_LABELS[c.type]}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {c.email && <div>{c.email}</div>}
                        {c.phone && <div>{c.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>編集</Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(c.id)}>削除</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* 顧客 */}
        <Card>
          <CardHeader><CardTitle>🏢 顧客 (C側) {customers.length}社</CardTitle></CardHeader>
          <CardContent className="px-0 py-0">
            {loading ? (
              <div className="px-6 py-4 text-gray-400 text-sm">読み込み中...</div>
            ) : customers.length === 0 ? (
              <div className="px-6 py-4 text-gray-400 text-sm">顧客はありません</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="font-medium">{c.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={TYPE_BADGE_VARIANT[c.type] ?? 'default'}>
                            {TYPE_LABELS[c.type]}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {c.email && <div>{c.email}</div>}
                        {c.phone && <div>{c.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>編集</Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(c.id)}>削除</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 編集・新規モーダル */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editCompany ? '取引先編集' : '取引先追加'}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="maker">メーカー (A側)</option>
              <option value="customer">顧客 (C側)</option>
              <option value="both">両方</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editCompany ? '更新' : '追加'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
