import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { History as HistoryIcon, Download, Calendar, Search, X } from 'lucide-react'

export default function History() {
  const [sales, setSales] = useState([])
  const [flavors, setFlavors] = useState({})
  const [models, setModels] = useState({})
  const [loading, setLoading] = useState(true)

  // Default to today's date
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

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
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.sold_at)
    if (dateFrom && saleDate < new Date(dateFrom)) return false
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      if (saleDate > endDate) return false
    }
    return true
  })

  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.total), 0)
  const totalUnits = filteredSales.reduce((sum, s) => sum + s.quantity, 0)

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

  const exportCSV = () => {
    const headers = ['Fecha', 'Modelo', 'Sabor', 'Cantidad', 'Precio', 'Total', 'Notas']
    const rows = filteredSales.map(sale => {
      const flavor = flavors[sale.flavor_id]
      const model = flavor ? models[flavor.model_id] : null
      return [
        formatDate(sale.sold_at),
        model?.name || '',
        flavor?.name || '',
        sale.quantity,
        sale.price,
        sale.total,
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
    if (!confirm(`¿Cancelar venta de ${sale.quantity} unidad(es)? El stock será restaurado.`)) {
      return
    }

    try {
      // Get current stock
      const { data: flavorData, error: fetchError } = await supabase
        .from('flavors')
        .select('stock')
        .eq('id', sale.flavor_id)
        .single()

      if (fetchError) throw fetchError

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
    } catch (error) {
      console.error('Error canceling sale:', error)
      alert('Error al cancelar la venta')
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
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

      {/* Sales table */}
      {filteredSales.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Producto</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Cant.</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Precio</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white"></th>
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
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {flavor?.name || 'Desconocido'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{model?.name || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-medium px-2 py-1 rounded">
                          {sale.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        ${sale.price}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        ${sale.total}
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
      )}
    </div>
  )
}
