import { useState, useEffect } from 'react'
import { X, ShoppingCart, Minus, Plus, Gift } from 'lucide-react'

export default function SaleModal({ isOpen, onClose, flavor, model, onConfirm }) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [isInternalUse, setIsInternalUse] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setNotes('')
      setIsInternalUse(false)
    }
  }, [isOpen])

  if (!isOpen || !flavor || !model) return null

  const maxQty = flavor.stock
  const price = isInternalUse ? 0 : model.price
  const total = quantity * price

  const handleConfirm = () => {
    const finalNotes = isInternalUse
      ? `[USO INTERNO] ${notes.trim()}`.trim()
      : notes.trim() || null

    onConfirm({
      flavor_id: flavor.id,
      quantity,
      price,
      total,
      notes: finalNotes
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registrar Venta</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <p className="text-sm text-blue-500 dark:text-blue-400 font-medium">{model.name}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{flavor.name}</h3>
            {flavor.name_es && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{flavor.name_es}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stock disponible: {flavor.stock}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <span className="font-mono text-3xl font-bold w-16 text-center text-gray-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Internal use toggle */}
          <button
            type="button"
            onClick={() => setIsInternalUse(!isInternalUse)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
              isInternalUse
                ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <Gift className={`w-5 h-5 ${isInternalUse ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className={`font-medium ${isInternalUse ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                Uso interno (gratis)
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isInternalUse
                ? 'bg-orange-500 border-orange-500'
                : 'border-gray-300 dark:border-gray-500'
            }`}>
              {isInternalUse && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>

          <div className={`rounded-xl p-4 ${isInternalUse ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Precio unitario:</span>
              <span className={isInternalUse ? 'line-through' : ''}>${model.price} MXN</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
              <span>Total:</span>
              <span className={isInternalUse ? 'text-orange-500 dark:text-orange-400' : 'text-blue-500 dark:text-blue-400'}>
                ${total} MXN {isInternalUse && '(Gratis)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
