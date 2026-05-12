import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AvailabilityCard from '../../components/AvailabilityCard'
import { MessageCircle, MapPin, RefreshCw, LayoutGrid, List, Check, X } from 'lucide-react'

export default function Availability() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('rexvapes_viewmode') || 'cards'
  })

  const toggleViewMode = (mode) => {
    setViewMode(mode)
    localStorage.setItem('rexvapes_viewmode', mode)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: modelsData }, { data: flavorsData }, { data: reservationsData }] = await Promise.all([
        supabase.from('models').select('*').eq('is_active', true).order('name'),
        supabase.from('flavors').select('*').eq('is_active', true).order('name'),
        supabase.from('reservations').select('flavor_id, quantity').eq('status', 'active')
      ])

      setModels(modelsData || [])
      setFlavors(flavorsData || [])
      setReservations(reservationsData || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Refresh data when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const getReservedQty = (flavorId) => {
    return reservations
      .filter(r => r.flavor_id === flavorId)
      .reduce((sum, r) => sum + r.quantity, 0)
  }

  const getFlavorsByModel = (modelId) => {
    return flavors
      .filter(f => f.model_id === modelId)
      .map(f => ({
        ...f,
        stock: Math.max(0, f.stock - getReservedQty(f.id)) // Available = stock - reserved
      }))
      .sort((a, b) => (b.stock > 0) - (a.stock > 0)) // Available first, then out of stock
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
        {/* View toggle */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => toggleViewMode('cards')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
          <button
            onClick={() => toggleViewMode('rows')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'rows'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
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

            {/* Flavors display */}
            {modelFlavors.length > 0 ? (
              viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
                  {modelFlavors.map(flavor => (
                    <AvailabilityCard key={flavor.id} flavor={flavor} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {modelFlavors.map((flavor, idx) => {
                    const isAvailable = flavor.stock > 0
                    return (
                      <div
                        key={flavor.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          idx !== modelFlavors.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                        } ${isAvailable ? '' : 'opacity-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAvailable ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                          }`}>
                            {isAvailable ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <X className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <span className={`font-medium ${isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                              {flavor.name}
                            </span>
                            {flavor.name_es && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                {flavor.name_es}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${
                          isAvailable ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {isAvailable ? 'Disponible' : 'Agotado'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
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
