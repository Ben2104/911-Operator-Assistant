"use client"
import React, { useState, useEffect } from 'react'
import Uploading from './Uploading'
import Recording from './Recording'
import RecentCalls from './RecentCalls'
import { MapPin } from 'lucide-react'
import { API_ENDPOINTS } from '../api/config'

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
    return <div className={`rounded-2xl border border-neutral-200 shadow-sm bg-white ${className}`}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <div className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">{children}</div>
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

type ControlPanelProps = {
    onIncidentUpdate?: (incidents: Incident[]) => void
    onViewIncidentOnMap?: (incident: Incident) => void
    onAddRecentPin?: (incident: Incident) => void
    incidents?: Incident[]
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onIncidentUpdate, onViewIncidentOnMap, onAddRecentPin, incidents: externalIncidents }) => {
    const [localIncidents, setLocalIncidents] = useState<Incident[]>([])
    const [uploadingId, setUploadingId] = useState<string | null>(null)

    // Use external incidents if provided, otherwise use local state
    const incidents = externalIncidents !== undefined ? externalIncidents : localIncidents

    // Function to fetch transcripts from /get-transcript
    const fetchTranscripts = async () => {
        try {
            console.log('📞 Fetching transcripts from /get-transcript...')
            const response = await fetch(API_ENDPOINTS.getTranscript, {
                method: 'GET',
            })

            if (response.ok) {
                const data = await response.json()
                console.log('=== GET /get-transcript Response ===')
                console.log('Transcripts:', data)
                console.log('Count:', Array.isArray(data) ? data.length : 0)
                console.log('===================================')
                
                // Process the transcripts if we got any
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`📥 Received ${data.length} transcript(s) from Twilio`)
                    
                    // Convert to Incident format
                    const newIncidents: Incident[] = data.map((transcript: any) => ({
                        Address: transcript.Address,
                        Incident: transcript.Incident,
                        lat: transcript.lat,
                        long: transcript.long || transcript.lng,
                        Response_time: transcript.Response_time,
                        Transcription: transcript.Transcription,
                        createdAt: transcript.createdAt || new Date().toISOString(),
                        status: 'complete' as const,
                    }))
                    
                    // Merge with existing incidents
                    const updatedIncidents = [...newIncidents, ...incidents]
                    
                    // Update local state if not using external incidents
                    if (externalIncidents === undefined) {
                        setLocalIncidents(updatedIncidents)
                    }
                    
                    // Always notify parent
                    onIncidentUpdate?.(updatedIncidents)
                    
                    console.log('✅ Incidents updated with Twilio transcripts')
                    
                    return newIncidents
                } else {
                    console.log('ℹ️ No new transcripts from Twilio')
                }
                
                return data
            } else {
                console.error('❌ Failed to fetch transcripts:', response.statusText)
                return null
            }
        } catch (error) {
            console.error('❌ Error fetching transcripts:', error)
            return null
        }
    }

    const handleUploadSuccess = async (response: any) => {
        console.log('=== POST /location Response ===')
        console.log('Full Response Object:', response)
        console.log('Address:', response.Address)
        console.log('Incident Type:', response.Incident)
        console.log('Latitude:', response.lat)
        console.log('Longitude:', response.long || response.lng)
        console.log('Response Time:', response.Response_time)
        console.log('Transcription:', response.Transcription)
        console.log('Created At:', response.createdAt)
        console.log('===============================')

        
        setUploadingId(null)

        // Add the new incident directly from /location response
        if (response) {
            const newIncident: Incident = {
                Address: response.Address,
                Incident: response.Incident,
                lat: response.lat,
                long: response.long || response.lng,
                Response_time: response.Response_time,
                Transcription: response.Transcription,
                createdAt: response.createdAt || new Date().toISOString(),
                status: 'complete',
            }

            console.log('New incident created:', newIncident)

            const updatedIncidents = [newIncident, ...incidents]

            // Update local state if not using external incidents
            if (externalIncidents === undefined) {
                setLocalIncidents(updatedIncidents)
            }

            // Always notify parent
            onIncidentUpdate?.(updatedIncidents)

            console.log('Updated incidents:', updatedIncidents)
        }
    }

    const handleUploadError = (error: any) => {
        console.error('Upload failed:', error)
        setUploadingId(null)
    }

    const handleUploadProgress = (percent: number) => {
        // Show processing state when upload actually starts
        if (percent > 0 && !uploadingId) {
            setUploadingId('processing')
        }
    }

    const handleRecordingComplete = async (blob: Blob, filename: string) => {
        console.log('Recording complete:', filename)
        setUploadingId('processing')

        const formData = new FormData()
        formData.append('file', blob, filename)

        try {
            console.log('Sending POST request to /location...')
            const response = await fetch(API_ENDPOINTS.location, {
                method: 'POST',
                body: formData,
            })

            console.log('Response Status:', response.status)
            console.log('Response Status Text:', response.statusText)
            console.log('Response OK:', response.ok)

            if (response.ok) {
                const data = await response.json()
                console.log('=== POST /location Response (Recording) ===')
                console.log('Full Response Data:', data)
                console.log('==========================================')
                handleUploadSuccess(data)
            } else {
                throw new Error('Upload failed')
            }
        } catch (error) {
            console.error('Recording upload failed:', error)
            handleUploadError(error)
        }
    }

    const handleConfirmIncident = (incident: Incident, index: number) => {
        console.log('Confirmed incident:', incident)

        // Mark the incident as confirmed
        const updatedIncidents = incidents.map((inc, idx) =>
            idx === index ? { ...inc, confirmed: true } : inc
        )

        // Update local state if not using external incidents
        if (externalIncidents === undefined) {
            setLocalIncidents(updatedIncidents)
        }

        // Always notify parent
        onIncidentUpdate?.(updatedIncidents)

        // Add to recent pins on the map
        onAddRecentPin?.(incident)
    }

    const handleViewOnMap = (incident: Incident, index: number) => {
        console.log('View on map:', incident)
        onViewIncidentOnMap?.(incident)
    }

    const handleDeleteIncident = (incident: Incident, index: number) => {
        console.log('Delete incident:', incident)
        
        // Remove the incident from the list
        const updatedIncidents = incidents.filter((_, idx) => idx !== index)
        
        // Update local state if not using external incidents
        if (externalIncidents === undefined) {
            setLocalIncidents(updatedIncidents)
        }
        
        // Always notify parent
        onIncidentUpdate?.(updatedIncidents)
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-neutral-500" />
                <h1 className="text-xl text-black font-semibold">911 Operator Dashboard</h1>
            </div>

            {/* Upload and Record Cards */}
            <div className="flex flex-col gap-4">
                <Card className="p-4">
                    <SectionTitle>Upload Recording</SectionTitle>
                    <div className="mt-3">
                        <Uploading
                            uploadUrl={API_ENDPOINTS.location}
                            autoUpload={false}
                            onSuccess={handleUploadSuccess}
                            onError={handleUploadError}
                            onProgress={handleUploadProgress}
                        />
                    </div>
                </Card>

                <Card className="p-4">
                    <SectionTitle>Record Live Call</SectionTitle>
                    <div className="mt-3">
                        <Recording
                            onRecordingComplete={handleRecordingComplete}
                            onError={handleUploadError}
                        />
                    </div>
                </Card>
                
                <Card className="p-4">
                    <SectionTitle>Fetch Twilio Transcripts</SectionTitle>
                    <div className="mt-3">
                        <button
                            onClick={fetchTranscripts}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-black hover:opacity-90 transition shadow-sm border border-neutral-200 hover:shadow active:translate-y-px"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
                            </svg>
                            Fetch Transcripts
                        </button>
                        <p className="mt-2 text-xs text-neutral-500">
                            Get transcripts from Twilio call recordings
                        </p>
                    </div>
                </Card>
            </div>

            {/* Recent Calls Section */}
            <RecentCalls
                incidents={incidents}
                isProcessing={!!uploadingId}
                onConfirmIncident={handleConfirmIncident}
                onViewOnMap={handleViewOnMap}
                onDeleteIncident={handleDeleteIncident}
            />
        </div>
    )
}

export default ControlPanel