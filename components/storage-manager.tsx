"use client"

import { useState, useEffect } from "react"
import { Folder, FileImage, FileAudio, Trash2, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { listFiles, deleteFile, getFileUrl } from "@/lib/supabase-storage"

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    eTag: string
    size: number
    mimetype: string
    cacheControl: string
  }
}

export default function StorageManager() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState("")

  useEffect(() => {
    loadFiles()
  }, [currentPath])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const fileList = await listFiles(currentPath)
      setFiles(fileList || [])
    } catch (error) {
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileName: string) => {
    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName
      await deleteFile(filePath)
      await loadFiles()
      toast.success("File deleted successfully")
    } catch (error) {
      toast.error("Failed to delete file")
    }
  }

  const handleDownload = (fileName: string) => {
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName
    const url = getFileUrl(filePath)
    window.open(url, "_blank")
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) {
      return <FileImage className="h-4 w-4 text-blue-500" />
    }
    if (mimetype.startsWith("audio/")) {
      return <FileAudio className="h-4 w-4 text-green-500" />
    }
    return <Folder className="h-4 w-4 text-gray-500" />
  }

  const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Storage Manager
            </CardTitle>
            <CardDescription>Manage uploaded files in Supabase Storage</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Storage Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{files.length}</div>
            <div className="text-sm text-muted-foreground">Files</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </div>
        </div>

        {/* Current Path */}
        {currentPath && (
          <div className="mb-4">
            <Badge variant="outline">/{currentPath}</Badge>
          </div>
        )}

        {/* Files List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : files.length === 0 ? (
          <Alert>
            <AlertDescription>No files found in this directory.</AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.metadata?.mimetype || "")}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.metadata?.size || 0)} •{new Date(file.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(file.name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
