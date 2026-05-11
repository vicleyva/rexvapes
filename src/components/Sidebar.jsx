import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wind,
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
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventario', icon: Package },
  { path: '/sales', label: 'Vender', icon: ShoppingCart },
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
      {/* Logo */}
      <div className={`border-b border-gray-100 dark:border-gray-700 ${isCollapsed ? 'p-4' : 'p-6'}`}>
        <Link to="/dashboard" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Wind className={`text-blue-500 dark:text-blue-400 ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`} />
          {!isCollapsed && (
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                REXVAPES
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
            </div>
          )}
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

        {/* Collapse button */}
        {showCollapseBtn && (
          <button
            onClick={onCollapse}
            className={`w-full flex items-center rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!isCollapsed && 'Colapsar'}
          </button>
        )}
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
        <Link to="/dashboard" className="flex items-center gap-2">
          <Wind className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            REXVAPES
          </span>
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
