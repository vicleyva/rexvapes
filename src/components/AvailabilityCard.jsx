import { Check, X } from 'lucide-react'

export default function AvailabilityCard({ flavor }) {
  const isAvailable = flavor.stock > 0

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      isAvailable
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md'
        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAvailable ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
        }`}>
          {isAvailable ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <X className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            {flavor.name}
          </h3>
          {flavor.name_es && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{flavor.name_es}</p>
          )}
        </div>
      </div>
      <div className={`mt-3 text-center text-sm font-medium ${
        isAvailable ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {isAvailable ? 'Disponible' : 'Agotado'}
      </div>
    </div>
  )
}
