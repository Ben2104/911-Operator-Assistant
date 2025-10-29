"use client"
import React, { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Loader2, MapPin } from 'lucide-react'
import IncidentPopup from './IncidentPopup'
import ManualAddress from './ManualAddress'
import RecentPins from './RecentPins'

type Location = {
  lat: number
  lng: number
  address?: string
}

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

type MapProps = {
  incidents?: Incident[]
  focusIncident?: Incident | null
  confirmedIncident?: Incident | null
  onLocationSelect?: (location: Location) => void
  onRemoveIncident?: (incident: Incident) => void
}

const Map: React.FC<MapProps> = ({ incidents = [], focusIncident, confirmedIncident, onLocationSelect, onRemoveIncident }) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [loadingMap, setLoadingMap] = useState(true)
  const [markerLibReady, setMarkerLibReady] = useState(false)
  const [recentPins, setRecentPins] = useState<Location[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showManualAddress, setShowManualAddress] = useState(true)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const prevIncidentsLengthRef = useRef(0)

  // Load Google Maps
  useEffect(() => {
    let cancelled = false
    const initMap = async () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!key) {
        console.warn('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
      }

      try {
        setOptions({ key: key || '', v: 'weekly' })
        await Promise.all([importLibrary('maps'), importLibrary('marker')])

        if (cancelled || !mapRef.current) return

        const m = new google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          zoom: 11,
          mapId: '911-ops-map',
          disableDefaultUI: false,
        })

        setMap(m)
        setMarkerLibReady(true)
        console.log('Map and marker library loaded successfully')
      } catch (error) {
        console.error('Failed to load Google Maps', error)
      } finally {
        if (!cancelled) setLoadingMap(false)
      }
    }

    initMap()
    return () => {
      cancelled = true
    }
  }, [])

  // Render markers for incidents
  useEffect(() => {
    if (!map) {
      console.log('Map not ready yet')
      return
    }

    if (!markerLibReady || !google?.maps?.marker?.AdvancedMarkerElement) {
      console.log('AdvancedMarkerElement not available yet, markerLibReady:', markerLibReady)
      return
    }

    console.log('Rendering markers for incidents:', incidents)

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null
    })
    markersRef.current = []

    // Create markers for each incident with valid coordinates
    incidents.forEach((incident, index) => {
      const lat = incident.lat ? parseFloat(incident.lat) : null
      const lng = incident.long ? parseFloat(incident.long) : incident.lng ? parseFloat(incident.lng) : null

      console.log(`Incident ${index}:`, { lat, lng, incident })

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        // Determine marker icon and color based on incident type
        let backgroundColor = '#ef4444' // default red for crime
        let iconPath = '/icons/handcuffs.svg' // default crime icon
        const incidentType = incident.Incident?.toLowerCase() || ''

        // if there is more than two incident type use info.svg
        const incidentTypes = ['medical', 'fire', 'crime']
        const hasMultipleTypes = incidentTypes.filter(type => incidentType.includes(type)).length > 1
        if (hasMultipleTypes) {
          backgroundColor = '#6b7280' // gray for multiple types
          iconPath = '/icons/info.svg'
        } else if (incidentType.includes('medical')) {
          backgroundColor = '#ef4444' // red for medical
          iconPath = '/icons/cross.svg'
        } else if (incidentType.includes('fire')) {
          backgroundColor = '#f97316' // orange for fire
          iconPath = '/icons/fire.svg'
        }
        else if (incidentType.includes('crime')) {
          backgroundColor = '#ef4444' // red for crime
          iconPath = '/icons/handcuffs.svg'
        }
        else {
          backgroundColor = '#6b7280' // gray for unknown
          iconPath = '/icons/info.svg'
        }
        // Create custom marker content with SVG icon
        const pinElement = document.createElement('div')
        pinElement.innerHTML = `
          <div style="
            width: 48px;
            height: 48px;
            background-color: ${backgroundColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <img 
              src="${iconPath}" 
              alt="incident icon" 
              style="
                width: 28px;
                height: 28px;
                filter: brightness(0) invert(1);
              "
            />
          </div>
        `

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat, lng },
          content: pinElement,
          title: incident.Address || `Incident ${index + 1}`,
        })

        // Add click listener to show popup
        marker.addListener('click', () => {
          setSelectedIncident(incident)
        })

        markersRef.current.push(marker)
      }
    })

    // Auto-focus on the newest incident if a new one was added
    if (incidents.length > prevIncidentsLengthRef.current && incidents.length > 0) {
      const newestIncident = incidents[incidents.length - 1]
      const lat = newestIncident.lat ? parseFloat(newestIncident.lat) : null
      const lng = newestIncident.long ? parseFloat(newestIncident.long) : newestIncident.lng ? parseFloat(newestIncident.lng) : null

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng })
        map.setZoom(15)
      }
    }

    prevIncidentsLengthRef.current = incidents.length
  }, [map, incidents, markerLibReady])

  // Handle focusing on a specific incident when "View on Map" is clicked
  useEffect(() => {
    if (!map || !focusIncident) return

    const lat = focusIncident.lat ? parseFloat(focusIncident.lat) : null
    const lng = focusIncident.long ? parseFloat(focusIncident.long) : focusIncident.lng ? parseFloat(focusIncident.lng) : null

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      console.log('Focusing on incident:', focusIncident.Address, { lat, lng })
      map.panTo({ lat, lng })
      map.setZoom(16)
    }
  }, [map, focusIncident])

  // Handle adding confirmed incidents to recent pins
  useEffect(() => {
    if (!confirmedIncident) return

    const lat = confirmedIncident.lat ? parseFloat(confirmedIncident.lat) : null
    const lng = confirmedIncident.long ? parseFloat(confirmedIncident.long) : confirmedIncident.lng ? parseFloat(confirmedIncident.lng) : null

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const location: Location = {
        lat,
        lng,
        address: confirmedIncident.Address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }

      console.log('Adding confirmed incident to recent pins:', location)

      // Add to recent pins (keep only last 3)
      setRecentPins((prev) => {
        // Check if this location is already in recent pins
        const isDuplicate = prev.some(
          pin => Math.abs(pin.lat - lat) < 0.0001 && Math.abs(pin.lng - lng) < 0.0001
        )
        if (isDuplicate) return prev
        return [location, ...prev.slice(0, 2)]
      })
    }
  }, [confirmedIncident])

  // Handle address search
  const handleAddressSubmit = async (address: string) => {
    if (!address.trim()) return

    if (typeof google === 'undefined' || !(google.maps as any)?.Geocoder) {
      throw new Error('Maps API not ready. Please wait a moment and try again.')
    }

    const geocoder = new google.maps.Geocoder()
    const result = await geocoder.geocode({ address })

    if (!result.results?.length) {
      throw new Error('No results for that address.')
    }

    const best = result.results[0]
    const coords = best.geometry.location?.toJSON()
    const resolvedAddress = best.formatted_address || address

    if (!coords) {
      throw new Error('Unable to resolve coordinates.')
    }

    const location: Location = {
      lat: coords.lat,
      lng: coords.lng,
      address: resolvedAddress,
    }

    // Pan map to location
    if (map) {
      map.panTo(coords)
      map.setZoom(15)
    }

    // Add to recent pins
    setRecentPins((prev) => [location, ...prev.slice(0, 2)])

    // Notify parent
    onLocationSelect?.(location)
  }

  const handleClear = () => {
    // Clear function - no state to clear in parent
  }

  const focusLocation = (location: Location) => {
    if (map) {
      map.panTo({ lat: location.lat, lng: location.lng })
      map.setZoom(15)
    }
  }

  const handleRemoveIncident = (incident: Incident) => {
    console.log('Removing incident:', incident)

    // Remove from recent pins if it exists there
    const incidentLat = incident.lat ? parseFloat(incident.lat) : null
    const incidentLng = incident.long ? parseFloat(incident.long) : incident.lng ? parseFloat(incident.lng) : null

    if (incidentLat && incidentLng && !isNaN(incidentLat) && !isNaN(incidentLng)) {
      setRecentPins((prev) =>
        prev.filter((pin) => {
          // Remove pin if coordinates match (within a small tolerance)
          const isSameLocation =
            Math.abs(pin.lat - incidentLat) < 0.0001 &&
            Math.abs(pin.lng - incidentLng) < 0.0001
          return !isSameLocation
        })
      )
    }

    onRemoveIncident?.(incident)
  }

  return (
    <div className="relative h-[calc(100vh-2rem)] w-full rounded-2xl border border-neutral-200 shadow-sm bg-white overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0" ref={mapRef} />

      {loadingMap && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
        </div>
      )}

      {/* Manual Address and Recent Pins Overlay */}
      <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-3 w-full max-w-sm">
        {showManualAddress ? (
          <ManualAddress
            onAddressSubmit={handleAddressSubmit}
            onClear={handleClear}
            onClose={() => {
              setShowManualAddress(false)
            }}
          />
        ) : (
          <button
            onClick={() => setShowManualAddress(true)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-black hover:opacity-90 transition shadow-lg border border-neutral-200"
          >
            <MapPin className="w-4 h-4" />
            Manual Address
          </button>
        )}
        <RecentPins
          pins={recentPins}
          onPinClick={focusLocation}
        />
      </div>

      {/* Incident Popup */}
      <IncidentPopup
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRemove={handleRemoveIncident}
      />
    </div>
  )
}

export default Map