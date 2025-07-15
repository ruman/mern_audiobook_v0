// Script to seed the MongoDB database with sample audiobooks
const { MongoClient } = require("mongodb")

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const client = new MongoClient(uri)

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    narrator: "Jake Gyllenhaal",
    duration: "4h 49m",
    rating: 4.5,
    reviews: 1234,
    cover: "/placeholder.svg?height=400&width=300",
    genre: "Classic Literature",
    description:
      "A timeless tale of love, wealth, and the American Dream in the Jazz Age. Set in the summer of 1922, the story follows Nick Carraway as he becomes neighbor to the mysterious Jay Gatsby, who throws lavish parties in hopes of winning back his lost love, Daisy Buchanan.",
    publishDate: "1925",
    chapters: [
      { id: 1, title: "Chapter 1", duration: "32:15", startTime: 0 },
      { id: 2, title: "Chapter 2", duration: "28:43", startTime: 1935 },
      { id: 3, title: "Chapter 3", duration: "35:22", startTime: 3658 },
      { id: 4, title: "Chapter 4", duration: "41:18", startTime: 5780 },
      { id: 5, title: "Chapter 5", duration: "29:07", startTime: 8258 },
      { id: 6, title: "Chapter 6", duration: "33:45", startTime: 9005 },
      { id: 7, title: "Chapter 7", duration: "48:12", startTime: 12030 },
      { id: 8, title: "Chapter 8", duration: "38:29", startTime: 14922 },
      { id: 9, title: "Chapter 9", duration: "22:18", startTime: 17231 },
    ],
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    narrator: "James Clear",
    duration: "5h 35m",
    rating: 4.8,
    reviews: 2156,
    cover: "/placeholder.svg?height=400&width=300",
    genre: "Self-Help",
    description:
      "An easy and proven way to build good habits and break bad ones. James Clear draws on the most proven ideas from biology, psychology, and neuroscience to create an easy-to-understand guide for making good habits inevitable and bad habits impossible.",
    publishDate: "2018",
    chapters: [
      { id: 1, title: "The Fundamentals", duration: "45:30", startTime: 0 },
      { id: 2, title: "The 1st Law", duration: "52:15", startTime: 2730 },
      { id: 3, title: "The 2nd Law", duration: "48:22", startTime: 5865 },
      { id: 4, title: "The 3rd Law", duration: "41:18", startTime: 8767 },
      { id: 5, title: "The 4th Law", duration: "38:45", startTime: 11245 },
      { id: 6, title: "Advanced Tactics", duration: "49:12", startTime: 13570 },
    ],
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedDatabase() {
  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("audiobooks")

    // Clear existing books
    await db.collection("books").deleteMany({})
    console.log("Cleared existing books")

    // Insert sample books
    const result = await db.collection("books").insertMany(sampleBooks)
    console.log(`Inserted ${result.insertedCount} books`)

    // Create indexes
    await db.collection("books").createIndex({ title: "text", author: "text" })
    await db.collection("books").createIndex({ genre: 1 })
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("progress").createIndex({ userId: 1, bookId: 1 }, { unique: true })

    console.log("Created indexes")
    console.log("Database seeded successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seedDatabase()
