"use client"
import React from 'react'
import { MapPin } from 'lucide-react'

type Location = {
  lat: number
  lng: number
  address?: string
}

type RecentPinsProps = {
  pins: Location[]
  onPinClick: (location: Location) => void
}

const RecentPins: React.FC<RecentPinsProps> = ({ pins, onPinClick }) => {
  return (
    <div className="rounded-3xl bg-white border border-neutral-200 shadow-xl p-4 pointer-events-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-black">Recent pins</div>
        <span className="text-xs text-neutral-500">Tap to focus</span>
      </div>
      <div className="mt-3 space-y-2">
        {pins.length === 0 && (
          <div className="text-xs text-neutral-500">
            Add a manual location to build quick pins.
          </div>
        )}
        {pins.map((pin, index) => (
          <button
            key={index}
            type="button"
            className="w-full text-left flex items-center gap-3 rounded-2xl border border-neutral-100 hover:bg-neutral-50 px-3 py-2 transition"
            onClick={() => onPinClick(pin)}
          >
            <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-black">
                {pin.address || `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`}
              </div>
              <div className="text-xs text-neutral-500 truncate">Manual entry</div>
            </div>
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

export default RecentPins
