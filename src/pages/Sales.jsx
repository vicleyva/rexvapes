import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ModelSelector from '../components/ModelSelector'
import SaleModal from '../components/SaleModal'
import { ShoppingCart, Check } from 'lucide-react'

export default function Sales() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [saleModal, setSaleModal] = useState({ isOpen: false, flavor: null })
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')
        .eq('is_active', true)
        .order('name')

      const { data: flavorsData } = await supabase
        .from('flavors')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setModels(modelsData || [])
      setFlavors(flavorsData || [])

      if (modelsData && modelsData.length > 0) {
        setSelectedModel(modelsData[0])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSale = async (saleData) => {
    try {
      // Record sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          flavor_id: saleData.flavor_id,
          quantity: saleData.quantity,
          price: saleData.price,
          total: saleData.total,
          notes: saleData.notes
        })

      if (saleError) throw saleError

      // Update stock
      const flavor = flavors.find(f => f.id === saleData.flavor_id)
      const newStock = flavor.stock - saleData.quantity

      const { error: updateError } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', saleData.flavor_id)

      if (updateError) throw updateError

      // Update local state
      setFlavors(prev => prev.map(f =>
        f.id === saleData.flavor_id ? { ...f, stock: newStock } : f
      ))

      setSaleModal({ isOpen: false, flavor: null })

      // Show success message
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error recording sale:', error)
      alert('Error al registrar venta')
    }
  }

  const getModelFlavors = () => {
    if (!selectedModel) return []
    return flavors.filter(f => f.model_id === selectedModel.id)
  }

  const getStockStyle = (stock) => {
    if (stock === 0) return 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
    if (stock <= 2) return 'bg-yellow-50 border-yellow-300 hover:border-yellow-400 hover:shadow-md cursor-pointer'
    return 'bg-green-50 border-green-300 hover:border-green-400 hover:shadow-md cursor-pointer'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Venta</h1>
        {selectedModel && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Precio por unidad</p>
            <p className="text-xl font-bold text-blue-500">${selectedModel.price} MXN</p>
          </div>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-fade-in">
          <Check className="w-5 h-5" />
          <p className="font-medium">Venta registrada correctamente</p>
        </div>
      )}

      {/* Model selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecciona el modelo
        </label>
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
        />
      </div>

      {/* Flavors grid */}
      {selectedModel ? (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Selecciona el sabor para registrar la venta:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {getModelFlavors().map(flavor => (
              <div
                key={flavor.id}
                onClick={() => flavor.stock > 0 && setSaleModal({ isOpen: true, flavor })}
                className={`rounded-xl border-2 p-4 transition-all ${getStockStyle(flavor.stock)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{flavor.name}</h3>
                    {flavor.name_es && (
                      <p className="text-sm text-gray-500 truncate">{flavor.name_es}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-sm ${flavor.stock === 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                    Stock: {flavor.stock}
                  </span>
                  {flavor.stock > 0 && (
                    <ShoppingCart className="w-5 h-5 text-cyan-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {getModelFlavors().length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No hay sabores para este modelo</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Selecciona un modelo para ver los sabores</p>
        </div>
      )}

      {/* Sale modal */}
      <SaleModal
        isOpen={saleModal.isOpen}
        onClose={() => setSaleModal({ isOpen: false, flavor: null })}
        flavor={saleModal.flavor}
        model={selectedModel}
        onConfirm={handleSale}
      />
    </div>
  )
}
