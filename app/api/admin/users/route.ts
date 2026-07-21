import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Belum login." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Hanya superadmin yang boleh mengakses ini." }, { status: 403 }) };
  }

  return { error: null };
}

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("profiles")
    .select("id, name, email, role, created_at")
    .in("role", ["admin", "superadmin"])
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function POST(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { name, email, password, role } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Gagal membuat akun." }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    name,
    email,
    role: role === "superadmin" ? "superadmin" : "admin",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { userId, name, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ error: "userId dan email wajib diisi." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, { email });
  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ name, email })
    .eq("id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await admin.from("profiles").delete().eq("id", id);

  return NextResponse.json({ success: true });
}