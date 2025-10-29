"use client"
import React from 'react'
import { MapPin, CheckCircle } from 'lucide-react'

type Incident = {
  Address?: string
  Incident?: string
  lat?: string
  lng?: string
  long?: string
  Response_time?: number
  Transcription?: string
  createdAt?: string
  status?: 'processing' | 'complete'
  confirmed?: boolean
}

type IncidentCardProps = {
  incident: Incident
  onConfirm?: () => void
  onViewOnMap?: () => void
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onConfirm, onViewOnMap }) => {
  const isConfirmed = incident.confirmed || false

  const handleCardClick = () => {
    if (onViewOnMap) {
      onViewOnMap()
    }
  }

  return (
    <div 
      onClick={handleCardClick}
      className="rounded-2xl border border-neutral-200 shadow-sm bg-white p-3 cursor-pointer hover:shadow-md hover:border-neutral-300 transition-all"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-neutral-900">
            Type of Incident: {incident.Incident || 'Unknown Type'}
          </div>
          <div className="text-xs text-neutral-600">
            Address: {incident.Address || 'No address available'}
          </div>
          <div className="text-xs text-neutral-500">
            Transcript: {incident.Transcription || 'Processing...'}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent card click when clicking button
              onConfirm?.()
            }}
            disabled={isConfirmed}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition shadow-sm ${
              isConfirmed 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isConfirmed ? 'Confirmed' : 'Confirm'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent card click when clicking button
              onViewOnMap?.()
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium bg-black text-white hover:opacity-90 transition shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            View on Map
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncidentCard
