import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Receipt } from 'lucide-react'
import { requireUser } from '@/lib/rbac'
import { getInvoiceDetail } from '@/lib/services/invoice-service'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  await requireUser()
  const { id } = await params

  const invoice = await getInvoiceDetail(id)

  if (!invoice) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/invoices"
        className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={15} />
        Back to invoices
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Receipt size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Receipt {invoice.loyverseReceiptNumber}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(invoice.receiptDate).toLocaleString()} · {invoice.branch.nameEn}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                invoice.receiptType === 'REFUND'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {invoice.cancelled ? 'Cancelled' : invoice.receiptType}
            </span>
            {invoice.refundFor ? (
              <p className="mt-1 text-xs text-gray-400">Refund for {invoice.refundFor}</p>
            ) : null}
          </div>
        </div>

        {/* Line items */}
        <div className="py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Items</p>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400">
              <tr>
                <th className="pb-2 text-left font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Price</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.lineItems.map(item => (
                <tr key={item.id}>
                  <td className="py-2 text-gray-700">
                    {item.itemName}
                    {item.lineNote ? (
                      <span className="block text-xs text-gray-400">{item.lineNote}</span>
                    ) : null}
                  </td>
                  <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-2 text-right text-gray-600">{item.price}</td>
                  <td className="py-2 text-right font-medium text-gray-800">
                    {item.grossTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 border-t border-dashed border-gray-200 pt-4 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Discount</span>
            <span>-{invoice.totalDiscount}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tax</span>
            <span>{invoice.totalTax}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-800">
            <span>Total</span>
            <span>{invoice.totalMoney} {invoice.currency}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Payments
          </p>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-gray-400">No payment records for this receipt.</p>
          ) : (
            <div className="space-y-1">
              {invoice.payments.map(payment => (
                <div key={payment.id} className="flex justify-between text-sm text-gray-600">
                  <span>{payment.paymentTypeName ?? 'Payment'}</span>
                  <span>{payment.moneyAmount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync metadata */}
        <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400">
          Synced from Loyverse on {new Date(invoice.lastSyncedAt).toLocaleString()}. This record
          mirrors Loyverse and cannot be edited here — Loyverse does not support editing a
          processed receipt.
        </div>
      </div>
    </div>
  )
}
