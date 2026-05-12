import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart3, TrendingUp, Package, AlertTriangle, DollarSign, ShoppingCart, Wallet } from 'lucide-react'

export default function Reports() {
  const [topFlavors, setTopFlavors] = useState([])
  const [salesByDay, setSalesByDay] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [models, setModels] = useState({})
  const [flavors, setFlavors] = useState({})
  const [financials, setFinancials] = useState({ revenue: 0, costs: 0, profit: 0, unitsSold: 0, unitsRestocked: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      // Fetch models and flavors for lookups
      const { data: modelsData } = await supabase.from('models').select('*')
      const { data: flavorsData } = await supabase.from('flavors').select('*')

      const modelsMap = {}
      modelsData?.forEach(m => { modelsMap[m.id] = m })
      setModels(modelsMap)

      const flavorsMap = {}
      flavorsData?.forEach(f => { flavorsMap[f.id] = f })
      setFlavors(flavorsMap)

      // Low stock items (including out of stock)
      const lowStock = flavorsData?.filter(f => f.is_active && f.stock <= (f.min_stock || 2)) || []
      setLowStockItems(lowStock)

      // Get sales for the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [{ data: salesData }, { data: restocksData }] = await Promise.all([
        supabase.from('sales').select('*').gte('sold_at', thirtyDaysAgo.toISOString()),
        supabase.from('restocks').select('*').gte('created_at', thirtyDaysAgo.toISOString())
      ])

      // Calculate financials (30 days)
      const totalRevenue = salesData?.reduce((sum, s) => sum + parseFloat(s.total || 0), 0) || 0
      const totalCosts = restocksData?.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0) || 0
      const unitsSold = salesData?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0
      const unitsRestocked = restocksData?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0
      setFinancials({
        revenue: totalRevenue,
        costs: totalCosts,
        profit: totalRevenue - totalCosts,
        unitsSold,
        unitsRestocked
      })

      if (salesData) {
        // Top selling flavors
        const flavorSales = {}
        salesData.forEach(sale => {
          if (!flavorSales[sale.flavor_id]) {
            flavorSales[sale.flavor_id] = { quantity: 0, revenue: 0 }
          }
          flavorSales[sale.flavor_id].quantity += sale.quantity
          flavorSales[sale.flavor_id].revenue += parseFloat(sale.total)
        })

        const topSelling = Object.entries(flavorSales)
          .map(([id, data]) => ({
            id,
            flavor: flavorsMap[id],
            ...data
          }))
          .filter(item => item.flavor)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10)

        setTopFlavors(topSelling)

        // Sales by day (last 7 days)
        const last7Days = new Date()
        last7Days.setDate(last7Days.getDate() - 7)

        const dailySales = {}
        for (let i = 0; i < 7; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const key = date.toLocaleDateString('en-CA') // YYYY-MM-DD local timezone
          dailySales[key] = { date: key, quantity: 0, revenue: 0 }
        }

        salesData
          .filter(sale => new Date(sale.sold_at) >= last7Days)
          .forEach(sale => {
            const key = new Date(sale.sold_at).toLocaleDateString('en-CA') // Local timezone
            if (dailySales[key]) {
              dailySales[key].quantity += sale.quantity
              dailySales[key].revenue += parseFloat(sale.total)
            }
          })

        setSalesByDay(Object.values(dailySales).reverse())
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    // Parse YYYY-MM-DD as local time (not UTC)
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
  }

  const maxDailySales = Math.max(...salesByDay.map(d => d.quantity), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reportes</h1>

      {/* Financial Summary - 30 days */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Ventas</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">${financials.revenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{financials.unitsSold} unidades</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Compras</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">${financials.costs.toFixed(0)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{financials.unitsRestocked} unidades</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${financials.profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <Wallet className={`w-4 h-4 ${financials.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Ganancia</span>
          </div>
          <p className={`text-xl font-bold ${financials.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            ${financials.profit.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {financials.revenue > 0 ? ((financials.profit / financials.revenue) * 100).toFixed(0) : 0}% margen
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Promedio</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ${financials.unitsSold > 0 ? (financials.revenue / financials.unitsSold).toFixed(0) : 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">por unidad vendida</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by day chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ventas por Día (7 días)</h2>
          </div>
          <div className="space-y-3">
            {salesByDay.map(day => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{formatDate(day.date)}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(day.quantity / maxDailySales) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{day.quantity}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right">${day.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top selling flavors */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Más Vendidos (30 días)</h2>
          </div>
          {topFlavors.length > 0 ? (
            <div className="space-y-3">
              {topFlavors.map((item, index) => {
                const model = item.flavor ? models[item.flavor.model_id] : null
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                      index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
                      'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.flavor?.name || 'Desconocido'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{model?.name || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">${item.revenue.toFixed(0)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Sin datos de ventas</p>
          )}
        </div>

        {/* Low stock alert */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Bajo</h2>
            <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {lowStockItems.length}
            </span>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {lowStockItems.map(item => {
                const model = models[item.model_id]
                const isOutOfStock = item.stock === 0
                return (
                  <div key={item.id} className={`rounded-lg p-3 border ${
                    isOutOfStock
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                      : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
                  }`}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{model?.name || ''}</p>
                    <p className={`text-lg font-bold mt-1 ${
                      isOutOfStock
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {isOutOfStock ? 'Agotado' : item.stock}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-green-300 dark:text-green-600 mx-auto mb-2" />
              <p className="text-green-600 dark:text-green-400 font-medium">Todo el stock está en buen nivel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
