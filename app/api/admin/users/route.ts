import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

const TABLE = "profiles"

export async function GET() {
  try {
    // TODO: ganti ke Supabase admin/service client setelah lib/supabase/admin.ts diisi tim backend,
    // supaya bisa bypass RLS dan akses data user secara penuh.
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data ?? [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan saat mengambil data pengguna." },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim()
    const role = String(body.role ?? "").trim()

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 })
    }
    if (!role || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 })
    }

    // TODO: ganti dengan Supabase Auth Admin API sesungguhnya,
    // karena idealnya akun auth dibuat dulu lalu profile-nya ditambahkan.
    const { data, error } = await supabase.from(TABLE).insert({ email, role, created_at: new Date().toISOString() })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ user: data?.[0] ?? null })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Terjadi kesalahan saat menambah pengguna." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const userId = String(body.userId ?? "").trim()
    const role = String(body.role ?? "").trim()

    if (!userId || !role || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ role })
      .eq("id", userId)
      .select("id, email, role, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Terjadi kesalahan saat memperbarui role pengguna." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 })
    }

    // TODO: idealnya juga hapus dari Supabase Auth, bukan hanya dari tabel profiles.
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Terjadi kesalahan saat menghapus pengguna." }, { status: 500 })
  }
}
