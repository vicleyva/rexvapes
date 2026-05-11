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
  ArrowRight
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    totalFlavors: 0,
    todaySales: 0,
    todayRevenue: 0,
    weekRevenue: 0
  })
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: flavors } = await supabase
        .from('flavors')
        .select('*')
        .eq('is_active', true)

      if (flavors) {
        const totalStock = flavors.reduce((sum, f) => sum + f.stock, 0)
        const lowStock = flavors.filter(f => f.stock > 0 && f.stock <= (f.min_stock || 2))
        setStats(prev => ({
          ...prev,
          totalStock,
          totalFlavors: flavors.length
        }))
        setLowStockItems(lowStock)
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todaySales } = await supabase
        .from('sales')
        .select('quantity, total')
        .gte('sold_at', today.toISOString())

      if (todaySales) {
        setStats(prev => ({
          ...prev,
          todaySales: todaySales.reduce((sum, s) => sum + s.quantity, 0),
          todayRevenue: todaySales.reduce((sum, s) => sum + parseFloat(s.total), 0)
        }))
      }

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: weekSales } = await supabase
        .from('sales')
        .select('total')
        .gte('sold_at', weekAgo.toISOString())

      if (weekSales) {
        setStats(prev => ({
          ...prev,
          weekRevenue: weekSales.reduce((sum, s) => sum + parseFloat(s.total), 0)
        }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link
          to="/sales"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Venta
        </Link>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <LowStockAlert items={lowStockItems} />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Stock Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStock}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalFlavors} sabores</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Ventas Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todaySales}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">unidades</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.todayRevenue}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">MXN</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Semana</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.weekRevenue}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">MXN (7 días)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/inventory"
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ver Inventario</h3>
              <p className="text-gray-600 dark:text-gray-400">Administrar stock de productos</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </div>
        </Link>

        <Link
          to="/history"
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Ventas</h3>
              <p className="text-gray-600 dark:text-gray-400">Ver todas las transacciones</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  )
}
