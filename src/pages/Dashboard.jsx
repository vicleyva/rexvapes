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
      // Get flavors for stock stats
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

      // Get today's sales
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

      // Get week's revenue
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/sales"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Venta
        </Link>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <LowStockAlert items={lowStockItems} />
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Stock Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStock}</p>
          <p className="text-sm text-gray-500">{stats.totalFlavors} sabores</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Ventas Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.todaySales}</p>
          <p className="text-sm text-gray-500">unidades</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Ingresos Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.todayRevenue}</p>
          <p className="text-sm text-gray-500">MXN</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-pink-600" />
            </div>
            <span className="text-sm text-gray-600">Semana</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.weekRevenue}</p>
          <p className="text-sm text-gray-500">MXN (7 días)</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/inventory"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ver Inventario</h3>
              <p className="text-gray-600">Administrar stock de productos</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>

        <Link
          to="/history"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historial de Ventas</h3>
              <p className="text-gray-600">Ver todas las transacciones</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  )
}
