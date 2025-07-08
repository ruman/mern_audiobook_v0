import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("audiobooks")
    const { bookId, progress, currentTime, userId } = await request.json()

    const progressData = {
      userId,
      bookId: new ObjectId(bookId),
      progress,
      currentTime,
      lastUpdated: new Date(),
    }

    const result = await db
      .collection("progress")
      .updateOne({ userId, bookId: new ObjectId(bookId) }, { $set: progressData }, { upsert: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")
    const userId = searchParams.get("userId")

    const client = await clientPromise
    const db = client.db("audiobooks")

    if (bookId && userId) {
      const progress = await db.collection("progress").findOne({
        userId,
        bookId: new ObjectId(bookId),
      })

      return NextResponse.json(progress || { progress: 0, currentTime: 0 })
    }

    if (userId) {
      const allProgress = await db.collection("progress").find({ userId }).toArray()
      return NextResponse.json(allProgress)
    }

    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
