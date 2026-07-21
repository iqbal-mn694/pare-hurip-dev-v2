import { createClient } from "@supabase/supabase-js";

// ⚠️ JANGAN PERNAH import file ini di komponen "use client".
// Service role key = akses penuh ke database, harus tetap di server.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}