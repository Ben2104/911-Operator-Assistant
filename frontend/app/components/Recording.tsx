"use client"
import React, { useState, useRef } from 'react'

type RecordingProps = {
  onRecordingComplete?: (blob: Blob, filename: string) => void
  onError?: (error: string) => void
}

const Recording: React.FC<RecordingProps> = ({
  onRecordingComplete,
  onError,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const filename = `call-${Date.now()}.webm`
        onRecordingComplete?.(blob, filename)
        chunksRef.current = []
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setRecorder(mediaRecorder)
      setIsRecording(true)
    } catch (error) {
      const message = 'Microphone access failed. Check permissions.'
      onError?.(message)
      console.error(error)
    }
  }

  const stopRecording = () => {
    if (!recorder) {
      console.log('⚠️ No recorder to stop')
      return
    }
    console.log('🎤 Stopping recording...')
    recorder.stop()
    setIsRecording(false)
    setRecorder(null)
  }

  return (
    <div>
      {!isRecording ? (
        <button
          onClick={startRecording}
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-black hover:opacity-90 transition shadow-sm border border-neutral-200 hover:shadow active:translate-y-px"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Start
        </button>
      ) : (
        <button
          onClick={stopRecording}
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-red-600 hover:opacity-90 transition shadow-sm border border-red-200 hover:shadow active:translate-y-px"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          Stop
        </button>
      )}
      <p className="mt-2 text-xs text-neutral-500">
        Record, then submit for transcription + analysis.
      </p>
    </div>
  )
}

export default Recording