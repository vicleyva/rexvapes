import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { History as HistoryIcon, Download, Calendar, Search, X, XCircle, User } from 'lucide-react'
import Swal from 'sweetalert2'

export default function History() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [cancellations, setCancellations] = useState([])
  const [flavors, setFlavors] = useState({})
  const [models, setModels] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sales') // 'sales' or 'cancellations'

  // Default to today's date (local timezone)
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [filterModel, setFilterModel] = useState('')
  const [filterFlavor, setFilterFlavor] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch models
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')

      const modelsMap = {}
      modelsData?.forEach(m => { modelsMap[m.id] = m })
      setModels(modelsMap)

      // Fetch flavors
      const { data: flavorsData } = await supabase
        .from('flavors')
        .select('*')

      const flavorsMap = {}
      flavorsData?.forEach(f => { flavorsMap[f.id] = f })
      setFlavors(flavorsMap)

      // Fetch sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .order('sold_at', { ascending: false })
        .limit(100)

      setSales(salesData || [])

      // Fetch cancellations
      const { data: cancellationsData } = await supabase
        .from('cancellations')
        .select('*')
        .order('cancelled_at', { ascending: false })
        .limit(100)

      setCancellations(cancellationsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    // Compare dates in local timezone (YYYY-MM-DD format)
    const saleLocalDate = new Date(sale.sold_at).toLocaleDateString('en-CA')
    if (dateFrom && saleLocalDate < dateFrom) return false
    if (dateTo && saleLocalDate > dateTo) return false

    // Model filter
    const flavor = flavors[sale.flavor_id]
    if (filterModel && flavor?.model_id !== filterModel) return false

    // Flavor filter
    if (filterFlavor && sale.flavor_id !== filterFlavor) return false

    return true
  })

  // Get flavors for selected model (for cascading filter)
  const filteredFlavorOptions = filterModel
    ? Object.values(flavors).filter(f => f.model_id === filterModel)
    : Object.values(flavors)

  const filteredCancellations = cancellations.filter(c => {
    const cancelLocalDate = new Date(c.cancelled_at).toLocaleDateString('en-CA')
    if (dateFrom && cancelLocalDate < dateFrom) return false
    if (dateTo && cancelLocalDate > dateTo) return false
    return true
  })

  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.total), 0)
  const totalUnits = filteredSales.reduce((sum, s) => sum + s.quantity, 0)
  const totalCancelledRevenue = filteredCancellations.reduce((sum, c) => sum + parseFloat(c.total), 0)
  const totalCancelledUnits = filteredCancellations.reduce((sum, c) => sum + c.quantity, 0)

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper functions to parse sale notes
  const isInternalUse = (notes) => {
    return notes?.includes('[USO INTERNO]') || false
  }

  const getDiscountAmount = (notes) => {
    if (!notes) return null
    const match = notes.match(/\[DESCUENTO -\$(\d+(?:\.\d+)?)\]/)
    return match ? parseFloat(match[1]) : null
  }

  const exportCSV = () => {
    const headers = ['Fecha', 'Modelo', 'Sabor', 'Cantidad', 'Precio', 'Total', 'Uso Interno', 'Descuento', 'Notas']
    const rows = filteredSales.map(sale => {
      const flavor = flavors[sale.flavor_id]
      const model = flavor ? models[flavor.model_id] : null
      const discount = getDiscountAmount(sale.notes)
      return [
        formatDate(sale.sold_at),
        model?.name || '',
        flavor?.name || '',
        sale.quantity,
        sale.price,
        sale.total,
        isInternalUse(sale.notes) ? 'Sí' : 'No',
        discount ? `$${discount}` : '',
        sale.notes || ''
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cancelSale = async (sale) => {
    const flavor = flavors[sale.flavor_id]
    const model = flavor ? models[flavor.model_id] : null

    const result = await Swal.fire({
      title: '¿Cancelar venta?',
      html: `
        <div class="text-left">
          <p><strong>${flavor?.name || 'Producto'}</strong></p>
          <p class="text-sm text-gray-500">${model?.name || ''}</p>
          <p class="mt-2">Cantidad: <strong>${sale.quantity}</strong></p>
          <p>Total: <strong>$${sale.total}</strong></p>
          <p class="mt-3 text-sm text-gray-500">El stock será restaurado.</p>
        </div>
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
      // Get current stock
      const { data: flavorData, error: fetchError } = await supabase
        .from('flavors')
        .select('stock')
        .eq('id', sale.flavor_id)
        .single()

      if (fetchError) throw fetchError

      // Log cancellation first
      const { error: cancelError } = await supabase
        .from('cancellations')
        .insert({
          original_sale_id: sale.id,
          flavor_id: sale.flavor_id,
          quantity: sale.quantity,
          price: sale.price,
          total: sale.total,
          original_sold_at: sale.sold_at,
          notes: sale.notes,
          cancelled_by: user?.email
        })

      if (cancelError) throw cancelError

      // Restore stock
      const newStock = (flavorData?.stock || 0) + sale.quantity
      const { error: updateError } = await supabase
        .from('flavors')
        .update({ stock: newStock })
        .eq('id', sale.flavor_id)

      if (updateError) throw updateError

      // Delete sale
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', sale.id)

      if (deleteError) throw deleteError

      // Update local state
      setSales(prev => prev.filter(s => s.id !== sale.id))
      setCancellations(prev => [{
        id: crypto.randomUUID(),
        flavor_id: sale.flavor_id,
        quantity: sale.quantity,
        price: sale.price,
        total: sale.total,
        original_sold_at: sale.sold_at,
        cancelled_at: new Date().toISOString(),
        notes: sale.notes,
        cancelled_by: user?.email
      }, ...prev])

      Swal.fire({
        title: 'Cancelada',
        text: 'La venta fue cancelada y el stock restaurado.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Error canceling sale:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cancelar la venta.',
        icon: 'error'
      })
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Ventas</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modelo
            </label>
            <select
              value={filterModel}
              onChange={(e) => { setFilterModel(e.target.value); setFilterFlavor('') }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.values(models).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sabor
            </label>
            <select
              value={filterFlavor}
              onChange={(e) => setFilterFlavor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {filteredFlavorOptions.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setFilterModel(''); setFilterFlavor('') }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'sales'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <HistoryIcon className="w-4 h-4" />
          Ventas ({filteredSales.length})
        </button>
        <button
          onClick={() => setActiveTab('cancellations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'cancellations'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Cancelaciones ({filteredCancellations.length})
        </button>
      </div>

      {/* Summary */}
      {activeTab === 'sales' ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <p className="text-sm text-blue-500 dark:text-blue-400 font-medium">Total Vendido</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{totalUnits} unidades</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Ingresos</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">${totalRevenue.toFixed(2)} MXN</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4">
            <p className="text-sm text-red-500 dark:text-red-400 font-medium">Total Cancelado</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-300">{totalCancelledUnits} unidades</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Valor Cancelado</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">${totalCancelledRevenue.toFixed(2)} MXN</p>
          </div>
        </div>
      )}

      {/* Sales table */}
      {activeTab === 'sales' && (
        filteredSales.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Modelo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Sabor</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Cant.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Margen</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Usuario</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Cancelar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredSales.map(sale => {
                    const flavor = flavors[sale.flavor_id]
                    const model = flavor ? models[flavor.model_id] : null
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(sale.sold_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {model?.name || ''}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {flavor?.name || 'Desconocido'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-medium px-2 py-1 rounded">
                            {sale.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          ${sale.total}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          {(() => {
                            const total = parseFloat(sale.total)
                            const cost = sale.quantity * (model?.cost || 0)
                            const margin = total - cost
                            return (
                              <span className={margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {margin >= 0 ? '+' : ''}{margin.toFixed(0)}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {isInternalUse(sale.notes) && (
                              <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs font-medium px-2 py-0.5 rounded">
                                Interno
                              </span>
                            )}
                            {getDiscountAmount(sale.notes) && (
                              <span className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 text-xs font-medium px-2 py-0.5 rounded">
                                -${getDiscountAmount(sale.notes)}
                              </span>
                            )}
                            {!isInternalUse(sale.notes) && !getDiscountAmount(sale.notes) && (
                              <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {sale.sold_by?.split('@')[0] || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => cancelSale(sale)}
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Cancelar venta"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <HistoryIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay ventas registradas</p>
          </div>
        )
      )}

      {/* Cancellations table */}
      {activeTab === 'cancellations' && (
        filteredCancellations.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Cancelado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Modelo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Sabor</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Cant.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredCancellations.map(c => {
                    const flavor = flavors[c.flavor_id]
                    const model = flavor ? models[flavor.model_id] : null
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(c.cancelled_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {model?.name || ''}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {flavor?.name || 'Desconocido'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-sm font-medium px-2 py-1 rounded">
                            {c.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          ${c.total}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {c.cancelled_by?.split('@')[0] || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <XCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay cancelaciones registradas</p>
          </div>
        )
      )}
    </div>
  )
}
