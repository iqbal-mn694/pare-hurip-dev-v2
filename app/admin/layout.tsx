"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { role, loading } = useAdminAuth()

  const isLoginPage = pathname === "/admin/login"

  React.useEffect(() => {
    if (!isLoginPage && !loading && !role) {
      router.replace("/admin/login")
    }
  }, [isLoginPage, loading, role, router])

  // Halaman login harus dirender apa adanya, tanpa guard —
  // Login.tsx sudah punya logic loading/redirect sendiri.
  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    )
  }

  return <>{children}</>
}