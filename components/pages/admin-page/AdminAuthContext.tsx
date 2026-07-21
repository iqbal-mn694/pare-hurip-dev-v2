"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase/client"

interface AdminAuthContextValue {
  role: string
  setRole: (value: string) => void
  loading: boolean
  signOut: () => Promise<void>
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadRole = React.useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    console.log("[AdminAuth] loadRole:", { profile, error })
    setRole(profile?.role ?? "")
  }, [])

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log("[AdminAuth] getUser:", { userId: user?.id, error })
      if (user) {
        loadRole(user.id)
      } else {
        setRole("")
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AdminAuth] onAuthStateChange:", { event, userId: session?.user?.id })
      if (session?.user) {
        loadRole(session.user.id)
      } else {
        setRole("")
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadRole])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setRole("")
  }, [])

  return (
    <AdminAuthContext.Provider value={{ role, setRole, loading, signOut }}>
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