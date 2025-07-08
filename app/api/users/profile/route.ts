import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("audiobooks")
    const { email } = await request.json()

    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      return NextResponse.json(existingUser)
    }

    const newUser = {
      email,
      createdAt: new Date(),
      preferences: {
        playbackSpeed: 1,
        autoPlay: true,
        theme: "light",
      },
      library: [],
      progress: {},
    }

    const result = await db.collection("users").insertOne(newUser)

    return NextResponse.json({ ...newUser, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real app, you'd verify the Firebase token here
    const client = await clientPromise
    const db = client.db("audiobooks")

    // For demo purposes, we'll extract email from a mock token
    // In production, decode the Firebase JWT token
    const email = "user@example.com" // This should come from the decoded token

    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}
