import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

const VALID_PHASE_CODES = new Set(["1", "2", "3", "4", "5", "6", "7", "8"])
const ALLOWED_ROLES = new Set(["admin", "superadmin"])

type ImportRow = {
  id_segmen: string
  subsegmen: string
  periode: string
  fase_tanam: string
}

function isValidRow(row: ImportRow) {
  if (!/^\d{9}$/.test(row.id_segmen)) return false
  if (!VALID_PHASE_CODES.has(row.fase_tanam)) return false
  if (!row.subsegmen || !row.periode) return false
  return true
}

export async function POST(request: Request) {
  const supabaseAdmin = createAdminClient()

  // 1. Ambil token dari header Authorization
  const authHeader = request.headers.get("authorization") ?? ""
  const token = authHeader.replace("Bearer ", "").trim()

  if (!token) {
    return NextResponse.json({ error: "Token tidak ditemukan. Silakan login ulang." }, { status: 401 })
  }

  // 2. Verifikasi token ke Supabase Auth
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 })
  }

  // 3. Cek role dari tabel profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single()

  const role = (profile?.role ?? "").toLowerCase()

  if (profileError || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Anda tidak memiliki akses untuk menyimpan data ini." }, { status: 403 })
  }

  // 4. Parse & validasi body
  let body: { rows?: ImportRow[] }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 })
  }

  const rows = body.rows

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk disimpan" }, { status: 400 })
  }

  const invalidRows = rows.filter((row) => !isValidRow(row))
  if (invalidRows.length > 0) {
    return NextResponse.json(
      { error: `Terdapat ${invalidRows.length} baris tidak valid`, invalidRows },
      { status: 400 }
    )
  }

  // 5. Hilangkan duplikat dalam payload sendiri
  const dedupedMap = new Map<string, ImportRow>()
  rows.forEach((row) => {
    const key = `${row.id_segmen}|${row.subsegmen}|${row.periode}`
    dedupedMap.set(key, row)
  })
  const dedupedRows = Array.from(dedupedMap.values())

  // 6. Insert/update pakai service role key (bypass RLS, role sudah dicek manual di atas)
  const { data, error } = await supabaseAdmin
    .from("data_ksa")
    .upsert(
      dedupedRows.map((row) => ({
        ...row,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id_segmen,subsegmen,periode" }
    )
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ savedCount: data?.length ?? dedupedRows.length })
}