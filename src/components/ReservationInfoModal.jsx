import { X, Calendar, User, Package } from 'lucide-react'

export default function ReservationInfoModal({ isOpen, onClose, reservations, flavorName }) {
  if (!isOpen) return null

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reservaciones
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{flavorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {reservations.map((r, idx) => (
            <div
              key={r.id || idx}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{r.clients?.name || r.customer_name || 'Sin cliente'}</span>
                </div>
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {r.quantity}
                </span>
              </div>

              {r.delivery_date && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Entrega: {formatDate(r.delivery_date)}</span>
                </div>
              )}

              {r.notes && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                  {r.notes}
                </p>
              )}

              {r.clients?.phone && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Tel: {r.clients.phone}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total reservado:</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {reservations.reduce((sum, r) => sum + r.quantity, 0)} unidades
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
