"use client"
import React, { useEffect, useRef, useState } from 'react'

type UploadingProps = {
  file?: File | null
  uploadUrl?: string
  autoUpload?: boolean
  onProgress?: (percent: number) => void
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
  onFileSelected?: (file: File | null) => void
}

const Uploading: React.FC<UploadingProps> = ({
  file: fileProp = null,
  uploadUrl = 'http://127.0.0.1:8000/location',
  autoUpload = false,
  onProgress,
  onSuccess,
  onError,
  onFileSelected,
}) => {
  const [file, setFile] = useState<File | null>(fileProp)
  const [progress, setProgress] = useState<number>(0)
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('🔍 Component mounted, checking file input ref:', fileInputRef.current)
    if (!fileInputRef.current) {
      console.warn('⚠️ File input ref is not attached on mount')
    }
  }, [])

  useEffect(() => {
    setFile(fileProp)
    if (fileProp && autoUpload) startUpload(fileProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileProp])

  useEffect(() => {
    if (onProgress) onProgress(progress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📂 File input changed')
    const f = e.target.files?.[0] ?? null
    console.log('📁 Selected file:', f?.name, f?.size, f?.type)
    setFile(f)
    onFileSelected?.(f)
    setProgress(0)
    setError(null)
    setSuccess(false)
    if (f && autoUpload) startUpload(f)
  }

  const handleSelectFile = () => {
    console.log('🖱️ Choose file button clicked')
    console.log('📂 File input ref:', fileInputRef.current)
    if (fileInputRef.current) {
      console.log('✅ Triggering file input click')
      fileInputRef.current.click()
    } else {
      console.error('❌ File input ref is null')
    }
  }

  const startUpload = (f?: File | null) => {
    const uploadFile = f ?? file
    if (!uploadFile) return

    console.log('🚀 Starting upload...')
    console.log('📁 File:', uploadFile.name, 'Size:', uploadFile.size, 'Type:', uploadFile.type)
    console.log('🌐 Upload URL:', uploadUrl)

    setUploading(true)
    setError(null)
    setSuccess(false)
    setProgress(0)

    const form = new FormData()
    form.append('file', uploadFile)

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.round((ev.loaded / ev.total) * 100)
        console.log(`📊 Upload progress: ${percent}%`)
        setProgress(percent)
      }
    }

    xhr.onload = () => {
      console.log('✅ Upload complete!')
      console.log('Status:', xhr.status, xhr.statusText)
      console.log('Response:', xhr.responseText)
      
      setUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        let parsed = null
        try {
          parsed = JSON.parse(xhr.responseText)
        } catch {
          parsed = xhr.responseText
        }
        setSuccess(true)
        setFile(null)
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
        onSuccess?.(parsed)
      } else {
        const err = `Upload failed: ${xhr.status} ${xhr.statusText}`
        console.error('❌', err)
        setError(err)
        onError?.(err)
      }
      xhrRef.current = null
    }

    xhr.onerror = () => {
      console.error('❌ Network error during upload')
      setUploading(false)
      const err = 'Network error during upload'
      setError(err)
      onError?.(err)
      xhrRef.current = null
    }

    xhr.onloadstart = () => {
      console.log('📤 Upload started - request sent')
    }

    xhr.onabort = () => {
      console.log('🛑 Upload aborted')
    }

    console.log('📤 Opening connection to:', uploadUrl)
    xhr.open('POST', uploadUrl, true)
    console.log('📤 Sending form data...')
    xhr.send(form)
  }

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
      setUploading(false)
      setError('Upload cancelled')
      onError?.('Upload cancelled')
    }
  }

  const removeFile = () => {
    setFile(null)
    setProgress(0)
    setError(null)
    setSuccess(false)
    onFileSelected?.(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
        id="file-upload-input"
      />

      {!file ? (
        <div>
          <button 
            onClick={handleSelectFile}
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-black hover:opacity-90 transition shadow-sm border border-neutral-200 hover:shadow active:translate-y-px"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Choose file
          </button>
          <p className="mt-2 text-xs text-neutral-500">
            Supported: .mp3, .wav, .m4a, .webm
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-3 p-3 bg-neutral-50 rounded-lg text-left border border-neutral-200">
            <div className="text-sm font-semibold text-neutral-900 mb-1">
              {file.name}
            </div>
            <div className="text-xs text-neutral-500">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>

          {uploading && (
            <div className="mb-3">
              <div className="h-2 bg-neutral-200 rounded overflow-hidden mb-2">
                <div
                  className="h-full bg-black transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-neutral-600">
                Uploading... {progress}%
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 mb-3 bg-green-50 text-green-800 rounded-lg text-sm font-medium border border-green-200">
              ✓ Upload successful!
            </div>
          )}

          {error && (
            <div className="p-3 mb-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {!uploading && !success && (
              <button 
                onClick={() => startUpload()} 
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-neutral-200 hover:shadow transition text-sm font-medium bg-black text-white hover:opacity-90"
              >
                Upload
              </button>
            )}
            {uploading && (
              <button 
                onClick={cancelUpload} 
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-red-200 hover:shadow transition text-sm font-medium bg-red-600 text-white hover:opacity-90"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={removeFile} 
              type="button" 
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-neutral-200 hover:shadow transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Uploading
