"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import { Check, Download, Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_PHASES = [
  { code: 1, name: "Vegetatif 1" },
  { code: 2, name: "Vegetatif 2" },
  { code: 3, name: "Generatif 1" },
  { code: 4, name: "Generatif 2" },
  { code: 5, name: "Generatif 3" },
  { code: 6, name: "Panen" },
  { code: 7, name: "Bera" },
  { code: 8, name: "Persiapan Lahan" },
]

const DUMMY_DATA_KSA = [
  { segmen: "A1", subsegmen: "A1-01", periode: "2024-01", fase_tanam: "1" },
  { segmen: "A2", subsegmen: "A2-02", periode: "2024-02", fase_tanam: "2" },
  { segmen: "A3", subsegmen: "A3-03", periode: "2024-03", fase_tanam: "3" },
  { segmen: "B1", subsegmen: "B1-01", periode: "2024-04", fase_tanam: "4" },
  { segmen: "B2", subsegmen: "B2-02", periode: "2024-05", fase_tanam: "5" },
  { segmen: "B3", subsegmen: "B3-03", periode: "2024-06", fase_tanam: "6" },
  { segmen: "C1", subsegmen: "C1-01", periode: "2024-07", fase_tanam: "7" },
  { segmen: "C2", subsegmen: "C2-02", periode: "2024-08", fase_tanam: "8" },
  { segmen: "D1", subsegmen: "D1-01", periode: "2024-09", fase_tanam: "1" },
  { segmen: "D2", subsegmen: "D2-02", periode: "2024-10", fase_tanam: "2" },
  { segmen: "E1", subsegmen: "E1-01", periode: "2024-11", fase_tanam: "3" },
  { segmen: "E2", subsegmen: "E2-02", periode: "2024-12", fase_tanam: "4" },
  { segmen: "F1", subsegmen: "F1-01", periode: "2025-01", fase_tanam: "5" },
  { segmen: "F2", subsegmen: "F2-02", periode: "2025-02", fase_tanam: "6" },
  { segmen: "G1", subsegmen: "G1-01", periode: "2025-03", fase_tanam: "7" },
  { segmen: "G2", subsegmen: "G2-02", periode: "2025-04", fase_tanam: "8" },
  { segmen: "H1", subsegmen: "H1-01", periode: "2025-05", fase_tanam: "1" },
  { segmen: "H2", subsegmen: "H2-02", periode: "2025-06", fase_tanam: "2" },
]

const DUMMY_DATA_LUAS = [
  { kecamatan: "Cibeureum", bulan: "Jan 2025", luas_hektar: 12.8 },
  { kecamatan: "Tawang", bulan: "Feb 2025", luas_hektar: 9.4 },
  { kecamatan: "Banjarsari", bulan: "Mar 2025", luas_hektar: 15.1 },
  { kecamatan: "Cihideung", bulan: "Apr 2025", luas_hektar: 10.2 },
  { kecamatan: "Mangkubumi", bulan: "Mei 2025", luas_hektar: 14.6 },
  { kecamatan: "Tawang", bulan: "Jun 2025", luas_hektar: 11.0 },
  { kecamatan: "Banjarsari", bulan: "Jul 2025", luas_hektar: 13.5 },
  { kecamatan: "Cibeureum", bulan: "Agu 2025", luas_hektar: 8.9 },
  { kecamatan: "Cihideung", bulan: "Sep 2025", luas_hektar: 16.0 },
  { kecamatan: "Mangkubumi", bulan: "Okt 2025", luas_hektar: 12.3 },
  { kecamatan: "Cibeureum", bulan: "Nov 2025", luas_hektar: 9.8 },
  { kecamatan: "Tawang", bulan: "Des 2025", luas_hektar: 14.9 },
  { kecamatan: "Banjarsari", bulan: "Jan 2026", luas_hektar: 11.6 },
  { kecamatan: "Cihideung", bulan: "Feb 2026", luas_hektar: 13.2 },
  { kecamatan: "Mangkubumi", bulan: "Mar 2026", luas_hektar: 10.4 },
]

const DUMMY_LOGS = [
  { tanggal: "2025-07-01", aktor: "admin1@example.com", deskripsi: "Menambahkan fase valid baru." },
  { tanggal: "2025-07-02", aktor: "superadmin@example.com", deskripsi: "Mengubah nama fase Generatif 1." },
  { tanggal: "2025-07-03", aktor: "admin2@example.com", deskripsi: "Mengunggah data KSA baru." },
  { tanggal: "2025-07-04", aktor: "admin1@example.com", deskripsi: "Meninjau log aktivitas sistem." },
  { tanggal: "2025-07-05", aktor: "admin3@example.com", deskripsi: "Mengekspor data luas panen." },
  { tanggal: "2025-07-06", aktor: "superadmin@example.com", deskripsi: "Memperbarui konfigurasi fase tanam." },
  { tanggal: "2025-07-07", aktor: "admin2@example.com", deskripsi: "Menghapus entri data duplikat." },
  { tanggal: "2025-07-08", aktor: "admin1@example.com", deskripsi: "Menandai laporan KSA selesai." },
  { tanggal: "2025-07-09", aktor: "superadmin@example.com", deskripsi: "Mengekspor log aktivitas." },
  { tanggal: "2025-07-10", aktor: "admin3@example.com", deskripsi: "Perbaikan nilai validasi fase." },
  { tanggal: "2025-07-11", aktor: "admin2@example.com", deskripsi: "Menambahkan catatan pemeriksaan lapangan." },
  { tanggal: "2025-07-12", aktor: "superadmin@example.com", deskripsi: "Mengarsipkan data lama." },
  { tanggal: "2025-07-13", aktor: "admin1@example.com", deskripsi: "Memverifikasi data segmen." },
  { tanggal: "2025-07-14", aktor: "admin2@example.com", deskripsi: "Mengatur ulang filter tampilan." },
  { tanggal: "2025-07-15", aktor: "admin3@example.com", deskripsi: "Mengonfirmasi status impor." },
  { tanggal: "2025-07-16", aktor: "superadmin@example.com", deskripsi: "Menutup sesi analisa." },
  { tanggal: "2025-07-17", aktor: "admin1@example.com", deskripsi: "Mengecek validasi data baru." },
  { tanggal: "2025-07-18", aktor: "admin2@example.com", deskripsi: "Memperbarui daftar kecamatan." },
  { tanggal: "2025-07-19", aktor: "admin3@example.com", deskripsi: "Mengekspor data KSA." },
  { tanggal: "2025-07-20", aktor: "superadmin@example.com", deskripsi: "Melakukan audit sistem otomatis." },
]

type PhaseItem = {
  code: number
  name: string
}

type ExportState = {
  isLoading: boolean
  message: string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function buildCsvContent(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {})
  const lines = [headers.join(",")]
  rows.forEach((row) => {
    const line = headers
      .map((key) => {
        const value = String(row[key] ?? "")
        return `"${value.replace(/"/g, '""')}"`
      })
      .join(",")
    lines.push(line)
  })
  return lines.join("\r\n")
}

export default function Pengaturan() {
  const [phases, setPhases] = React.useState<PhaseItem[]>(INITIAL_PHASES)
  const [editingCode, setEditingCode] = React.useState<number | null>(null)
  const [editingName, setEditingName] = React.useState("")
  const [exportStatus, setExportStatus] = React.useState<Record<string, ExportState>>({
    ksa: { isLoading: false, message: "" },
    luas: { isLoading: false, message: "" },
    log: { isLoading: false, message: "" },
  })

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setExportStatus((current) => ({
        ksa: { ...current.ksa, message: "" },
        luas: { ...current.luas, message: "" },
        log: { ...current.log, message: "" },
      }))
    }, 4000)

    return () => clearTimeout(timeout)
  }, [exportStatus.ksa.message, exportStatus.luas.message, exportStatus.log.message])

  const startEditing = (phase: PhaseItem) => {
    setEditingCode(phase.code)
    setEditingName(phase.name)
  }

  const cancelEditing = () => {
    setEditingCode(null)
    setEditingName("")
  }

  const savePhase = (code: number) => {
    setPhases((current) =>
      current.map((phase) =>
        phase.code === code ? { ...phase, name: editingName.trim() || phase.name } : phase,
      ),
    )
    setEditingCode(null)
    setEditingName("")
    // TODO: persist perubahan nama fase ke database setelah backend menyediakan endpoint konfigurasi.
  }

  const exportWorkbook = (rows: Array<Record<string, string | number>>, fileName: string) => {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
    const excelData = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelData], { type: "application/octet-stream" })
    downloadBlob(blob, fileName)
  }

  const handleExportKsa = async () => {
    setExportStatus((status) => ({ ...status, ksa: { isLoading: true, message: "" } }))
    await new Promise((resolve) => setTimeout(resolve, 300))
    exportWorkbook(DUMMY_DATA_KSA, "data-ksa.xlsx")
    setExportStatus((status) => ({ ...status, ksa: { isLoading: false, message: "Export Data KSA berhasil." } }))
  }

  const handleExportLuas = async () => {
    setExportStatus((status) => ({ ...status, luas: { isLoading: true, message: "" } }))
    await new Promise((resolve) => setTimeout(resolve, 300))
    exportWorkbook(DUMMY_DATA_LUAS, "data-luas-panen.xlsx")
    setExportStatus((status) => ({ ...status, luas: { isLoading: false, message: "Export Data Luas Panen berhasil." } }))
  }

  const handleExportLog = async () => {
    setExportStatus((status) => ({ ...status, log: { isLoading: true, message: "" } }))
    await new Promise((resolve) => setTimeout(resolve, 300))
    const csv = buildCsvContent(DUMMY_LOGS)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, "log-aktivitas.csv")
    setExportStatus((status) => ({ ...status, log: { isLoading: false, message: "Export Log Aktivitas berhasil." } }))
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Konfigurasi Daftar Fase Valid</CardTitle>
          <CardDescription>
            Sesuaikan nama tampilan fase tanam yang dipakai pada validasi data KSA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            Kode angka 1-8 tidak dapat diubah karena dipakai di seluruh sistem validasi data KSA, hanya nama tampilannya yang bisa disesuaikan.
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr className="text-left text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Fase</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {phases.map((phase) => {
                  const isEditing = editingCode === phase.code
                  return (
                    <tr key={phase.code} className="text-sm text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{phase.code}</td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <span>{phase.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => savePhase(phase.code)}>
                              <Check className="size-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => startEditing(phase)}>
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Unduh data sistem dalam format Excel atau CSV untuk laporan dan audit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Download className="size-4" />
                <span>Export Data KSA (.xlsx)</span>
              </div>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Data KSA dengan segmen, subsegmen, periode, dan fase tanam.
              </p>
              <Button
                variant="default"
                className="w-full"
                onClick={handleExportKsa}
                disabled={exportStatus.ksa.isLoading}
              >
                {exportStatus.ksa.isLoading ? "Menyiapkan file..." : "Export Data KSA"}
              </Button>
              {exportStatus.ksa.message ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {exportStatus.ksa.message}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Download className="size-4" />
                <span>Export Data Luas Panen (.xlsx)</span>
              </div>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Data luas panen berbasis kecamatan dan bulan.
              </p>
              <Button
                variant="default"
                className="w-full"
                onClick={handleExportLuas}
                disabled={exportStatus.luas.isLoading}
              >
                {exportStatus.luas.isLoading ? "Menyiapkan file..." : "Export Data Luas Panen"}
              </Button>
              {exportStatus.luas.message ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {exportStatus.luas.message}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Download className="size-4" />
                <span>Export Log Aktivitas (.csv)</span>
              </div>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Unduh aktivitas pengguna dan sistem dalam format CSV.
              </p>
              <Button
                variant="default"
                className="w-full"
                onClick={handleExportLog}
                disabled={exportStatus.log.isLoading}
              >
                {exportStatus.log.isLoading ? "Menyiapkan file..." : "Export Log Aktivitas"}
              </Button>
              {exportStatus.log.message ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {exportStatus.log.message}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
