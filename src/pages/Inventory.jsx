import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import FlavorCard from '../components/FlavorCard'
import ModelSelector from '../components/ModelSelector'
import RestockModal from '../components/RestockModal'
import { Package, Search, Plus } from 'lucide-react'

export default function Inventory() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [restockModal, setRestockModal] = useState({ isOpen: false, flavor: null })

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

    // Optimistic update
    setFlavors(prev => prev.map(f =>
      f.id === flavorId ? { ...f, stock: newStock } : f
    ))

    try {
      const { error } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', flavorId)

      if (error) throw error

      // If decrementing (sale-like action), could record it
      // For now, just update stock

    } catch (error) {
      console.error('Error updating stock:', error)
      // Revert on error
      setFlavors(prev => prev.map(f =>
        f.id === flavorId ? { ...f, stock: flavor.stock } : f
      ))
    }
  }

  const handleRestock = async (data) => {
    try {
      // Record restock
      const { error: restockError } = await supabase
        .from('restocks')
        .insert({
          flavor_id: data.flavor_id,
          quantity: data.quantity,
          cost: data.cost,
          notes: data.notes
        })

      if (restockError) throw restockError

      // Update stock
      const flavor = flavors.find(f => f.id === data.flavor_id)
      const newStock = flavor.stock + data.quantity

      const { error: updateError } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', data.flavor_id)

      if (updateError) throw updateError

      // Update local state
      setFlavors(prev => prev.map(f =>
        f.id === data.flavor_id ? { ...f, stock: newStock } : f
      ))

      setRestockModal({ isOpen: false, flavor: null })
    } catch (error) {
      console.error('Error restocking:', error)
      alert('Error al registrar restock')
    }
  }

  const filteredFlavors = flavors.filter(f => {
    const matchesModel = !selectedModel || f.model_id === selectedModel.id
    const matchesSearch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.name_es && f.name_es.toLowerCase().includes(search.toLowerCase()))
    return matchesModel && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>{flavors.reduce((sum, f) => sum + f.stock, 0)} unidades totales</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Inventory grid */}
      {filteredFlavors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFlavors.map(flavor => (
            <div key={flavor.id} className="relative group">
              <FlavorCard
                flavor={flavor}
                onAdjust={handleAdjust}
              />
              <button
                onClick={() => setRestockModal({ isOpen: true, flavor })}
                className="absolute top-2 right-2 p-2 bg-green-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-600"
                title="Agregar stock"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron sabores</p>
        </div>
      )}

      {/* Restock modal */}
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
