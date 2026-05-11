import { Plus, Minus } from 'lucide-react'

export default function FlavorCard({ flavor, onAdjust, showControls = true }) {
  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
    if (stock <= 2) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
    return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
  }

  const getStockBadge = (stock) => {
    if (stock === 0) return 'bg-red-500'
    if (stock <= 2) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${getStockColor(flavor.stock)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{flavor.name}</h3>
          {flavor.name_es && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{flavor.name_es}</p>
          )}
        </div>
        <span className={`${getStockBadge(flavor.stock)} text-white text-sm font-bold px-2 py-1 rounded-full ml-2`}>
          {flavor.stock}
        </span>
      </div>

      {showControls && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={() => onAdjust(flavor.id, -1)}
            disabled={flavor.stock === 0}
            className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-mono text-lg font-bold w-8 text-center">{flavor.stock}</span>
          <button
            onClick={() => onAdjust(flavor.id, 1)}
            className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
