import { useState, useEffect } from 'react'
import { X, Package, Minus, Plus } from 'lucide-react'

export default function RestockModal({ isOpen, onClose, flavor, model, onConfirm }) {
  const [quantity, setQuantity] = useState(1)
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setCost(model?.cost ? model.cost.toString() : '')
      setNotes('')
    }
  }, [isOpen, model])

  if (!isOpen || !flavor || !model) return null

  const handleConfirm = () => {
    onConfirm({
      flavor_id: flavor.id,
      quantity,
      cost: cost ? parseFloat(cost) : null,
      notes: notes.trim() || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registrar Restock</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">{model.name}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{flavor.name}</h3>
            {flavor.name_es && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{flavor.name_es}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stock actual: {flavor.stock}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad a agregar</label>
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
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nuevo stock será:</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{flavor.stock + quantity}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Costo de compra (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                step="10"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-16 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">MXN</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Compra a proveedor X..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
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
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Agregar Stock
          </button>
        </div>
      </div>
    </div>
  )
}
