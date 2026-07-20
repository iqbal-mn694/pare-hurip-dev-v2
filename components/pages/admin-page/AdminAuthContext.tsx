"use client"

import * as React from "react"

interface AdminAuthContextValue {
  role: string
  setRole: (value: string) => void
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState("")

  return (
    <AdminAuthContext.Provider value={{ role, setRole }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return context
}
