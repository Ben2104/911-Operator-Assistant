"use client"
import React, { useState } from 'react'
import { Search, MapPin, Loader2, X } from 'lucide-react'

type ManualAddressProps = {
  onAddressSubmit: (address: string) => Promise<void>
  onClear: () => void
  onClose?: () => void
}

const INCIDENT_TYPE_OPTIONS = [
  { value: 'crime', label: 'Crime' },
  { value: 'medical', label: 'Medical' },
  { value: 'fire', label: 'Fire' },
] as const

const ManualAddress: React.FC<ManualAddressProps> = ({ onAddressSubmit, onClear, onClose }) => {
  const [manualAddress, setManualAddress] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['crime'])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualAddress.trim()) return

    setIsGeocoding(true)
    try {
      await onAddressSubmit(manualAddress)
      setManualAddress('')
    } catch (error) {
      console.error('Address submit error:', error)
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleClear = () => {
    setManualAddress('')
    setSelectedTypes(['crime'])
    onClear()
  }

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length === 1 ? prev : prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }

  return (
    <div className="rounded-3xl bg-white border border-neutral-200 shadow-xl p-4 pointer-events-auto">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          Manual Address
        </div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-neutral-500 hover:text-black" />
          </button>
        )}
      </div>
      
      <form className="mt-3 flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="text-xs font-medium text-black">Address or notes</label>
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2">
          <Search className="w-4 h-4 text-black" />
          <input
            type="text"
            placeholder="123 Main St, Long Beach"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="flex-1 text-sm focus:outline-none placeholder:text-neutral-400 text-black"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-neutral-200 hover:shadow transition bg-black text-white hover:opacity-90"
            type="submit"
            disabled={isGeocoding}
          >
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Apply
          </button>
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-neutral-200 hover:shadow transition"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-black">Incident type</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INCIDENT_TYPE_OPTIONS.map((option) => {
              const isActive = selectedTypes.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleType(option.value)}
                  className={`rounded-2xl border px-3 py-1 text-sm transition ${
                    isActive
                      ? 'bg-black text-white border-black'
                      : 'border-neutral-200 text-black hover:border-black/40'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </form>
    </div>
  )
}

export default ManualAddress
