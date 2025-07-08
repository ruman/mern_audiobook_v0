"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, List, Settings, Bookmark } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"

interface Audiobook {
  _id: string
  title: string
  author: string
  narrator: string
  duration: string
  cover: string
  audioUrl: string
  chapters: Array<{
    id: number
    title: string
    duration: string
    startTime: number
  }>
}

export default function PlayerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const bookId = params.id as string
  const startChapter = searchParams.get("chapter")

  const [book, setBook] = useState<Audiobook | null>(null)
  const [loading, setLoading] = useState(true)

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([75])
  const [playbackSpeed, setPlaybackSpeed] = useState("1")
  const [currentChapter, setCurrentChapter] = useState(0)

  useEffect(() => {
    if (user && bookId) {
      fetchBook()
    }
  }, [user, bookId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      // Save progress periodically
      saveProgress(audio.currentTime)
    }
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [book])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = Number.parseFloat(playbackSpeed)
    }
  }, [playbackSpeed])

  // Set initial chapter if specified in URL
  useEffect(() => {
    if (book && startChapter && book.chapters) {
      const chapterIndex = book.chapters.findIndex((ch) => ch.id.toString() === startChapter)
      if (chapterIndex !== -1) {
        setCurrentChapter(chapterIndex)
        if (audioRef.current) {
          audioRef.current.currentTime = book.chapters[chapterIndex].startTime
        }
      }
    }
  }, [book, startChapter])

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

        // Load saved progress
        loadProgress()
      } else if (response.status === 404) {
        toast.error("Book not found")
      } else {
        throw new Error("Failed to fetch book")
      }
    } catch (error) {
      console.error("Error fetching book:", error)
      toast.error("Failed to load audiobook")
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/progress?bookId=${bookId}&userId=${user?.uid}`, {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const progressData = await response.json()
        if (progressData.currentTime && audioRef.current) {
          audioRef.current.currentTime = progressData.currentTime
          setCurrentTime(progressData.currentTime)
        }
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    }
  }

  const saveProgress = async (currentTime: number) => {
    if (!book || !user) return

    const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          bookId: book._id,
          progress,
          currentTime,
          userId: user.uid,
        }),
      })
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 30
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 15
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
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
                <p className="text-muted-foreground">Loading audio player...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
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
              <h2 className="text-2xl font-bold text-muted-foreground mb-4">Audiobook not found</h2>
              <p className="text-muted-foreground mb-6">
                The audiobook you're trying to play doesn't exist or has been removed.
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Audio Element */}
        <audio ref={audioRef} src={book.audioUrl} />

        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href={`/book/${book._id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Book
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
                {book.chapters && book.chapters.length > 0 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <List className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Chapters</SheetTitle>
                        <SheetDescription>Jump to any chapter</SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-2">
                        {book.chapters.map((chapter, index) => (
                          <div
                            key={chapter.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              currentChapter === index ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                            onClick={() => {
                              setCurrentChapter(index)
                              if (audioRef.current) {
                                audioRef.current.currentTime = chapter.startTime
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{chapter.title}</span>
                              <span className="text-sm opacity-70">{chapter.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Book Cover and Info */}
            <Card className="mb-8">
              <CardContent className="p-8 text-center">
                <img
                  src={book.cover || "/placeholder.svg?height=192&width=192"}
                  alt={book.title}
                  className="w-48 h-48 object-cover rounded-lg mx-auto mb-6 shadow-lg"
                />
                <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
                <p className="text-lg text-muted-foreground mb-1">{book.author}</p>
                <p className="text-sm text-muted-foreground mb-4">Narrated by {book.narrator}</p>
                {book.chapters && book.chapters.length > 0 && (
                  <Badge variant="secondary">
                    Chapter {currentChapter + 1} of {book.chapters.length}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Player Controls */}
            <Card>
              <CardContent className="p-8">
                {/* Progress Bar */}
                <div className="mb-6">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleProgressChange}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button variant="ghost" size="lg" onClick={skipBackward}>
                    <SkipBack className="h-6 w-6" />
                    <span className="sr-only">Skip back 15 seconds</span>
                  </Button>

                  <Button size="lg" onClick={togglePlayPause} className="h-16 w-16 rounded-full">
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                  </Button>

                  <Button variant="ghost" size="lg" onClick={skipForward}>
                    <SkipForward className="h-6 w-6" />
                    <span className="sr-only">Skip forward 30 seconds</span>
                  </Button>
                </div>

                {/* Secondary Controls */}
                <div className="flex items-center justify-between">
                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Slider value={volume} max={100} step={1} onValueChange={setVolume} className="w-24" />
                  </div>

                  {/* Playback Speed */}
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5x</SelectItem>
                        <SelectItem value="0.75">0.75x</SelectItem>
                        <SelectItem value="1">1x</SelectItem>
                        <SelectItem value="1.25">1.25x</SelectItem>
                        <SelectItem value="1.5">1.5x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
