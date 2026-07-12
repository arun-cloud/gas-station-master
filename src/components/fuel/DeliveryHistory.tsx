import { Truck } from 'lucide-react'

interface Delivery {
  id:              string
  litresDelivered: number | any
  pricePerLitre:   number | any
  deliveredAt:     Date
  notes:           string | null
  tank: {
    tankNumber: number
    fuelType:   string
  }
  supplier: {
    name: string
  }
}

const fuelLabels: Record<string, string> = {
  PETROL_91:      'Petrol 91',
  PETROL_95:      'Petrol 95',
  DIESEL:         'Diesel',
  PREMIUM_DIESEL: 'Premium Diesel',
}

export default function DeliveryHistory({
  deliveries
}: {
  deliveries: Delivery[]
}) {
  if (deliveries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Truck size={36} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No deliveries recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {['Date', 'Tank', 'Supplier', 'Litres', 'Price/L', 'Total', 'Notes'].map(h => (
              <th key={h}
                className="text-left text-xs font-medium text-gray-400
                  uppercase tracking-wide pb-3 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deliveries.map(d => {
            const litres = Number(d.litresDelivered)
            const price  = Number(d.pricePerLitre)
            const total  = (litres * price).toFixed(2)

            return (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                  {new Date(d.deliveredAt).toLocaleDateString('en-SA', {
                    day:   '2-digit',
                    month: 'short',
                    year:  'numeric',
                  })}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-medium text-gray-700">
                    #{d.tank.tankNumber}
                  </span>
                  <span className="text-gray-400 ml-1.5 text-xs">
                    {fuelLabels[d.tank.fuelType] ?? d.tank.fuelType}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-600">{d.supplier.name}</td>
                <td className="py-3 pr-4 font-mono text-gray-700">
                  {litres.toLocaleString()} L
                </td>
                <td className="py-3 pr-4 font-mono text-gray-700">
                  SAR {price.toFixed(3)}
                </td>
                <td className="py-3 pr-4 font-mono font-medium text-gray-800">
                  SAR {total}
                </td>
                <td className="py-3 text-gray-400 text-xs">
                  {d.notes ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}