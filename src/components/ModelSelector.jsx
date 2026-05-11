import { ChevronDown } from 'lucide-react'

export default function ModelSelector({ models, selectedModel, onSelect }) {
  return (
    <div className="relative">
      <select
        value={selectedModel?.id || ''}
        onChange={(e) => {
          const model = models.find(m => m.id === e.target.value)
          onSelect(model)
        }}
        className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <option value="">Seleccionar modelo...</option>
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name} - ${model.price} MXN
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  )
}
