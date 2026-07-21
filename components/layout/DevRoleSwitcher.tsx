"use client"

// ⚠️ DEV-ONLY COMPONENT — hapus file ini dan pemanggilannya di AdminLayout.tsx
// begitu autentikasi Supabase dari tim backend sudah berfungsi penuh.
// Tujuannya hanya untuk preview tampilan role Admin/Superadmin sebelum login sungguhan siap.

import * as React from "react"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

export function DevRoleSwitcher() {
  const { role, setRole } = useAdminAuth()

  return (
    <div className="flex items-center gap-2 rounded-full border border-dashed border-amber-400 bg-amber-50 px-3 py-1 text-xs text-amber-800 dark:border-amber-500/60 dark:bg-amber-900/20 dark:text-amber-200">
      <span className="font-medium">Preview sebagai:</span>
      <select
        value={role || "admin"}
        onChange={(event) => setRole(event.target.value)}
        className="rounded-md border border-amber-300 bg-white px-2 py-0.5 text-xs font-medium text-amber-900 focus:outline-none dark:border-amber-600 dark:bg-slate-900 dark:text-amber-100"
      >
        <option value="admin">Admin</option>
        <option value="superadmin">Superadmin</option>
      </select>
    </div>
  )
}
