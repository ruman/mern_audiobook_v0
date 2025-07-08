"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

interface AdminContextType {
  isAdmin: boolean
  loading: boolean
}

const AdminContext = createContext<AdminContextType>({} as AdminContextType)

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}

// Admin emails - in production, this should be stored in database
const ADMIN_EMAILS = ["admin@audiobooks.com", "manager@audiobooks.com"]

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (user && user.email) {
        setIsAdmin(ADMIN_EMAILS.includes(user.email))
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    }
  }, [user, authLoading])

  const value = {
    isAdmin,
    loading: loading || authLoading,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
