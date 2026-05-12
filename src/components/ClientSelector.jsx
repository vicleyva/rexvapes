import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { User, Plus, X } from 'lucide-react'

export default function ClientSelector({ value, onChange, required = false }) {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    setClients(data || [])
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedClient = clients.find(c => c.id === value)

  const handleSelect = (client) => {
    onChange(client.id)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setSearch('')
  }

  const handleCreateNew = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: newName.trim(),
          phone: newPhone.trim() || null,
          created_by: user?.email
        })
        .select()
        .single()

      if (error) throw error

      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(data.id)
      setNewName('')
      setNewPhone('')
      setShowNewForm(false)
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Cliente {required && <span className="text-red-500">*</span>}
      </label>

      {selectedClient ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          <User className="w-4 h-4 text-gray-400" />
          <span className="flex-1 text-gray-900 dark:text-white">{selectedClient.name}</span>
          {selectedClient.phone && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.phone}</span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ) : (
        <div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setIsOpen(true) }}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{client.name}</span>
                    {client.phone && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{client.phone}</span>
                    )}
                  </button>
                ))
              ) : search && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No se encontró "{search}"
                </div>
              )}

              {!showNewForm ? (
                <button
                  type="button"
                  onClick={() => { setShowNewForm(true); setNewName(search) }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 text-blue-600 dark:text-blue-400"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo cliente
                </button>
              ) : (
                <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre"
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      disabled={!newName.trim() || loading}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? '...' : 'Crear'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
