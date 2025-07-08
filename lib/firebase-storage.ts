import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import app from "./firebase"

const storage = getStorage(app)

export interface UploadResult {
  url: string
  path: string
}

export const uploadFile = async (file: File, path: string): Promise<UploadResult> => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)

    return {
      url,
      path: snapshot.ref.fullPath,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("Failed to upload file")
  }
}

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
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
