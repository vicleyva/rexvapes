import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MessageCircle, Copy, Check, RefreshCw, Image, FileText, Palette } from 'lucide-react'

const GRADIENTS = [
  { id: 'sunset', name: 'Sunset', class: 'from-purple-600 via-pink-500 to-orange-400' },
  { id: 'ocean', name: 'Ocean', class: 'from-cyan-500 via-blue-500 to-purple-600' },
  { id: 'fire', name: 'Fire', class: 'from-yellow-400 via-orange-500 to-red-600' },
  { id: 'forest', name: 'Forest', class: 'from-green-400 via-emerald-500 to-teal-600' },
  { id: 'candy', name: 'Candy', class: 'from-pink-400 via-purple-500 to-indigo-600' },
  { id: 'midnight', name: 'Midnight', class: 'from-slate-900 via-purple-900 to-slate-900' },
  { id: 'lime', name: 'Lime', class: 'from-lime-400 via-green-500 to-emerald-600' },
  { id: 'berry', name: 'Berry', class: 'from-rose-500 via-fuchsia-500 to-violet-600' },
]

export default function Promo() {
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [reservations, setReservations] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('visual') // 'visual' or 'text'
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0])

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

      if (modelsData && modelsData.length > 0) {
        setSelectedModel(modelsData[0])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReservedQty = (flavorId) => {
    return reservations
      .filter(r => r.flavor_id === flavorId)
      .reduce((sum, r) => sum + r.quantity, 0)
  }

  const getAvailableFlavors = () => {
    if (!selectedModel) return []
    return flavors
      .filter(f => f.model_id === selectedModel.id)
      .map(f => ({
        ...f,
        available: f.stock - getReservedQty(f.id)
      }))
      .filter(f => f.available > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const generatePromoText = () => {
    if (!selectedModel) return ''

    const available = getAvailableFlavors()
    const lines = []

    lines.push(`🔥 *${selectedModel.name}* 🔥`)
    if (selectedModel.puffs) {
      lines.push(`💨 ${selectedModel.puffs} puffs`)
    }
    lines.push(`💰 *$${selectedModel.price} MXN*`)
    lines.push('')
    lines.push(`✅ *Sabores disponibles (${available.length}):*`)
    lines.push('')

    available.forEach(f => {
      const name = f.name_es ? `${f.name} / ${f.name_es}` : f.name
      lines.push(`• ${name}`)
    })

    lines.push('')
    lines.push('📍 Monterrey, NL')
    lines.push('📲 Envíos y entregas')
    lines.push('')
    lines.push('¡Escríbenos! 💬')

    return lines.join('\n')
  }

  const copyToClipboard = async () => {
    const text = generatePromoText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  const openWhatsApp = () => {
    const text = encodeURIComponent(generatePromoText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const availableFlavors = getAvailableFlavors()

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promoción WhatsApp</h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Model selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shrink-0">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecciona modelo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedModel?.id === model.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{model.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">${model.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button
          onClick={() => setActiveTab('visual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'visual'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Image className="w-4 h-4" />
          Visual
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          Texto
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'visual' ? (
          /* Visual Promo Card - Screenshot ready */
          <div className="space-y-4">
            {/* Gradient selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {GRADIENTS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGradient(g)}
                  title={g.name}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.class} transition-all ${
                    selectedGradient.id === g.id
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>

            {/* Promo card */}
            <div className="flex justify-center">
              <div
                id="promo-card"
                className={`bg-gradient-to-br ${selectedGradient.class} rounded-3xl p-6 max-w-2xl w-full shadow-2xl`}
              >
                {/* Logo */}
                <div className="flex justify-center mb-4">
                  <img
                    src={import.meta.env.BASE_URL + "logo.png"}
                    alt="Rex Vapes"
                    className="w-28 h-28 object-contain drop-shadow-lg"
                  />
                </div>

                {/* Model info */}
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                    {selectedModel?.name || 'Selecciona modelo'}
                  </h2>
                  {selectedModel?.puffs && (
                    <p className="text-white/90 text-lg">💨 {selectedModel.puffs} puffs</p>
                  )}
                  <p className="text-4xl font-bold text-yellow-300 drop-shadow-lg mt-2">
                    ${selectedModel?.price || '---'} MXN
                  </p>
                </div>

                {/* Flavors */}
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <h3 className="text-white font-bold text-center mb-3">
                    ✅ Sabores disponibles ({availableFlavors.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                    {availableFlavors.map(f => (
                      <div key={f.id} className="text-white/90 text-sm py-1 px-2">
                        • {f.name_es || f.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                  <p className="text-white/90 text-sm">📍 Monterrey, NL</p>
                  <p className="text-white font-bold text-lg mt-1">📲 ¡Escríbenos!</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Text Promo */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Flavors list */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Sabores disponibles
                </h3>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  {availableFlavors.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                {availableFlavors.map(f => (
                  <div key={f.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900 dark:text-white">{f.name}</span>
                      {f.name_es && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{f.name_es}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{f.available}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text preview */}
            <div className="flex flex-col gap-4 min-h-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col flex-1 min-h-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 shrink-0">
                  Vista previa del mensaje
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 flex-1 overflow-y-auto min-h-0">
                  {generatePromoText()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar texto
                    </>
                  )}
                </button>
                <button
                  onClick={openWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Abrir WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
