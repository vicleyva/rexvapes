import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CalendarClock, Plus, Package, Check, X, Trash2, Clock, AlertCircle, Tag, Gift } from 'lucide-react'
import Swal from 'sweetalert2'

export default function Reservations() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [models, setModels] = useState([])
  const [flavors, setFlavors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [isInternalUse, setIsInternalUse] = useState(false)
  const [isCustomPrice, setIsCustomPrice] = useState(false)
  const [customPrice, setCustomPrice] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [{ data: reservationsData }, { data: modelsData }, { data: flavorsData }] = await Promise.all([
        supabase
          .from('reservations')
          .select(`
            *,
            flavors (
              id,
              name,
              name_es,
              stock,
              model_id,
              models (
                id,
                name,
                price
              )
            )
          `)
          .eq('status', 'active')
          .order('delivery_date', { ascending: true }),
        supabase.from('models').select('*').eq('is_active', true).order('name'),
        supabase.from('flavors').select('*').eq('is_active', true).order('name')
      ])

      setReservations(reservationsData || [])
      setModels(modelsData || [])
      setFlavors(flavorsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableStock = (flavorId) => {
    const flavor = flavors.find(f => f.id === flavorId)
    if (!flavor) return 0

    const reserved = reservations
      .filter(r => r.flavor_id === flavorId && r.status === 'active')
      .reduce((sum, r) => sum + r.quantity, 0)

    return flavor.stock - reserved
  }

  const getModelFlavors = () => {
    if (!selectedModel) return []
    return flavors.filter(f => f.model_id === selectedModel)
  }

  const getSelectedModelData = () => {
    return models.find(m => m.id === selectedModel)
  }

  const resetForm = () => {
    setSelectedModel('')
    setSelectedFlavor('')
    setQuantity(1)
    setDeliveryDate('')
    setCustomerName('')
    setNotes('')
    setIsInternalUse(false)
    setIsCustomPrice(false)
    setCustomPrice('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    const available = getAvailableStock(selectedFlavor)
    if (quantity > available) {
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente',
        text: `Solo hay ${available} unidades disponibles`,
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    try {
      const modelData = getSelectedModelData()
      const finalPrice = isInternalUse ? 0 : isCustomPrice ? (parseFloat(customPrice) || 0) : modelData?.price || 0

      let finalNotes = notes.trim()
      if (isInternalUse) {
        finalNotes = `[USO INTERNO] ${finalNotes}`.trim()
      } else if (isCustomPrice && modelData?.price > finalPrice) {
        finalNotes = `[DESCUENTO -$${modelData.price - finalPrice}] ${finalNotes}`.trim()
      }

      const { error } = await supabase
        .from('reservations')
        .insert({
          flavor_id: selectedFlavor,
          quantity,
          delivery_date: deliveryDate,
          customer_name: customerName,
          reserved_by: user?.email,
          notes: finalNotes || null,
          price: finalPrice
        })

      if (error) throw error

      Swal.fire({
        icon: 'success',
        title: 'Reservación creada',
        showConfirmButton: false,
        timer: 1500
      })

      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error creating reservation:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la reservación'
      })
    }
  }

  const handleDeliver = async (reservation) => {
    const price = reservation.price ?? reservation.flavors?.models?.price ?? 0
    const total = reservation.quantity * price

    const result = await Swal.fire({
      title: '¿Entregar reservación?',
      html: `
        <p><strong>${reservation.quantity}x</strong> ${reservation.flavors?.name}</p>
        <p>Cliente: <strong>${reservation.customer_name}</strong></p>
        <p><strong>Total: $${total}</strong></p>
        <p class="text-sm text-gray-500 mt-2">Se registrará como venta</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, entregar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      // Create sale record
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          flavor_id: reservation.flavor_id,
          quantity: reservation.quantity,
          price: price,
          total: total,
          notes: `[RESERVACIÓN] Cliente: ${reservation.customer_name}${reservation.notes ? ' - ' + reservation.notes : ''}`,
          sold_by: user?.email
        })

      if (saleError) throw saleError

      // Update stock
      const newStock = reservation.flavors.stock - reservation.quantity
      const { error: stockError } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', reservation.flavor_id)

      if (stockError) throw stockError

      // Mark reservation as delivered
      const { error: resError } = await supabase
        .from('reservations')
        .update({ status: 'delivered' })
        .eq('id', reservation.id)

      if (resError) throw resError

      Swal.fire({
        icon: 'success',
        title: 'Entregado',
        text: 'Reservación entregada y venta registrada',
        showConfirmButton: false,
        timer: 1500
      })

      fetchData()
    } catch (error) {
      console.error('Error delivering reservation:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo procesar la entrega'
      })
    }
  }

  const handleCancel = async (reservation) => {
    const result = await Swal.fire({
      title: '¿Cancelar reservación?',
      html: `
        <p><strong>${reservation.quantity}x</strong> ${reservation.flavors?.name}</p>
        <p>Cliente: <strong>${reservation.customer_name}</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    })

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservation.id)

      if (error) throw error

      Swal.fire({
        icon: 'success',
        title: 'Cancelada',
        showConfirmButton: false,
        timer: 1500
      })

      fetchData()
    } catch (error) {
      console.error('Error cancelling reservation:', error)
    }
  }

  // Parse date string as local time (not UTC)
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const isOverdue = (date) => {
    const deliveryDate = parseLocalDate(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return deliveryDate < today
  }

  const isToday = (date) => {
    const deliveryDate = parseLocalDate(date)
    const today = new Date()
    return deliveryDate.toDateString() === today.toDateString()
  }

  const formatDate = (date) => {
    const d = parseLocalDate(date)
    return d.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservaciones</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Reservar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarClock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reservations.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activas</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reservations.filter(r => isToday(r.delivery_date)).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Para hoy</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reservations.filter(r => isOverdue(r.delivery_date)).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations list */}
      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CalendarClock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay reservaciones activas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(reservation => (
            <div
              key={reservation.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all ${
                isOverdue(reservation.delivery_date)
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                  : isToday(reservation.delivery_date)
                  ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white shrink-0">
                      {reservation.quantity}x
                    </span>
                    <span className="text-gray-900 dark:text-white truncate">
                      {reservation.flavors?.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      ({reservation.flavors?.models?.name})
                    </span>
                    <span className={`font-bold shrink-0 ${reservation.price === 0 ? 'text-orange-500 dark:text-orange-400' : reservation.price < (reservation.flavors?.models?.price || 0) ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
                      ${reservation.quantity * (reservation.price ?? reservation.flavors?.models?.price ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">{reservation.customer_name}</strong>
                    </span>
                    <span className={`font-medium ${
                      isOverdue(reservation.delivery_date)
                        ? 'text-red-600 dark:text-red-400'
                        : isToday(reservation.delivery_date)
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {formatDate(reservation.delivery_date)}
                      {isOverdue(reservation.delivery_date) && ' (vencida)'}
                      {isToday(reservation.delivery_date) && ' (hoy)'}
                    </span>
                  </div>
                  {reservation.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {reservation.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Por: {reservation.reserved_by?.split('@')[0]}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDeliver(reservation)}
                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    title="Entregar"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCancel(reservation)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reservar</h2>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modelo
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => { setSelectedModel(e.target.value); setSelectedFlavor('') }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar modelo</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sabor
                </label>
                <select
                  value={selectedFlavor}
                  onChange={(e) => setSelectedFlavor(e.target.value)}
                  required
                  disabled={!selectedModel}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Seleccionar sabor</option>
                  {getModelFlavors()
                    .filter(flavor => getAvailableStock(flavor.id) > 0)
                    .map(flavor => (
                      <option key={flavor.id} value={flavor.id}>
                        {flavor.name} - Disponible: {getAvailableStock(flavor.id)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    max={selectedFlavor ? getAvailableStock(selectedFlavor) : 1}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha entrega
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toLocaleDateString('en-CA')}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Price options */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsInternalUse(!isInternalUse); if (!isInternalUse) { setIsCustomPrice(false); setCustomPrice('') } }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isInternalUse
                      ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Gift className={`w-5 h-5 ${isInternalUse ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${isInternalUse ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Uso interno
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCustomPrice(!isCustomPrice); if (!isCustomPrice) { setIsInternalUse(false); setCustomPrice(getSelectedModelData()?.price?.toString() || '') } else { setCustomPrice('') } }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isCustomPrice
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Tag className={`w-5 h-5 ${isCustomPrice ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${isCustomPrice ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Descuento
                  </span>
                </button>
              </div>

              {/* Custom price input */}
              {isCustomPrice && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    Precio con descuento
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">$</span>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder={getSelectedModelData()?.price?.toString() || '0'}
                      min="0"
                      max={getSelectedModelData()?.price || 0}
                      step="10"
                      className="flex-1 px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-mono"
                    />
                    <span className="text-green-600 dark:text-green-400 font-medium">MXN</span>
                  </div>
                </div>
              )}

              {/* Total preview */}
              {selectedModel && (
                <div className={`rounded-xl p-3 text-center ${isInternalUse ? 'bg-orange-50 dark:bg-orange-900/20' : isCustomPrice ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total: </span>
                  <span className={`font-bold text-lg ${isInternalUse ? 'text-orange-500' : isCustomPrice ? 'text-green-500' : 'text-blue-500'}`}>
                    ${quantity * (isInternalUse ? 0 : isCustomPrice ? (parseFloat(customPrice) || 0) : (getSelectedModelData()?.price || 0))} MXN
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarClock className="w-5 h-5" />
                  Reservar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
