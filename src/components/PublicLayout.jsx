import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Moon, Sun } from 'lucide-react'

const APP_VERSION = 'v1.2.12'

export default function PublicLayout({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('rexvapes_darkmode')
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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'}`}>
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src={import.meta.env.BASE_URL + "logo.png"} alt="Rex Vapes" className="w-28 h-28 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:scale-110 transition-transform"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">{APP_VERSION}</span>
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-700 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Rexvapes. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
