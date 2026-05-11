import { AlertTriangle } from 'lucide-react'

export default function LowStockAlert({ items }) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Stock Bajo</h3>
        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span
            key={item.id}
            className="bg-white border border-yellow-300 text-yellow-800 text-sm px-3 py-1 rounded-full"
          >
            {item.name} ({item.stock})
          </span>
        ))}
      </div>
    </div>
  )
}
