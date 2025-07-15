import { supabase } from "./supabase"

export interface UploadResult {
  url: string
  path: string
}

export const uploadFile = async (file: File, path: string): Promise<UploadResult> => {
  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("audiobooks").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("audiobooks").getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("Failed to upload file")
  }
}

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage.from("audiobooks").remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    throw new Error("Failed to delete file")
  }
}

export const generateFilePath = (bookId: string, type: "cover" | "audio", fileName: string): string => {
  const timestamp = Date.now()
  const extension = fileName.split(".").pop()
  return `books/${bookId}/${type}/${timestamp}.${extension}`
}

export const listFiles = async (path: string) => {
  try {
    const { data, error } = await supabase.storage.from("audiobooks").list(path)

    if (error) {
      throw new Error(`List failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error listing files:", error)
    throw new Error("Failed to list files")
  }
}

export const getFileUrl = (path: string): string => {
  const { data } = supabase.storage.from("audiobooks").getPublicUrl(path)

  return data.publicUrl
}

// Utility to check if file exists
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.from("audiobooks").list(path.split("/").slice(0, -1).join("/"))

    if (error) return false

    const fileName = path.split("/").pop()
    return data.some((file) => file.name === fileName)
  } catch {
    return false
  }
}
