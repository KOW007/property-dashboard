import Link from 'next/link'

const tabs = [
  { label: 'Receivables', href: '/accounting/receivables' },
  { label: 'Payables', href: '/accounting/payables' },
  { label: 'Bank Accounts', href: '/accounting/bank-accounts' },
  { label: 'Journal Entries', href: '/accounting/journal-entries' },
  { label: 'Bank Transfers', href: '/accounting/bank-transfers' },
  { label: 'GL Accounts', href: '/accounting/gl-accounts' },
  { label: 'Online Payments', href: '/accounting/online-payments' },
  { label: 'ACH Export', href: '/accounting/ach-export' },
  { label: 'ACH Transactions', href: '/accounting/ach-transactions' },
]

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-8">
      {/* Accounting Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Accounting</h1>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#b22625] hover:bg-gray-50 rounded-t-lg border-b-2 border-transparent hover:border-[#b22625] whitespace-nowrap"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {/* Page Content */}
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}
