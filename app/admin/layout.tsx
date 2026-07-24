"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { role, loading } = useAdminAuth()

  React.useEffect(() => {
    // Halaman login ada di luar folder /admin, jadi layout ini tidak
    // membungkusnya -- tapi kalau strukturmu beda, tambahkan pengecualian
    // path di sini.
    if (!loading && !role) {
      router.replace("/login")
    }
  }, [loading, role, router, pathname])

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    )
  }

  return <>{children}</>
}