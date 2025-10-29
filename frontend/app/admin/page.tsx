"use client"
import React, { useState, useRef } from 'react'
import ControlPanel from '../components/ControlPanel'
import Map from '../components/Map'

const Dashboard = () => {
  const [incidents, setIncidents] = useState<any[]>([])
  const [focusIncident, setFocusIncident] = useState<any | null>(null)
  const [confirmedIncident, setConfirmedIncident] = useState<any | null>(null)

  const handleIncidentUpdate = (newIncidents: any[]) => {
    setIncidents(newIncidents)
  }

  const handleViewIncidentOnMap = (incident: any) => {
    setFocusIncident(incident)
    // Reset after a brief delay so the effect can trigger again if needed
    setTimeout(() => setFocusIncident(null), 100)
  }

  const handleAddRecentPin = (incident: any) => {
    console.log('Adding incident to recent pins:', incident)
    setConfirmedIncident(incident)
    // Reset after brief delay so it can be triggered again
    setTimeout(() => setConfirmedIncident(null), 100)
  }

  const handleRemoveIncident = (incident: any) => {
    console.log('Removing incident:', incident)
    
    // Remove the incident from the incidents array
    const updatedIncidents = incidents.filter((inc) => {
      // Compare by coordinates and address to find the matching incident
      const isSameLocation = 
        inc.lat === incident.lat && 
        (inc.long === incident.long || inc.lng === incident.lng) &&
        inc.Address === incident.Address
      return !isSameLocation
    })
    
    setIncidents(updatedIncidents)
  }

  return (
    <div className="h-screen w-full flex">
      {/* Left Panel - Control Panel (30%) */}
      <div className="w-[30%] bg-white overflow-y-auto border-r border-neutral-200">
        <ControlPanel 
          incidents={incidents}
          onIncidentUpdate={handleIncidentUpdate}
          onViewIncidentOnMap={handleViewIncidentOnMap}
          onAddRecentPin={handleAddRecentPin}
        />
      </div>

      {/* Right Panel - Map (70%) */}
      <div className="w-[70%] p-4 bg-neutral-50">
        <Map 
          incidents={incidents} 
          focusIncident={focusIncident}
          confirmedIncident={confirmedIncident}
          onRemoveIncident={handleRemoveIncident}
        />
      </div>
    </div>
  )
}

export default Dashboard