import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AvailabilityCard from '../../components/AvailabilityCard'
import { MessageCircle, MapPin, RefreshCw } from 'lucide-react'

export default function Availability() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch models
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')
        .eq('is_active', true)
        .order('name')

      // Fetch flavors
      const { data: flavorsData } = await supabase
        .from('flavors')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setModels(modelsData || [])
      setFlavors(flavorsData || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getFlavorsByModel = (modelId) => {
    return flavors.filter(f => f.model_id === modelId)
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Disponibilidad</h1>
        <p className="text-gray-600 dark:text-gray-400">Consulta nuestros sabores disponibles</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Actualizado: {formatTime(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Models and flavors */}
      {models.map(model => {
        const modelFlavors = getFlavorsByModel(model.id)
        const availableCount = modelFlavors.filter(f => f.stock > 0).length

        return (
          <div key={model.id} className="mb-8">
            {/* Model header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{model.name}</h2>
                  {model.puffs && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{model.puffs} puffs</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">${model.price}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">MXN</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-green-600 dark:text-green-400">{availableCount}</span> de {modelFlavors.length} sabores disponibles
                </span>
              </div>
            </div>

            {/* Flavors grid */}
            {modelFlavors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modelFlavors.map(flavor => (
                  <AvailabilityCard key={flavor.id} flavor={flavor} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay sabores registrados para este modelo</p>
            )}
          </div>
        )
      })}

      {models.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No hay productos disponibles por el momento</p>
        </div>
      )}

      {/* Contact section */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contacto</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://wa.me/528120187524"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="w-5 h-5" />
            <span>Monterrey, NL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
