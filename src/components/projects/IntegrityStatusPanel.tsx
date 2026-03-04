import { MakerStatusBadge, CustomerStatusBadge } from './StatusBadge'
import { MAKER_STATUS_OPTIONS, CUSTOMER_STATUS_OPTIONS } from '@/types'

interface IntegrityStatusPanelProps {
  makerStatus: string
  customerStatus: string
  hasIntegrityIssue: boolean
  integrityIssueDesc?: string | null
}

export function IntegrityStatusPanel({
  makerStatus,
  customerStatus,
  hasIntegrityIssue,
  integrityIssueDesc,
}: IntegrityStatusPanelProps) {
  const makerIdx = MAKER_STATUS_OPTIONS.findIndex((o) => o.value === makerStatus)
  const customerIdx = CUSTOMER_STATUS_OPTIONS.findIndex((o) => o.value === customerStatus)

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {hasIntegrityIssue && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
          <span className="text-orange-500 font-semibold">⚡ 整合性問題</span>
          <span className="text-orange-700 text-sm">{integrityIssueDesc}</span>
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* A側 (メーカー) */}
        <div className="p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            A側 (メーカー)
          </div>
          <div className="mb-3">
            <MakerStatusBadge status={makerStatus} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {MAKER_STATUS_OPTIONS.map((option, idx) => (
              <div
                key={option.value}
                className={`
                  text-xs px-1.5 py-0.5 rounded
                  ${idx < makerIdx
                    ? 'bg-blue-100 text-blue-700'
                    : idx === makerIdx
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
                title={option.label}
              >
                {idx + 1}
              </div>
            ))}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {MAKER_STATUS_OPTIONS[makerIdx]?.label}
          </div>
        </div>

        {/* C側 (顧客) */}
        <div className="p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            C側 (顧客)
          </div>
          <div className="mb-3">
            <CustomerStatusBadge status={customerStatus} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CUSTOMER_STATUS_OPTIONS.map((option, idx) => (
              <div
                key={option.value}
                className={`
                  text-xs px-1.5 py-0.5 rounded
                  ${idx < customerIdx
                    ? 'bg-green-100 text-green-700'
                    : idx === customerIdx
                    ? 'bg-green-600 text-white font-medium'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
                title={option.label}
              >
                {idx + 1}
              </div>
            ))}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {CUSTOMER_STATUS_OPTIONS[customerIdx]?.label}
          </div>
        </div>
      </div>
    </div>
  )
}
