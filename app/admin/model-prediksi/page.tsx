"use client"

import ModelPrediksi from "@/components/pages/admin-page/ModelPrediksi"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function AdminModelPrediksiPage() {
  return (
    <AdminLayout
      title="Model Prediksi"
      subtitle="Evaluasi dan riwayat model prediksi fase tanam & harga beras"
    >
      <ModelPrediksi />
    </AdminLayout>
  )
}
