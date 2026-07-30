import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED_ROLES = new Set(["admin", "superadmin"])

type ImportRow = {
  segment_id: string
  subsegment: string
  periode: string
  phase: string
}

function isValidRow(row: ImportRow) {
  if (!/^\d{9}$/.test(row.segment_id)) return false
  if (!row.subsegment || !row.periode || !row.phase) return false
  return true
}

export async function POST(request: Request) {
  const supabaseAdmin = createAdminClient()

  const authHeader = request.headers.get("authorization") ?? ""
  const token = authHeader.replace("Bearer ", "").trim()

  if (!token) {
    return NextResponse.json({ error: "Token tidak ditemukan. Silakan login ulang." }, { status: 401 })
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single()

  const role = (profile?.role ?? "").toLowerCase()

  if (profileError || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Anda tidak memiliki akses untuk menyimpan data ini." }, { status: 403 })
  }

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

  const dedupedMap = new Map<string, ImportRow>()
  rows.forEach((row) => {
    const key = `${row.segment_id}|${row.subsegment}|${row.periode}`
    dedupedMap.set(key, row)
  })
  const dedupedRows = Array.from(dedupedMap.values())

  const { data, error } = await supabaseAdmin
    .from("data_ksa")
    .upsert(
      dedupedRows.map((row) => ({
        ...row,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "segment_id,subsegment,periode" }
    )
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ savedCount: data?.length ?? dedupedRows.length })
}
