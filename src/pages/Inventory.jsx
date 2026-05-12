import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import FlavorCard from '../components/FlavorCard'
import ModelSelector from '../components/ModelSelector'
import RestockModal from '../components/RestockModal'
import { Package, Search, Plus, Filter } from 'lucide-react'

export default function Inventory() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [reservations, setReservations] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all') // 'all', 'stocked', 'empty'
  const [loading, setLoading] = useState(true)
  const [restockModal, setRestockModal] = useState({ isOpen: false, flavor: null })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [{ data: modelsData }, { data: flavorsData }, { data: reservationsData }] = await Promise.all([
        supabase.from('models').select('*').eq('is_active', true).order('name'),
        supabase.from('flavors').select('*').eq('is_active', true).order('name'),
        supabase.from('reservations').select('flavor_id, quantity').eq('status', 'active')
      ])

      setModels(modelsData || [])
      setFlavors(flavorsData || [])
      setReservations(reservationsData || [])

      if (modelsData && modelsData.length > 0 && !selectedModel) {
        setSelectedModel(modelsData[0])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (flavorId, delta) => {
    const flavor = flavors.find(f => f.id === flavorId)
    if (!flavor) return

    const newStock = Math.max(0, flavor.stock + delta)

    setFlavors(prev => prev.map(f =>
      f.id === flavorId ? { ...f, stock: newStock } : f
    ))

    try {
      const { error } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', flavorId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating stock:', error)
      setFlavors(prev => prev.map(f =>
        f.id === flavorId ? { ...f, stock: flavor.stock } : f
      ))
    }
  }

  const handleRestock = async (data) => {
    try {
      const { error: restockError } = await supabase
        .from('restocks')
        .insert({
          flavor_id: data.flavor_id,
          quantity: data.quantity,
          cost: data.cost,
          notes: data.notes
        })

      if (restockError) throw restockError

      const flavor = flavors.find(f => f.id === data.flavor_id)
      const newStock = flavor.stock + data.quantity

      const { error: updateError } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', data.flavor_id)

      if (updateError) throw updateError

      setFlavors(prev => prev.map(f =>
        f.id === data.flavor_id ? { ...f, stock: newStock } : f
      ))

      setRestockModal({ isOpen: false, flavor: null })
    } catch (error) {
      console.error('Error restocking:', error)
      alert('Error al registrar restock')
    }
  }

  const getReservedQty = (flavorId) => {
    return reservations
      .filter(r => r.flavor_id === flavorId)
      .reduce((sum, r) => sum + r.quantity, 0)
  }

  const filteredFlavors = flavors.filter(f => {
    const matchesModel = !selectedModel || f.model_id === selectedModel.id
    const matchesSearch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.name_es && f.name_es.toLowerCase().includes(search.toLowerCase()))
    const available = f.stock - getReservedQty(f.id)
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'stocked' && available > 0) ||
      (stockFilter === 'empty' && available === 0)
    return matchesModel && matchesSearch && matchesStock
  })

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Package className="w-4 h-4" />
          <span>{flavors.reduce((sum, f) => sum + f.stock, 0)} unidades totales</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar sabor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStockFilter('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStockFilter('stocked')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'stocked'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Con stock
            </button>
            <button
              onClick={() => setStockFilter('empty')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === 'empty'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Agotados
            </button>
          </div>
        </div>
      </div>

      {filteredFlavors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFlavors.map(flavor => (
            <div key={flavor.id} className="relative group">
              <FlavorCard
                flavor={flavor}
                onAdjust={handleAdjust}
                reserved={getReservedQty(flavor.id)}
              />
              <button
                onClick={() => setRestockModal({ isOpen: true, flavor })}
                className="absolute bottom-2 right-2 p-2 bg-green-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-600"
                title="Agregar stock"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron sabores</p>
        </div>
      )}

      <RestockModal
        isOpen={restockModal.isOpen}
        onClose={() => setRestockModal({ isOpen: false, flavor: null })}
        flavor={restockModal.flavor}
        model={selectedModel}
        onConfirm={handleRestock}
      />
    </div>
  )
}
