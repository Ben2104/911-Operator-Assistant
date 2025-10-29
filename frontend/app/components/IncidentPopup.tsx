"use client"
import React from 'react'
import { X, MapPin, Clock, Trash2 } from 'lucide-react'

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

type IncidentPopupProps = {
  incident: Incident | null
  onClose: () => void
  onRemove?: (incident: Incident) => void
}

const IncidentPopup: React.FC<IncidentPopupProps> = ({ incident, onClose, onRemove }) => {
  if (!incident) return null

  const handleRemove = () => {
    if (onRemove && incident) {
      onRemove(incident)
      onClose() // Close the popup after removing
    }
  }

  return (
    <div className="fixed top-4 right-4 w-96 z-50 animate-in slide-in-from-right duration-300">
      <div className="rounded-2xl border border-neutral-200 shadow-2xl bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-neutral-900 to-neutral-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-sm">Incident Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Incident Type */}
          <div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
              Type of Incident
            </div>
            <div className="text-base font-semibold text-neutral-900">
              {incident.Incident || 'Unknown Type'}
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
              Location
            </div>
            <div className="text-sm text-neutral-700 flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
              <span>{incident.Address || 'No address available'}</span>
            </div>
          </div>

          {/* Response Time */}
          {incident.Response_time && (
            <div>
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Response Time
              </div>
              <div className="text-sm text-neutral-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>{incident.Response_time} seconds</span>
              </div>
            </div>
          )}

          {/* Transcript */}
          {incident.Transcription && (
            <div>
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Transcript
              </div>
              <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                {incident.Transcription}
              </div>
            </div>
          )}

          {/* Coordinates */}
          {(incident.lat || incident.lng || incident.long) && (
            <div>
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Coordinates
              </div>
              <div className="text-xs text-neutral-500 font-mono bg-neutral-50 rounded px-2 py-1 inline-block">
                {incident.lat && parseFloat(incident.lat).toFixed(6)}, 
                {incident.long ? parseFloat(incident.long).toFixed(6) : incident.lng ? parseFloat(incident.lng).toFixed(6) : 'N/A'}
              </div>
            </div>
          )}

          {/* Status Badge */}
          {incident.confirmed && (
            <div className="pt-2 border-t border-neutral-100">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Confirmed
              </span>
            </div>
          )}
          
          {/* Remove Pin Button */}
          <div className="pt-2 border-t border-neutral-100">
            <button 
              onClick={handleRemove}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Remove Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentPopup
