import { Check, X } from 'lucide-react'

export default function AvailabilityCard({ flavor }) {
  const isAvailable = flavor.stock > 0

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      isAvailable
        ? 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-md'
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAvailable ? 'bg-green-500' : 'bg-gray-400'
        }`}>
          {isAvailable ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <X className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
            {flavor.name}
          </h3>
          {flavor.name_es && (
            <p className="text-sm text-gray-500 truncate">{flavor.name_es}</p>
          )}
        </div>
      </div>
      <div className={`mt-3 text-center text-sm font-medium ${
        isAvailable ? 'text-green-600' : 'text-gray-500'
      }`}>
        {isAvailable ? 'Disponible' : 'Agotado'}
      </div>
    </div>
  )
}
