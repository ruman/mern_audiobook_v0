"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Edit, Trash2, Eye, BookOpen, Users, TrendingUp, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import AuthGuard from "@/components/auth-guard"
import AdminGuard from "@/components/admin-guard"
import { useAuth } from "@/lib/auth-context"
import BulkUpload from "@/components/bulk-upload"
import StorageManager from "@/components/storage-manager"

interface Book {
  _id: string
  title: string
  author: string
  narrator: string
  duration: string
  rating: number
  genre: string
  cover: string
  createdAt: string
  updatedAt: string
}

export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const { user, logout } = useAuth()
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showStorageManager, setShowStorageManager] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/admin/books", {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setBooks(data)
      }
    } catch (error) {
      toast.error("Failed to fetch books")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bookId: string) => {
    setDeleteLoading(bookId)
    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (response.ok) {
        setBooks(books.filter((book) => book._id !== bookId))
        toast.success("Book deleted successfully")
      } else {
        throw new Error("Failed to delete book")
      }
    } catch (error) {
      toast.error("Failed to delete book")
    } finally {
      setDeleteLoading(null)
    }
  }

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.genre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    totalBooks: books.length,
    totalGenres: new Set(books.map((book) => book.genre)).size,
    averageRating:
      books.length > 0 ? (books.reduce((sum, book) => sum + book.rating, 0) / books.length).toFixed(1) : "0",
  }

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <Badge variant="secondary">Administrator</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Site
                    </Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBooks}</div>
                  <p className="text-xs text-muted-foreground">Audiobooks in library</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Genres</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGenres}</div>
                  <p className="text-xs text-muted-foreground">Different categories</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <p className="text-xs text-muted-foreground">Out of 5 stars</p>
                </CardContent>
              </Card>
            </div>

            {/* Bulk Upload Section */}
            {showBulkUpload && (
              <div className="mb-8">
                <BulkUpload
                  onComplete={() => {
                    setShowBulkUpload(false)
                    fetchBooks()
                  }}
                />
              </div>
            )}

            {/* Storage Manager Section */}
            {showStorageManager && (
              <div className="mb-8">
                <StorageManager />
              </div>
            )}

            {/* Books Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Audiobooks</CardTitle>
                    <CardDescription>Add, edit, and delete audiobooks from your library</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowBulkUpload(!showBulkUpload)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button variant="outline" onClick={() => setShowStorageManager(!showStorageManager)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Storage Manager
                    </Button>
                    <Link href="/admin/books/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Book
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search books, authors, or genres..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Books Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Narrator</TableHead>
                          <TableHead>Genre</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBooks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No books found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredBooks.map((book) => (
                            <TableRow key={book._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <img
                                    src={book.cover || "/placeholder.svg"}
                                    alt={book.title}
                                    className="w-10 h-12 object-cover rounded"
                                  />
                                  <div>
                                    <div className="font-medium">{book.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Added {new Date(book.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{book.author}</TableCell>
                              <TableCell>{book.narrator}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{book.genre}</Badge>
                              </TableCell>
                              <TableCell>{book.duration}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span>{book.rating}</span>
                                  <span className="text-yellow-400">★</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Link href={`/admin/books/${book._id}/edit`}>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" disabled={deleteLoading === book._id}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{book.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(book._id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </AdminGuard>
    </AuthGuard>
  )
}
