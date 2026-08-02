import type { Metadata } from "next";
import PredictionModel from "@/components/pages/admin-page/PredictionModel";
import { AdminLayout } from "@/components/layout/AdminLayout";

export const metadata: Metadata = {
  title: "Model Prediksi — Pare Hurip",
  robots: { index: false, follow: false },
};

export default function AdminPredictionModelPage() {
  return (
    <AdminLayout
      title="Model Prediksi"
      subtitle="Evaluasi dan riwayat model prediksi fase tanam & harga beras"
    >
      <PredictionModel />
    </AdminLayout>
  );
}
