"use client"

import Dashboard from "@/components/pages/admin-page/Dashboard"
import { AdminLayout } from "@/components/layout/AdminLayout"

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <Dashboard />
    </AdminLayout>
  )
}
