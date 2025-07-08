import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
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
    const client = await clientPromise
    const db = client.db("audiobooks")
    const body = await request.json()

    const result = await db
      .collection("books")
      .updateOne({ _id: new ObjectId(params.id) }, { $set: { ...body, updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const updatedBook = await db.collection("books").findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json(updatedBook)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 })
  }
}
