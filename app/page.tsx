"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Play, Clock, Star, Search, Filter, LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("All")
  const { user, logout } = useAuth()

  useEffect(() => {
    if (user) {
      fetchAudiobooks()
      fetchUserProgress()
    }
  }, [user])

  const fetchAudiobooks = async () => {
    try {
      const response = await fetch("/api/books", {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const books = await response.json()
        setAudiobooks(books)
      } else {
        throw new Error("Failed to fetch audiobooks")
      }
    } catch (error) {
      console.error("Error fetching audiobooks:", error)
      toast.error("Failed to load audiobooks")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    try {
      const response = await fetch(`/api/progress?userId=${user?.uid}`, {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const progressData = await response.json()

        // Update audiobooks with progress data
        setAudiobooks((prevBooks) =>
          prevBooks.map((book) => {
            const bookProgress = progressData.find((p: any) => p.bookId === book._id)
            return {
              ...book,
              progress: bookProgress ? bookProgress.progress : 0,
            }
          }),
        )
      }
    } catch (error) {
      console.error("Error fetching user progress:", error)
      // Don't show error toast for progress as it's not critical
    }
  }

  // Get unique genres from the loaded books
  const genres = ["All", ...Array.from(new Set(audiobooks.map((book) => book.genre)))]

  const filteredBooks = audiobooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === "All" || book.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  const continueListening = audiobooks.filter((book) => book.progress && book.progress > 0 && book.progress < 100)
  const recommended = audiobooks.filter((book) => book.rating >= 4.5)

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">AudioBooks</h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading your audiobook library...</p>
              </div>
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">AudioBooks</h1>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search books or authors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Empty State */}
          {audiobooks.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-muted-foreground">No audiobooks found</h2>
                <p className="text-muted-foreground">
                  Your library is empty. Contact an administrator to add audiobooks.
                </p>
                <Button onClick={fetchAudiobooks} variant="outline">
                  Refresh Library
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Continue Listening Section */}
              {continueListening.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-xl font-semibold mb-6">Continue Listening</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {continueListening.map((book) => (
                      <Card key={book._id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={book.cover || "/placeholder.svg?height=80&width=60"}
                              alt={book.title}
                              className="w-16 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h3>
                              <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                              <div className="w-full bg-muted rounded-full h-2 mb-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${book.progress || 0}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{book.progress || 0}% complete</span>
                                <Link href={`/player/${book._id}`}>
                                  <Button size="sm" variant="outline">
                                    <Play className="h-3 w-3 mr-1" />
                                    Continue
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Recommended Section */}
              {recommended.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-xl font-semibold mb-6">Recommended for You</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {recommended.slice(0, 6).map((book) => (
                      <Link key={book._id} href={`/book/${book._id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <img
                              src={book.cover || "/placeholder.svg?height=200&width=150"}
                              alt={book.title}
                              className="w-full aspect-[3/4] object-cover rounded mb-3"
                            />
                            <h3 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h3>
                            <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{book.rating}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Genre Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {genres.map((genre) => (
                  <Button
                    key={genre}
                    variant={selectedGenre === genre ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGenre(genre)}
                    className="whitespace-nowrap"
                  >
                    {genre}
                  </Button>
                ))}
              </div>

              {/* All Books Grid */}
              <section>
                <h2 className="text-xl font-semibold mb-6">Browse Library ({filteredBooks.length} books)</h2>
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No books match your search criteria.</p>
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedGenre("All")
                      }}
                      variant="outline"
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map((book) => (
                      <Card key={book._id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <Link href={`/book/${book._id}`}>
                              <img
                                src={book.cover || "/placeholder.svg?height=112&width=80"}
                                alt={book.title}
                                className="w-20 h-28 object-cover rounded cursor-pointer"
                              />
                            </Link>
                            <div className="flex-1">
                              <Link href={`/book/${book._id}`}>
                                <h3 className="font-semibold mb-1 hover:text-primary cursor-pointer line-clamp-2">
                                  {book.title}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground mb-1">by {book.author}</p>
                              <p className="text-xs text-muted-foreground mb-2">Narrated by {book.narrator}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {book.genre}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs">{book.duration}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{book.rating}</span>
                                  {book.reviews > 0 && (
                                    <span className="text-xs text-muted-foreground">({book.reviews})</span>
                                  )}
                                </div>
                                <Link href={`/player/${book._id}`}>
                                  <Button size="sm">
                                    <Play className="h-3 w-3 mr-1" />
                                    {book.progress && book.progress > 0 ? "Continue" : "Play"}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
