"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase/client"

interface AdminAuthContextValue {
  id: string
  role: string
  name: string
  email: string
  setRole: (value: string) => void
  loading: boolean
  signOut: () => Promise<void>
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = React.useState("")
  const [role, setRole] = React.useState("")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadRole = React.useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, role")
      .eq("id", userId)
      .single()

    setId(userId)
    setRole(profile?.role ?? "")
    setName(profile?.name ?? "")
    setEmail(profile?.email ?? "")
  }, [])

  const clearState = React.useCallback(() => {
    setId("")
    setRole("")
    setName("")
    setEmail("")
  }, [])

  React.useEffect(() => {
    let active = true

    async function init() {
      // getUser() memvalidasi JWT lewat jaringan; bila access token
      // kedaluwarsa, supabase-js otomatis refresh memakai refresh_token
      // sebelum mengembalikan user. Ini mencegah INITIAL_SESSION dengan
      // session basi yang membuat role kosong lalu diusir ke login.
      const { data } = await supabase.auth.getUser()

      if (!active) return

      if (data?.user) {
        await loadRole(data.user.id)
      } else {
        clearState()
      }
      if (active) setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          loadRole(session.user.id)
        }
        setLoading(false)
      } else if (event === "SIGNED_OUT") {
        clearState()
        setLoading(false)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [clearState, loadRole])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    clearState()
  }, [clearState])

  return (
    <AdminAuthContext.Provider value={{ id, role, name, email, setRole, loading, signOut }}>
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
