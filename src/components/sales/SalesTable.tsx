interface SaleRow {
  id: string
  fuelType: string
  litres: unknown
  pricePerLitre: unknown
  totalAmount: unknown
  paymentMethod: string
  createdAt: Date
  dispenser: { dispenserNumber: number }
  user: { name: string }
  customer: { name: string } | null
}

const fuelLabels: Record<string, string> = {
  PETROL_91: 'Petrol 91',
  PETROL_95: 'Petrol 95',
  DIESEL: 'Diesel',
  PREMIUM_DIESEL: 'Premium Diesel',
}

const paymentColors: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700',
  CARD: 'bg-blue-100  text-blue-700',
  LOYALTY_POINTS: 'bg-purple-100 text-purple-700',
}

export default function SalesTable({ sales }: { sales: SaleRow[] }) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No sales recorded yet today.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {['Time', 'Pump', 'Fuel', 'Litres', 'Price/L',
              'Total', 'Payment', 'Cashier', 'Customer'].map(h => (
                <th key={h}
                  className="text-left text-xs font-medium text-gray-400
                  uppercase tracking-wide pb-3 pr-4 whitespace-nowrap">
                  {h}
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sales.map(sale => (
            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                {new Date(sale.createdAt).toLocaleTimeString('en-SA', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="py-3 pr-4 font-medium text-gray-700">
                #{sale.dispenser.dispenserNumber}
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {fuelLabels[sale.fuelType] ?? sale.fuelType}
              </td>
              <td className="py-3 pr-4 font-mono text-gray-700">
                {Number(sale.litres).toFixed(2)}
              </td>
              <td className="py-3 pr-4 font-mono text-gray-500">
                {Number(sale.pricePerLitre).toFixed(3)}
              </td>
              <td className="py-3 pr-4 font-mono font-semibold text-gray-800">
                SAR {Number(sale.totalAmount).toFixed(2)}
              </td>
              <td className="py-3 pr-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${paymentColors[sale.paymentMethod] ?? 'bg-gray-100 text-gray-600'}`}>
                  {sale.paymentMethod.replace('_', ' ')}
                </span>
              </td>
              <td className="py-3 pr-4 text-gray-600">{sale.user.name}</td>
              <td className="py-3 text-gray-400 text-xs">
                {sale.customer?.name ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}