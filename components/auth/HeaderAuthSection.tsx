"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";

export default function HeaderAuthSection({ mobile = false }: { mobile?: boolean }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  if (loading || !profile) return null;
  if (profile.role !== "admin" && profile.role !== "superadmin") return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (mobile) {
    return (
      <>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><button onClick={handleLogout}>Keluar</button></li>
      </>
    );
  }

  return (
    <>
      <li className="p-2 hover:text-green-600 flex items-center gap-1">
        <Link href="/dashboard" className="flex items-center gap-1">
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>
      </li>
      <li className="p-2">
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-semibold hover:text-red-600">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </li>
    </>
  );
}