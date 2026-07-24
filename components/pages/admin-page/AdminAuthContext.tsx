"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase/client"

interface AdminAuthContextValue {
  role: string
  name: string
  email: string
  setRole: (value: string) => void
  loading: boolean
  signOut: () => Promise<void>
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState("")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadRole = React.useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, email, role")
      .eq("id", userId)
      .single()

    console.log("[AdminAuth] loadRole:", { profile, error })
    setRole(profile?.role ?? "")
    setName(profile?.name ?? "")
    setEmail(profile?.email ?? "")
  }, [])

  React.useEffect(() => {
    console.log("[AdminAuth] effect started, calling getUser()")
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log("[AdminAuth] getUser:", { userId: user?.id, error })
      if (user) {
        loadRole(user.id)
      } else {
        setRole("")
        setName("")
        setEmail("")
      }
      console.log("[AdminAuth] calling setLoading(false)")
      setLoading(false)
    }).catch((err) => {
      console.error("[AdminAuth] getUser THREW an error:", err)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AdminAuth] onAuthStateChange:", { event, userId: session?.user?.id })
      if (session?.user) {
        loadRole(session.user.id)
      } else {
        setRole("")
        setName("")
        setEmail("")
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadRole])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setRole("")
    setName("")
    setEmail("")
  }, [])

  return (
    <AdminAuthContext.Provider value={{ role, name, email, setRole, loading, signOut }}>
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