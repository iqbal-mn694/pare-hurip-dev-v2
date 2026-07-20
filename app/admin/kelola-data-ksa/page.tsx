"use client"

import KelolaDataKSA from "@/components/pages/admin-page/KelolaDataKSA"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function AdminKelolaDataKsaPage() {
  return (
    <AdminLayout
      title="Kelola Data KSA"
      subtitle="Kelola observasi KSA secara manual dan lihat status fase tanam."
    >
      <KelolaDataKSA />
    </AdminLayout>
  )
}
