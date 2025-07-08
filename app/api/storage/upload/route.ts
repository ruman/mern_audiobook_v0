import { type NextRequest, NextResponse } from "next/server"
import { uploadFile, generateFilePath } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bookId = formData.get("bookId") as string
    const type = formData.get("type") as "cover" | "audio"

    if (!file || !bookId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    if (type === "cover" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type for cover image" }, { status: 400 })
    }

    if (type === "audio" && !file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Invalid file type for audio file" }, { status: 400 })
    }

    // Generate file path
    const filePath = generateFilePath(bookId, type, file.name)

    // Upload file
    const result = await uploadFile(file, filePath)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
