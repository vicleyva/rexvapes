import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CalendarClock
} from 'lucide-react'
import { useState, useEffect } from 'react'

const APP_VERSION = 'v1.3.8'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventario', icon: Package },
  { path: '/sales', label: 'Vender', icon: ShoppingCart },
  { path: '/reservations', label: 'Reservaciones', icon: CalendarClock },
  { path: '/history', label: 'Historial', icon: History },
  { path: '/reports', label: 'Reportes', icon: BarChart3 },
  { path: '/settings', label: 'Configuración', icon: Settings },
]

export default function Sidebar({ darkMode, collapsed, onCollapse }) {
  const { signOut } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const SidebarContent = ({ isCollapsed = false, showCollapseBtn = false }) => (
    <>
      {/* Collapse button at top */}
      {showCollapseBtn && (
        <div className={`flex ${isCollapsed ? 'justify-center p-2' : 'justify-between items-center px-3 py-2'}`}>
          {!isCollapsed && <span className="text-xs text-gray-400 dark:text-gray-500">{APP_VERSION}</span>}
          <button
            onClick={onCollapse}
            title={isCollapsed ? 'Expandir' : 'Colapsar'}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Logo */}
      <div className={`border-b border-gray-100 dark:border-gray-700 ${isCollapsed ? 'p-1' : 'p-0'}`}>
        <Link to="/dashboard" className="flex flex-col items-center">
          <img
            src={import.meta.env.BASE_URL + "logo.png"}
            alt="Rex Vapes"
            className={`object-contain ${isCollapsed ? 'w-16 h-16' : 'w-full h-48'}`}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <ul className="space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? label : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                } ${
                  location.pathname === path
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`border-t border-gray-100 dark:border-gray-700 space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <Link
          to="/"
          title={isCollapsed ? 'Ver Tienda' : undefined}
          className={`flex items-center rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
          }`}
        >
          <ExternalLink className="w-5 h-5" />
          {!isCollapsed && 'Ver Tienda'}
        </Link>
        <button
          onClick={handleSignOut}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && 'Cerrar Sesión'}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${
        collapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <SidebarContent isCollapsed={collapsed} showCollapseBtn={true} />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <img src={import.meta.env.BASE_URL + "logo.png"} alt="Rex Vapes" className="w-14 h-14 object-contain" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
