import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { Moon, Sun } from 'lucide-react'

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('rexvapes_darkmode')
    return saved === 'true'
  })

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('rexvapes_sidebar_collapsed')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('rexvapes_darkmode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('rexvapes_sidebar_collapsed', collapsed)
  }, [collapsed])

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar
        darkMode={darkMode}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Dark mode toggle - fixed position */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
        title={darkMode ? 'Modo claro' : 'Modo oscuro'}
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Main content */}
      <main className={`pt-16 lg:pt-0 transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
