import { AlertTriangle } from 'lucide-react'

export default function LowStockAlert({ items }) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Stock Bajo</h3>
        <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span
            key={item.id}
            className="bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 text-sm px-3 py-1 rounded-full"
          >
            {item.name} ({item.stock})
          </span>
        ))}
      </div>
    </div>
  )
}
