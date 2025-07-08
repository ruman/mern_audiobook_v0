"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Play, Plus, Share, Star, Clock, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"

interface Audiobook {
  _id: string
  title: string
  author: string
  narrator: string
  duration: string
  rating: number
  reviews: number
  cover: string
  genre: string
  description: string
  publishDate: string
  chapters: Array<{
    id: number
    title: string
    duration: string
    startTime: number
  }>
  progress?: number
  audioUrl: string
}

export default function BookDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [book, setBook] = useState<Audiobook | null>(null)
  const [loading, setLoading] = useState(true)
  const bookId = params.id as string

  useEffect(() => {
    if (user && bookId) {
      fetchBook()
      fetchBookProgress()
    }
  }, [user, bookId])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const bookData = await response.json()
        setBook(bookData)
      } else if (response.status === 404) {
        toast.error("Book not found")
      } else {
        throw new Error("Failed to fetch book")
      }
    } catch (error) {
      console.error("Error fetching book:", error)
      toast.error("Failed to load book details")
    } finally {
      setLoading(false)
    }
  }

  const fetchBookProgress = async () => {
    try {
      const response = await fetch(`/api/progress?bookId=${bookId}&userId=${user?.uid}`, {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const progressData = await response.json()
        setBook((prevBook) =>
          prevBook
            ? {
                ...prevBook,
                progress: progressData.progress || 0,
              }
            : null,
        )
      }
    } catch (error) {
      console.error("Error fetching book progress:", error)
      // Don't show error toast for progress as it's not critical
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Library
                  </Button>
                </Link>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading book details...</p>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  if (!book) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Library
                  </Button>
                </Link>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-muted-foreground mb-4">Book not found</h2>
              <p className="text-muted-foreground mb-6">
                The audiobook you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/">
                <Button>Return to Library</Button>
              </Link>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Library
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Cover and Actions */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <img
                    src={book.cover || "/placeholder.svg?height=400&width=300"}
                    alt={book.title}
                    className="w-full aspect-[3/4] object-cover rounded-lg mb-6"
                  />
                  <div className="space-y-3">
                    <Link href={`/player/${book._id}`}>
                      <Button className="w-full" size="lg">
                        <Play className="h-4 w-4 mr-2" />
                        {book.progress && book.progress > 0 ? "Continue Listening" : "Start Listening"}
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Library
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Book Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Basic Info */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{book.rating}</span>
                    {book.reviews > 0 && <span className="text-muted-foreground">({book.reviews} reviews)</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{book.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Narrated by {book.narrator}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <Badge variant="secondary">{book.genre}</Badge>
                  {book.publishDate && <Badge variant="outline">Published {book.publishDate}</Badge>}
                </div>

                {/* Progress Bar */}
                {book.progress && book.progress > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Your Progress</span>
                      <span className="text-sm text-muted-foreground">{book.progress}% complete</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About this audiobook</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{book.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Chapters */}
              {book.chapters && book.chapters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Chapters</CardTitle>
                    <CardDescription>{book.chapters.length} chapters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {book.chapters.map((chapter, index) => (
                        <div key={chapter.id}>
                          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                              <div>
                                <p className="font-medium">{chapter.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{chapter.duration}</span>
                              <Link href={`/player/${book._id}?chapter=${chapter.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Play className="h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                          {index < book.chapters.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
