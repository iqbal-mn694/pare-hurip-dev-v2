import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") return null;
  return user;
}

export async function GET() {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { userId, role } = await req.json();
  if (!userId || !["user", "admin", "superadmin"].includes(role)) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  if (userId === user.id && role !== "superadmin") {
    return NextResponse.json(
      { error: "Tidak bisa mengubah peran akun sendiri." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id, name, email, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}