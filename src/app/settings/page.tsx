'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface Setting {
  id: number
  settingKey: string
  settingValue: string
  description?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [warningDays, setWarningDays] = useState('3')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data: Setting[]) => {
        setSettings(data)
        const warnSetting = data.find((s) => s.settingKey === 'warning_days_before')
        if (warnSetting) setWarningDays(warnSetting.settingValue)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settingKey: 'warning_days_before', settingValue: warningDays }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-6 text-gray-400">読み込み中...</div>

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-500 text-sm">アラートと通知の設定</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>⚠️ アラート設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              見積回答期限の警告日数
            </label>
            <p className="text-xs text-gray-500 mb-2">
              回答期限のX日前から「警告」アラートを表示します
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="30"
                value={warningDays}
                onChange={(e) => setWarningDays(e.target.value)}
                className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">日前から警告</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '設定を保存'}
            </Button>
            {saved && (
              <span className="ml-3 text-green-600 text-sm">✅ 保存しました</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 整合性チェックルール</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="font-semibold text-red-700 mb-1">🚨 高優先度</div>
              <ul className="space-y-1 text-red-600 text-xs">
                <li>• A側が「発注済以降」かつ C側が「未着手」</li>
                <li>• A側が「納期確認済以降」かつ C側が「見積中以前」</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="font-semibold text-yellow-700 mb-1">⚠️ 中優先度</div>
              <ul className="space-y-1 text-yellow-600 text-xs">
                <li>• A側が「出荷済」かつ C側が「請求未実施」</li>
              </ul>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ※ 整合性チェックはステータス変更時に自動実行されます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
