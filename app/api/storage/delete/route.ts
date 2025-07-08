import { type NextRequest, NextResponse } from "next/server"
import { deleteFile } from "@/lib/supabase-storage"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    await deleteFile(path)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
