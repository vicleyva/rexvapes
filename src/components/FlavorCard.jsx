import { useState } from 'react'
import { Plus, Minus, Calendar, User } from 'lucide-react'

export default function FlavorCard({ flavor, onAdjust, showControls = true, reserved = 0, reservationDetails = [], onShowReservations }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const available = flavor.stock - reserved

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

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    })
  }

  const handleReservationClick = () => {
    if (reservationDetails.length > 2 && onShowReservations) {
      onShowReservations(flavor, reservationDetails)
    }
  }

  // Show max 2 reservations in tooltip
  const tooltipReservations = reservationDetails.slice(0, 2)
  const hasMore = reservationDetails.length > 2

  return (
    <div className={`rounded-xl border-2 p-3 transition-all hover:shadow-md h-full flex flex-col ${getStockColor(available)}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{flavor.name}</h3>
          {flavor.name_es && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{flavor.name_es}</p>
          )}
        </div>
        <span className={`${getStockBadge(available)} text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0`}>
          {available}
        </span>
      </div>

      {showControls && (
        <div className="mt-auto pt-2">
          {reserved > 0 && (
            <div className="text-xs text-center mb-1 relative">
              <span className="text-gray-500 dark:text-gray-400">Stock: {flavor.stock}</span>
              <span
                className={`text-orange-600 dark:text-orange-400 ml-1 ${hasMore ? 'cursor-pointer hover:underline' : 'cursor-help'}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={handleReservationClick}
              >
                | Res: {reserved}
              </span>

              {/* Tooltip */}
              {showTooltip && reservationDetails.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-48">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-lg p-2 shadow-lg text-left">
                    <div className="text-xs font-semibold text-orange-400 mb-1">
                      Reservaciones ({reservationDetails.length})
                    </div>
                    {tooltipReservations.map((r, idx) => (
                      <div key={r.id || idx} className="text-xs py-1 border-t border-gray-700 dark:border-gray-600 first:border-t-0">
                        <div className="flex items-center gap-1 text-gray-200">
                          <User className="w-3 h-3" />
                          <span className="truncate">{r.clients?.name || r.customer_name || 'Sin cliente'}</span>
                          <span className="ml-auto font-bold text-orange-400">x{r.quantity}</span>
                        </div>
                        {r.delivery_date && (
                          <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(r.delivery_date)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {hasMore && (
                      <div className="text-xs text-gray-400 pt-1 border-t border-gray-700 dark:border-gray-600 text-center">
                        +{reservationDetails.length - 2} mas... (clic para ver)
                      </div>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onAdjust(flavor.id, -1)}
              disabled={available === 0}
              className="p-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-sm font-bold w-6 text-center">{available}</span>
            <button
              onClick={() => onAdjust(flavor.id, 1)}
              className="p-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
