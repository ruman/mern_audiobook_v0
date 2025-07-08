import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { deleteFile } from "@/lib/supabase-storage"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // In production, verify Firebase token and admin role here
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("audiobooks")

    const book = await db.collection("books").findOne({ _id: new ObjectId(params.id) })

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // In production, verify Firebase token and admin role here
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("audiobooks")
    const body = await request.json()

    // Store old file URLs for potential cleanup
    const oldBook = await db.collection("books").findOne({ _id: new ObjectId(params.id) })

    const result = await db
      .collection("books")
      .updateOne({ _id: new ObjectId(params.id) }, { $set: { ...body, updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const updatedBook = await db.collection("books").findOne({ _id: new ObjectId(params.id) })

    // TODO: Implement cleanup of old files if URLs changed
    // This would require storing file paths in the database and using deleteFile function

    return NextResponse.json(updatedBook)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // In production, verify Firebase token and admin role here
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("audiobooks")

    // Get book data before deletion for file cleanup
    const book = await db.collection("books").findOne({ _id: new ObjectId(params.id) })

    const result = await db.collection("books").deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Also delete related progress records
    await db.collection("progress").deleteMany({ bookId: new ObjectId(params.id) })

    // Clean up files from Supabase Storage
    if (book?.coverPath) {
      try {
        await deleteFile(book.coverPath)
      } catch (error) {
        console.error("Failed to delete cover file:", error)
      }
    }

    if (book?.audioPath) {
      try {
        await deleteFile(book.audioPath)
      } catch (error) {
        console.error("Failed to delete audio file:", error)
      }
    }

    return NextResponse.json({ message: "Book deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
  }
}
