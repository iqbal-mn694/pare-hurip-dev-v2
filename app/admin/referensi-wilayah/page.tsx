"use client"

import ReferensiWilayah from "@/components/pages/admin-page/ReferensiWilayah"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function AdminReferensiWilayahPage() {
  return (
    <AdminLayout
      title="Referensi Wilayah"
      subtitle="Kelola daftar kecamatan, segmen, dan subsegmen wilayah sampel."
    >
      <ReferensiWilayah />
    </AdminLayout>
  )
}
