import { Plus, Minus } from 'lucide-react'

export default function FlavorCard({ flavor, onAdjust, showControls = true }) {
  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 border-red-300 text-red-700'
    if (stock <= 2) return 'bg-yellow-100 border-yellow-300 text-yellow-700'
    return 'bg-green-100 border-green-300 text-green-700'
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
          <h3 className="font-semibold text-gray-900 truncate">{flavor.name}</h3>
          {flavor.name_es && (
            <p className="text-sm text-gray-500 truncate">{flavor.name_es}</p>
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
            className="p-2 rounded-lg bg-white/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-mono text-lg font-bold w-8 text-center">{flavor.stock}</span>
          <button
            onClick={() => onAdjust(flavor.id, 1)}
            className="p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
