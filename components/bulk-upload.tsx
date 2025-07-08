"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { uploadFile } from "@/lib/supabase-storage"
import { toast } from "sonner"

interface BulkUploadProps {
  onComplete: () => void
  disabled?: boolean
}

interface UploadItem {
  file: File
  type: "cover" | "audio"
  bookTitle?: string
  status: "pending" | "uploading" | "completed" | "error"
  progress: number
  url?: string
  error?: string
}

export default function BulkUpload({ onComplete, disabled = false }: BulkUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const newItems: UploadItem[] = files.map((file) => ({
      file,
      type: file.type.startsWith("image/") ? "cover" : "audio",
      bookTitle: file.name.split(".")[0], // Use filename as book title
      status: "pending",
      progress: 0,
    }))

    setItems((prev) => [...prev, ...newItems])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadAll = async () => {
    if (items.length === 0) return

    setUploading(true)

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: "uploading", progress: 0 } : item)))

      try {
        const path = `bulk-upload/${Date.now()}_${item.file.name}`

        // Simulate progress
        const progressInterval = setInterval(() => {
          setItems((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, progress: Math.min(item.progress + 10, 90) } : item)),
          )
        }, 200)

        const result = await uploadFile(item.file, path)

        clearInterval(progressInterval)

        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "completed",
                  progress: 100,
                  url: result.url,
                }
              : item,
          ),
        )
      } catch (error) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : item,
          ),
        )
      }
    }

    setUploading(false)
    toast.success(
      `Bulk Upload Complete - Uploaded ${items.filter((i) => i.status === "completed").length} files successfully`,
    )
  }

  const completedCount = items.filter((i) => i.status === "completed").length
  const errorCount = items.filter((i) => i.status === "error").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk File Upload
        </CardTitle>
        <CardDescription>Upload multiple cover images and audio files at once</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div className="space-y-2">
          <input
            type="file"
            multiple
            accept="image/*,audio/*"
            onChange={handleFilesSelect}
            className="hidden"
            id="bulk-upload"
            disabled={disabled || uploading}
          />
          <label htmlFor="bulk-upload">
            <Button
              variant="outline"
              className="w-full cursor-pointer bg-transparent"
              disabled={disabled || uploading}
              asChild
            >
              <div>
                <FileText className="h-4 w-4 mr-2" />
                Select Files
              </div>
            </Button>
          </label>
        </div>

        {/* Upload Progress Summary */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{items.length} files selected</span>
              <div className="flex gap-2">
                {completedCount > 0 && (
                  <Badge variant="secondary" className="text-green-600">
                    {completedCount} completed
                  </Badge>
                )}
                {errorCount > 0 && <Badge variant="destructive">{errorCount} failed</Badge>}
              </div>
            </div>

            {uploading && <Progress value={((completedCount + errorCount) / items.length) * 100} className="w-full" />}
          </div>
        )}

        {/* File List */}
        {items.length > 0 && (
          <ScrollArea className="h-64 w-full border rounded-md p-4">
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(2)} MB</div>

                    {item.status === "uploading" && <Progress value={item.progress} className="w-full mt-1 h-1" />}

                    {item.error && <div className="text-xs text-destructive mt-1">{item.error}</div>}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {item.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {item.status === "pending" && !uploading && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Upload Button */}
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={uploadAll} disabled={uploading || items.length === 0} className="flex-1">
              {uploading ? "Uploading..." : `Upload ${items.length} Files`}
            </Button>
            {!uploading && (
              <Button variant="outline" onClick={() => setItems([])}>
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Select multiple image and audio files. Images should be book covers (JPEG, PNG, WebP, GIF, max 5MB). Audio
            files should be audiobooks (MP3, WAV, M4A, OGG, max 100MB).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
