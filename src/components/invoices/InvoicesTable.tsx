import Link from 'next/link'
import { Receipt } from 'lucide-react'
import type { InvoiceListItem } from '@/lib/services/invoice-service'

type InvoicesTableProps = {
  invoices: InvoiceListItem[]
}

export default function InvoicesTable({ invoices }: InvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-400">
        <Receipt size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No invoices match these filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Receipt #</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 text-right font-medium">Paid</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map(invoice => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {invoice.loyverseReceiptNumber}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(invoice.receiptDate).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    invoice.receiptType === 'REFUND'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {invoice.cancelled ? 'Cancelled' : invoice.receiptType}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{invoice.paymentSummary}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-800">
                {invoice.totalMoney}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">{invoice.totalPaid}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="text-sm font-medium text-amber-600 hover:text-amber-500"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
