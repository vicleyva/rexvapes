import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Settings as SettingsIcon, Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react'

export default function Settings() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingModel, setEditingModel] = useState(null)
  const [newModel, setNewModel] = useState({ name: '', puffs: '', price: '' })
  const [showNewModel, setShowNewModel] = useState(false)
  const [editingFlavor, setEditingFlavor] = useState(null)
  const [newFlavor, setNewFlavor] = useState({ name: '', name_es: '', model_id: '' })
  const [showNewFlavor, setShowNewFlavor] = useState(false)
  const [selectedModelForFlavors, setSelectedModelForFlavors] = useState(null)

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

      if (modelsData && modelsData.length > 0 && !selectedModelForFlavors) {
        setSelectedModelForFlavors(modelsData[0].id)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Model CRUD
  const handleAddModel = async () => {
    if (!newModel.name || !newModel.price) return

    try {
      const { error } = await supabase.from('models').insert({
        name: newModel.name,
        puffs: newModel.puffs ? parseInt(newModel.puffs) : null,
        price: parseFloat(newModel.price)
      })

      if (error) throw error

      setNewModel({ name: '', puffs: '', price: '' })
      setShowNewModel(false)
      fetchData()
    } catch (error) {
      console.error('Error adding model:', error)
      alert('Error al agregar modelo')
    }
  }

  const handleUpdateModel = async () => {
    if (!editingModel) return

    try {
      const { error } = await supabase
        .from('models')
        .update({
          name: editingModel.name,
          puffs: editingModel.puffs,
          price: editingModel.price
        })
        .eq('id', editingModel.id)

      if (error) throw error

      setEditingModel(null)
      fetchData()
    } catch (error) {
      console.error('Error updating model:', error)
      alert('Error al actualizar modelo')
    }
  }

  const handleDeleteModel = async (modelId) => {
    if (!confirm('¿Eliminar este modelo? Los sabores asociados también se desactivarán.')) return

    try {
      // Soft delete model
      const { error: modelError } = await supabase
        .from('models')
        .update({ is_active: false })
        .eq('id', modelId)

      if (modelError) throw modelError

      // Soft delete associated flavors
      await supabase
        .from('flavors')
        .update({ is_active: false })
        .eq('model_id', modelId)

      fetchData()
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Error al eliminar modelo')
    }
  }

  // Flavor CRUD
  const handleAddFlavor = async () => {
    if (!newFlavor.name || !newFlavor.model_id) return

    try {
      const { error } = await supabase.from('flavors').insert({
        name: newFlavor.name,
        name_es: newFlavor.name_es || null,
        model_id: newFlavor.model_id,
        stock: 0
      })

      if (error) throw error

      setNewFlavor({ name: '', name_es: '', model_id: selectedModelForFlavors })
      setShowNewFlavor(false)
      fetchData()
    } catch (error) {
      console.error('Error adding flavor:', error)
      alert('Error al agregar sabor')
    }
  }

  const handleUpdateFlavor = async () => {
    if (!editingFlavor) return

    try {
      const { error } = await supabase
        .from('flavors')
        .update({
          name: editingFlavor.name,
          name_es: editingFlavor.name_es,
          min_stock: editingFlavor.min_stock
        })
        .eq('id', editingFlavor.id)

      if (error) throw error

      setEditingFlavor(null)
      fetchData()
    } catch (error) {
      console.error('Error updating flavor:', error)
      alert('Error al actualizar sabor')
    }
  }

  const handleDeleteFlavor = async (flavorId) => {
    if (!confirm('¿Eliminar este sabor?')) return

    try {
      const { error } = await supabase
        .from('flavors')
        .update({ is_active: false })
        .eq('id', flavorId)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error deleting flavor:', error)
      alert('Error al eliminar sabor')
    }
  }

  const getModelFlavors = (modelId) => {
    return flavors.filter(f => f.model_id === modelId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Models section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Modelos</h2>
            </div>
            <button
              onClick={() => setShowNewModel(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {/* New model form */}
          {showNewModel && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Puffs"
                  value={newModel.puffs}
                  onChange={(e) => setNewModel({ ...newModel, puffs: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={newModel.price}
                  onChange={(e) => setNewModel({ ...newModel, price: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddModel}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <Check className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => { setShowNewModel(false); setNewModel({ name: '', puffs: '', price: '' }) }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Models list */}
          <div className="space-y-3">
            {models.map(model => (
              <div key={model.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                {editingModel?.id === model.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editingModel.name}
                        onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={editingModel.puffs || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, puffs: e.target.value ? parseInt(e.target.value) : null })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={editingModel.price}
                        onChange={(e) => setEditingModel({ ...editingModel, price: parseFloat(e.target.value) })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateModel}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingModel(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{model.name}</p>
                      <p className="text-sm text-gray-500">
                        {model.puffs && `${model.puffs} puffs • `}${getModelFlavors(model.id).length} sabores
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-600">${model.price}</span>
                      <button
                        onClick={() => setEditingModel(model)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flavors section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sabores</h2>
            </div>
            <button
              onClick={() => { setShowNewFlavor(true); setNewFlavor({ ...newFlavor, model_id: selectedModelForFlavors }) }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {/* Model selector for flavors */}
          <select
            value={selectedModelForFlavors || ''}
            onChange={(e) => setSelectedModelForFlavors(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>

          {/* New flavor form */}
          {showNewFlavor && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-3 mb-3">
                <input
                  type="text"
                  placeholder="Nombre (inglés)"
                  value={newFlavor.name}
                  onChange={(e) => setNewFlavor({ ...newFlavor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Nombre (español) - opcional"
                  value={newFlavor.name_es}
                  onChange={(e) => setNewFlavor({ ...newFlavor, name_es: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddFlavor}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => { setShowNewFlavor(false); setNewFlavor({ name: '', name_es: '', model_id: '' }) }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Flavors list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getModelFlavors(selectedModelForFlavors).map(flavor => (
              <div key={flavor.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                {editingFlavor?.id === flavor.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingFlavor.name}
                      onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={editingFlavor.name_es || ''}
                      onChange={(e) => setEditingFlavor({ ...editingFlavor, name_es: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Nombre español"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateFlavor}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingFlavor(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{flavor.name}</p>
                      {flavor.name_es && (
                        <p className="text-sm text-gray-500 truncate">{flavor.name_es}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        flavor.stock === 0 ? 'bg-red-100 text-red-700' :
                        flavor.stock <= 2 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {flavor.stock}
                      </span>
                      <button
                        onClick={() => setEditingFlavor(flavor)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlavor(flavor.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {getModelFlavors(selectedModelForFlavors).length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay sabores para este modelo</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
