"use client"

import PenggunaAdmin from "@/components/pages/admin-page/PenggunaAdmin"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function AdminPenggunaAdminPage() {
  return (
    <AdminLayout title="Pengguna Admin" subtitle="Kelola akun admin dan superadmin." >
      <PenggunaAdmin />
    </AdminLayout>
  )
}
