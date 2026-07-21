"use client"

import Pengaturan from "@/components/pages/admin-page/Pengaturan"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function AdminPengaturanPage() {
  return (
    <AdminLayout title="Pengaturan" subtitle="Konfigurasi fase tanam dan ekspor data sistem">
      <Pengaturan />
    </AdminLayout>
  )
}
