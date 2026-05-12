import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LowStockAlert from '../components/LowStockAlert'
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  CalendarClock,
  Wallet,
  BarChart3,
  Calendar
} from 'lucide-react'

export default function Dashboard() {
  // Date filters - default to last 7 days
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [dateFrom, setDateFrom] = useState(weekAgo.toLocaleDateString('en-CA'))
  const [dateTo, setDateTo] = useState(today.toLocaleDateString('en-CA'))

  const [stats, setStats] = useState({
    totalStock: 0,
    totalFlavors: 0,
    totalReserved: 0
  })
  const [financials, setFinancials] = useState({
    revenue: 0,
    costs: 0,
    profit: 0,
    unitsSold: 0
  })
  const [salesByDay, setSalesByDay] = useState([])
  const [topFlavors, setTopFlavors] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [models, setModels] = useState({})
  const [flavors, setFlavors] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventoryData()
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchSalesData()
    }
  }, [dateFrom, dateTo])

  const fetchInventoryData = async () => {
    try {
      const [{ data: flavorsData }, { data: modelsData }, { data: reservations }] = await Promise.all([
        supabase.from('flavors').select('*').eq('is_active', true),
        supabase.from('models').select('*'),
        supabase.from('reservations').select('quantity').eq('status', 'active')
      ])

      const modelsMap = {}
      modelsData?.forEach(m => { modelsMap[m.id] = m })
      setModels(modelsMap)

      const flavorsMap = {}
      flavorsData?.forEach(f => { flavorsMap[f.id] = f })
      setFlavors(flavorsMap)

      if (flavorsData) {
        const totalStock = flavorsData.reduce((sum, f) => sum + f.stock, 0)
        const lowStock = flavorsData.filter(f => f.stock <= (f.min_stock || 2))
        setStats(prev => ({
          ...prev,
          totalStock,
          totalFlavors: flavorsData.length
        }))
        setLowStockItems(lowStock)
      }

      if (reservations) {
        setStats(prev => ({
          ...prev,
          totalReserved: reservations.reduce((sum, r) => sum + r.quantity, 0)
        }))
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    }
  }

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      // Convert dates to start/end of day
      const startDate = new Date(dateFrom + 'T00:00:00')
      const endDate = new Date(dateTo + 'T23:59:59')

      const { data: salesData } = await supabase
        .from('sales')
        .select('*, flavors(model_id, models(cost))')
        .gte('sold_at', startDate.toISOString())
        .lte('sold_at', endDate.toISOString())

      if (salesData) {
        // Calculate financials
        const revenue = salesData.reduce((sum, s) => sum + parseFloat(s.total || 0), 0)
        const costs = salesData.reduce((sum, s) => {
          const modelCost = s.flavors?.models?.cost || 0
          return sum + (s.quantity * modelCost)
        }, 0)
        const unitsSold = salesData.reduce((sum, s) => sum + (s.quantity || 0), 0)

        setFinancials({
          revenue,
          costs,
          profit: revenue - costs,
          unitsSold
        })

        // Sales by day
        const dailySales = {}
        const current = new Date(startDate)
        while (current <= endDate) {
          const key = current.toLocaleDateString('en-CA')
          dailySales[key] = { date: key, quantity: 0, revenue: 0 }
          current.setDate(current.getDate() + 1)
        }

        salesData.forEach(sale => {
          const key = new Date(sale.sold_at).toLocaleDateString('en-CA')
          if (dailySales[key]) {
            dailySales[key].quantity += sale.quantity
            dailySales[key].revenue += parseFloat(sale.total)
          }
        })

        setSalesByDay(Object.values(dailySales))

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
            flavor: flavors[id],
            ...data
          }))
          .filter(item => item.flavor)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10)

        setTopFlavors(topSelling)
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setQuickRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDateFrom(start.toLocaleDateString('en-CA'))
    setDateTo(end.toLocaleDateString('en-CA'))
  }

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
  }

  const maxDailySales = Math.max(...salesByDay.map(d => d.quantity), 1)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link
          to="/sales"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Venta
        </Link>
      </div>

      {/* Date Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setQuickRange(0)} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Hoy</button>
            <button onClick={() => setQuickRange(7)} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">7 días</button>
            <button onClick={() => setQuickRange(30)} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">30 días</button>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <LowStockAlert items={lowStockItems} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <span className="text-xs text-gray-500 dark:text-gray-400">Costo</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">${financials.costs.toFixed(0)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">de {financials.unitsSold} vendidas</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400">por unidad</p>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Stock Total</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalStock}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{stats.totalFlavors} sabores</p>
        </div>
        <Link to="/reservations" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Reservado</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalReserved}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Disponible</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalStock - stats.totalReserved}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">para venta</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by day chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ventas por Día</h2>
            </div>
            {salesByDay.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {salesByDay.map(day => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-14">{formatDate(day.date)}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(day.quantity / maxDailySales) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white w-6 text-right">{day.quantity}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">${day.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Sin ventas en este período</p>
            )}
          </div>

          {/* Top selling flavors */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Más Vendidos</h2>
            </div>
            {topFlavors.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
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
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Sin ventas en este período</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
