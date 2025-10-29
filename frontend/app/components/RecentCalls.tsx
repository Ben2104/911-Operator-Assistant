"use client"
import React from 'react'
import IncidentCard from './IncidentCard'
import { Loader2 } from 'lucide-react'

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

type RecentCallsProps = {
  incidents: Incident[]
  isProcessing: boolean
  onConfirmIncident?: (incident: Incident, index: number) => void
  onViewOnMap?: (incident: Incident, index: number) => void
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-neutral-200 shadow-sm bg-white ${className}`}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">{children}</div>
}

const RecentCalls: React.FC<RecentCallsProps> = ({ incidents, isProcessing, onConfirmIncident, onViewOnMap }) => {
  return (
    <div>
      <SectionTitle>Recent Calls</SectionTitle>
      <div className="mt-3 flex flex-col gap-3">
        {isProcessing && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          </Card>
        )}
        
        {incidents.length === 0 && !isProcessing && (
          <div className="text-sm text-neutral-500">No calls yet.</div>
        )}
        
        {incidents.map((incident, index) => (
          <IncidentCard 
            key={index} 
            incident={incident}
            onConfirm={() => onConfirmIncident?.(incident, index)}
            onViewOnMap={() => onViewOnMap?.(incident, index)}
          />
        ))}
      </div>
    </div>
  )
}

export default RecentCalls
