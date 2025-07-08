import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("audiobooks")

    const books = await db.collection("books").find({}).toArray()

    return NextResponse.json(books)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("audiobooks")
    const body = await request.json()

    const newBook = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("books").insertOne(newBook)

    return NextResponse.json({ ...newBook, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 })
  }
}
