import { AdminAuthProvider } from "@/components/pages/admin-page/AdminAuthContext"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
