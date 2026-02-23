interface Receivable {
  date: string
  description: string
  amount: number | string
  type: string
  reference?: string
}

interface Props {
  history: Receivable[] | null
  isPreview?: boolean
}

export default function PortalPaymentsContent({ history, isPreview }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payments</h1>

      <div className={isPreview ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Payment History</h2>
          {history && history.length > 0 ? (
            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase pb-2">
                <span>Date</span>
                <span>Description</span>
                <span className="text-right">Amount</span>
              </div>
              {history.map((item, i) => (
                <div key={i} className="grid grid-cols-3 py-3 text-sm">
                  <span className="text-gray-500">
                    {new Date(item.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-gray-700">{item.description}</span>
                  <span className={`text-right font-semibold ${item.type === 'receipt' ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.type === 'receipt' ? '-' : ''}${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No payment history available.</p>
          )}
        </div>

        {/* ACH note for preview */}
        {isPreview && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">ACH / Auto-Pay Setup</h2>
            <p className="text-sm text-gray-400 italic">
              Bank info form is available to the tenant in their portal. Not shown in admin preview.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
