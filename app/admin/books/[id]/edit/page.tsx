"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"
import AdminGuard from "@/components/admin-guard"
import { useAuth } from "@/lib/auth-context"
import FileUpload from "@/components/file-upload"
import type { UploadResult } from "@/lib/firebase-storage"

interface Chapter {
  id: number
  title: string
  duration: string
  startTime: number
}

const genres = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Biography",
  "History",
  "Self-Help",
  "Business",
  "Classic Literature",
  "Memoir",
  "True Crime",
  "Philosophy",
  "Psychology",
]

export default function EditBookPage() {
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    narrator: "",
    duration: "",
    rating: "",
    genre: "",
    description: "",
    publishDate: "",
    cover: "",
    audioUrl: "",
  })
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [coverUploading, setCoverUploading] = useState(false)
  const [audioUploading, setAudioUploading] = useState(false)

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const bookId = params.id as string

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const book = await response.json()
        setFormData({
          title: book.title || "",
          author: book.author || "",
          narrator: book.narrator || "",
          duration: book.duration || "",
          rating: book.rating?.toString() || "",
          genre: book.genre || "",
          description: book.description || "",
          publishDate: book.publishDate || "",
          cover: book.cover || "",
          audioUrl: book.audioUrl || "",
        })
        setChapters(book.chapters || [{ id: 1, title: "Chapter 1", duration: "", startTime: 0 }])
      } else {
        throw new Error("Failed to fetch book")
      }
    } catch (error) {
      toast.error("Failed to fetch book details")
      router.push("/admin")
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Math.max(...chapters.map((c) => c.id), 0) + 1,
      title: `Chapter ${chapters.length + 1}`,
      duration: "",
      startTime: 0,
    }
    setChapters([...chapters, newChapter])
  }

  const removeChapter = (id: number) => {
    if (chapters.length > 1) {
      setChapters(chapters.filter((chapter) => chapter.id !== id))
    }
  }

  const updateChapter = (id: number, field: string, value: string) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === id
          ? { ...chapter, [field]: field === "startTime" ? Number.parseInt(value) || 0 : value }
          : chapter,
      ),
    )
  }

  const handleCoverUpload = (result: UploadResult) => {
    setFormData((prev) => ({ ...prev, cover: result.url }))
    setCoverUploading(false)
  }

  const handleAudioUpload = (result: UploadResult) => {
    setFormData((prev) => ({ ...prev, audioUrl: result.url }))
    setAudioUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const bookData = {
        ...formData,
        rating: Number.parseFloat(formData.rating) || 0,
        chapters: chapters.filter((chapter) => chapter.title && chapter.duration),
      }

      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify(bookData),
      })

      if (response.ok) {
        toast.success("Book updated successfully")
        router.push("/admin")
      } else {
        throw new Error("Failed to update book")
      }
    } catch (error) {
      toast.error("Failed to update book")
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Audiobook</h1>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Edit the basic details of the audiobook</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                        placeholder="Enter book title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author *</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => handleInputChange("author", e.target.value)}
                        required
                        placeholder="Enter author name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="narrator">Narrator *</Label>
                      <Input
                        id="narrator"
                        value={formData.narrator}
                        onChange={(e) => handleInputChange("narrator", e.target.value)}
                        required
                        placeholder="Enter narrator name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration *</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => handleInputChange("duration", e.target.value)}
                        required
                        placeholder="e.g., 4h 49m"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre *</Label>
                      <Select value={formData.genre} onValueChange={(value) => handleInputChange("genre", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {genres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => handleInputChange("rating", e.target.value)}
                        placeholder="0.0 - 5.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publishDate">Publish Year</Label>
                      <Input
                        id="publishDate"
                        value={formData.publishDate}
                        onChange={(e) => handleInputChange("publishDate", e.target.value)}
                        placeholder="e.g., 2023"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter book description"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Files */}
              <Card>
                <CardHeader>
                  <CardTitle>Media Files</CardTitle>
                  <CardDescription>Upload or update cover image and audio file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <FileUpload
                      type="image"
                      currentUrl={formData.cover}
                      onUploadComplete={handleCoverUpload}
                      onUploadStart={() => setCoverUploading(true)}
                      bookId={bookId}
                      disabled={loading || fetchLoading}
                    />
                    {/* Fallback URL input */}
                    <div className="pt-2">
                      <Label htmlFor="coverUrl" className="text-sm text-muted-foreground">
                        Or enter image URL
                      </Label>
                      <Input
                        id="coverUrl"
                        value={formData.cover}
                        onChange={(e) => handleInputChange("cover", e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Audio File</Label>
                    <FileUpload
                      type="audio"
                      currentUrl={formData.audioUrl}
                      onUploadComplete={handleAudioUpload}
                      onUploadStart={() => setAudioUploading(true)}
                      bookId={bookId}
                      disabled={loading || fetchLoading}
                    />
                    {/* Fallback URL input */}
                    <div className="pt-2">
                      <Label htmlFor="audioUrl" className="text-sm text-muted-foreground">
                        Or enter audio URL
                      </Label>
                      <Input
                        id="audioUrl"
                        value={formData.audioUrl}
                        onChange={(e) => handleInputChange("audioUrl", e.target.value)}
                        placeholder="https://example.com/audiobook.mp3"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chapters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Chapters</CardTitle>
                      <CardDescription>Edit chapter information for better navigation</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={addChapter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Chapter Title</Label>
                          <Input
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapter.id, "title", e.target.value)}
                            placeholder="Chapter title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Input
                            value={chapter.duration}
                            onChange={(e) => updateChapter(chapter.id, "duration", e.target.value)}
                            placeholder="e.g., 32:15"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Time (seconds)</Label>
                          <Input
                            type="number"
                            value={chapter.startTime}
                            onChange={(e) => updateChapter(chapter.id, "startTime", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {chapters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChapter(chapter.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Link href="/admin">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || coverUploading || audioUploading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : coverUploading || audioUploading ? "Uploading files..." : "Update Book"}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </AdminGuard>
    </AuthGuard>
  )
}
