"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileAudio, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadFile, type UploadResult } from "@/lib/supabase-storage"

interface FileUploadProps {
  type: "image" | "audio"
  currentUrl?: string
  onUploadComplete: (result: UploadResult) => void
  onUploadStart?: () => void
  bookId?: string
  disabled?: boolean
}

export default function FileUpload({
  type,
  currentUrl,
  onUploadComplete,
  onUploadStart,
  bookId = "temp",
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes =
    type === "image"
      ? "image/jpeg,image/png,image/webp,image/gif"
      : "audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/ogg"

  const maxSize = type === "image" ? 5 * 1024 * 1024 : 100 * 1024 * 1024 // 5MB for images, 100MB for audio

  const validateFile = (file: File): string | null => {
    if (type === "image" && !file.type.startsWith("image/")) {
      return "Please select a valid image file (JPEG, PNG, WebP, GIF)"
    }

    if (type === "audio" && !file.type.startsWith("audio/")) {
      return "Please select a valid audio file (MP3, WAV, M4A, OGG)"
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      return `File size must be less than ${maxSizeMB}MB`
    }

    return null
  }

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)
    onUploadStart?.()

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const path = `books/${bookId}/${type}s/${Date.now()}_${file.name}`
      const result = await uploadFile(file, path)

      clearInterval(progressInterval)
      setProgress(100)

      setTimeout(() => {
        onUploadComplete(result)
        setUploading(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed")
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled || uploading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Current File Preview */}
      {currentUrl && !uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {type === "image" ? (
                <img
                  src={currentUrl || "/placeholder.svg"}
                  alt="Current cover"
                  className="w-16 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                  <FileAudio className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Current {type}</p>
                <p className="text-xs text-muted-foreground">Click below to replace</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card
        className={`transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-dashed"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading {type}...</p>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                {type === "image" ? (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <FileAudio className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Drop your {type} file here, or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  {type === "image"
                    ? "Supports: JPEG, PNG, WebP, GIF (max 5MB)"
                    : "Supports: MP3, WAV, M4A, OGG (max 100MB)"}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled={disabled}>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
