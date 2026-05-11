import { Link } from 'react-router-dom'
import { Wind, LogIn } from 'lucide-react'

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              REXVAPES
            </span>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Admin
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Rexvapes. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
