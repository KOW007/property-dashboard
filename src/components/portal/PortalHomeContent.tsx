import Link from 'next/link'

interface Charge {
  description: string
  amount: number | string
  date: string
  type: string
}

interface Lease {
  monthly_rent: number | string
  start_date: string
  end_date: string
}

interface MaintenanceRequest {
  id: string
  title: string
  status: string
  reported_date: string
}

interface Props {
  charges: Charge[] | null
  lease: Lease | null
  openRequests: MaintenanceRequest[] | null
  isPreview?: boolean
}

export default function PortalHomeContent({ charges, lease, openRequests, isPreview }: Props) {
  const totalBalance = charges?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0
  const nextCharge = charges?.[0]

  const paymentsHref = isPreview ? undefined : '/portal/payments'
  const maintenanceHref = isPreview ? undefined : '/portal/maintenance'

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Home</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-green-500 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Current Balance</h2>
          <div className="text-5xl font-bold text-gray-900 mb-1">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          {nextCharge && (
            <p className="text-sm text-gray-500 mb-6">
              Next bill due on {new Date(nextCharge.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          {!isPreview && (
            <div className="flex gap-3 mb-6">
              <Link
                href={paymentsHref!}
                className="flex-1 bg-[#2d2d2d] text-white text-center py-2.5 rounded-lg hover:bg-black font-medium text-sm"
              >
                Make a Payment
              </Link>
              <Link
                href={paymentsHref!}
                className="flex-1 border border-gray-300 text-gray-700 text-center py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Set Up Auto-Pay
              </Link>
            </div>
          )}

          {/* Upcoming Charges */}
          {charges && charges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Upcoming Charges
              </h3>
              <div className="divide-y divide-gray-100">
                {charges.slice(0, 5).map((charge, i) => (
                  <div key={i} className="flex justify-between py-2.5 text-sm">
                    <div>
                      <div className="font-medium text-gray-800">{charge.description}</div>
                      <div className="text-xs text-gray-400">
                        Due on {new Date(charge.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      ${Number(charge.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!charges || charges.length === 0) && (
            <p className="text-sm text-gray-400">No upcoming charges.</p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Lease Info */}
          {lease && (
            <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Lease Summary</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Monthly Rent</p>
                  <p className="text-xl font-bold text-gray-900">${Number(lease.monthly_rent).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lease Ends</p>
                  <p className="text-xl font-bold text-gray-900">
                    {new Date(lease.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Requests */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Maintenance Requests</h2>
            {!isPreview && (
              <Link
                href={maintenanceHref!}
                className="block w-full bg-[#2d2d2d] text-white text-center py-2.5 rounded-lg hover:bg-black font-medium text-sm mb-4"
              >
                Request Maintenance
              </Link>
            )}
            {openRequests && openRequests.length > 0 ? (
              <div className="space-y-2">
                {openRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{req.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {req.status === 'in_progress' ? 'In Progress' : 'Open'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">You currently do not have any open maintenance requests.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
