"use client"

import { supabase } from "@/lib/supabase/client"
import * as React from "react"
import * as XLSX from "xlsx"
import { AlertTriangle, CheckCircle, Download, Upload, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const VALID_PHASE_CODES = new Set(["1", "2", "3", "4", "5", "6", "7", "8"])

const DUMMY_LONG_FORMAT_ROWS = [
  { id_segmen: "123456789", subsegmen: "A1", periode: "2024-01", fase_tanam: "1" },
  { id_segmen: "123456790", subsegmen: "A2", periode: "2024-02", fase_tanam: "2" },
  { id_segmen: "123456791", subsegmen: "A3", periode: "2024-03", fase_tanam: "3" },
  { id_segmen: "123456792", subsegmen: "A4", periode: "2024-04", fase_tanam: "4" },
  { id_segmen: "123456793", subsegmen: "A5", periode: "2024-05", fase_tanam: "5" },
  { id_segmen: "123456794", subsegmen: "A6", periode: "2024-06", fase_tanam: "6" },
  { id_segmen: "123456795", subsegmen: "A7", periode: "2024-07", fase_tanam: "7" },
  { id_segmen: "123456796", subsegmen: "A8", periode: "2024-08", fase_tanam: "8" },
  { id_segmen: "12345679", subsegmen: "B1", periode: "2024-09", fase_tanam: "7.1" },
  { id_segmen: "12345679a", subsegmen: "B2", periode: "2024-10", fase_tanam: "4.5" },
  { id_segmen: "123456797", subsegmen: "B3", periode: "2024-11", fase_tanam: "9" },
  { id_segmen: "123456798", subsegmen: "B4", periode: "2024-12", fase_tanam: "1" },
  { id_segmen: "123456799", subsegmen: "B5", periode: "2025-01", fase_tanam: "2" },
  { id_segmen: "123456799", subsegmen: "B5", periode: "2025-01", fase_tanam: "2" },
  { id_segmen: "123456799", subsegmen: "B5", periode: "2025-01", fase_tanam: "3" },
  { id_segmen: "123456800", subsegmen: "C1", periode: "2025-02", fase_tanam: "8" },
]

type ImportRow = {
  id_segmen: string
  subsegmen: string
  periode: string
  fase_tanam: string
}

type ValidatedImportRow = ImportRow & {
  errors: string[]
  isDuplicate: boolean
}

function normalizeField(value: unknown) {
  return String(value ?? "").trim()
}

function buildDummyRows(): ImportRow[] {
  return [...DUMMY_LONG_FORMAT_ROWS]
}

function validateImportRows(rows: ImportRow[]): ValidatedImportRow[] {
  const keyCount = new Map<string, number>()

  rows.forEach((row) => {
    const key = `${row.id_segmen}|${row.subsegmen}|${row.periode}`
    keyCount.set(key, (keyCount.get(key) ?? 0) + 1)
  })

  return rows.map((row) => {
    const errors: string[] = []
    const idSegmenValue = row.id_segmen
    const faseValue = row.fase_tanam
    const key = `${row.id_segmen}|${row.subsegmen}|${row.periode}`

    if (!/^\d{9}$/.test(idSegmenValue)) {
      errors.push("ID segmen harus 9 digit angka")
    }

    if (!VALID_PHASE_CODES.has(faseValue)) {
      errors.push("fase_tanam tidak valid")
    }

    const isDuplicate = (keyCount.get(key) ?? 0) > 1
    if (isDuplicate) {
      errors.push("Duplikat kombinasi segmen + subsegmen + periode")
    }

    return {
      ...row,
      errors,
      isDuplicate,
    }
  })
}

function parseExcelToRows(file: File): Promise<ImportRow[]> {
  return new Promise(async (resolve) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: "" })

      if (json.length === 0) {
        resolve(buildDummyRows())
        return
      }

      const rows: ImportRow[] = []
      const baseKeys = [
        "id_segmen",
        "segmen",
        "id segmen",
        "subsegmen",
        "sub segmen",
        "periode",
        "fase_tanam",
        "fase tanam",
      ]

      json.forEach((row) => {
        const normalizedRow = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value])
        )

        const id_segmen = normalizeField(
          normalizedRow["id_segmen"] ?? normalizedRow["segmen"] ?? normalizedRow["id segmen"]
        )
        const subsegmen = normalizeField(
          normalizedRow["subsegmen"] ?? normalizedRow["sub segmen"]
        )
        const periode = normalizeField(normalizedRow["periode"])
        const fase_tanam = normalizeField(
          normalizedRow["fase_tanam"] ?? normalizedRow["fase tanam"]
        )

        const otherKeys = Object.keys(normalizedRow).filter(
          (key) => !baseKeys.includes(key)
        )

        if (otherKeys.length > 0) {
          otherKeys.forEach((key) => {
            const value = normalizeField(normalizedRow[key])
            if (value) {
              rows.push({
                id_segmen: id_segmen || "123456789",
                subsegmen: subsegmen || `A${Math.floor(Math.random() * 10) + 1}`,
                periode: periode || key,
                fase_tanam: value || fase_tanam || "1",
              })
            }
          })
        } else {
          rows.push({
            id_segmen: id_segmen || "123456789",
            subsegmen: subsegmen || "A1",
            periode: periode || "2024-01",
            fase_tanam: fase_tanam || "1",
          })
        }
      })

      resolve(rows.length > 0 ? rows : buildDummyRows())
    } catch (error) {
      resolve(buildDummyRows())
    }
  })
}

export default function ImportDataKSA() {
  const [stage, setStage] = React.useState<"upload" | "parsing" | "preview" | "saved">("upload")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState<string>("")
  const [rows, setRows] = React.useState<ValidatedImportRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [savedCount, setSavedCount] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string>("")

  const validRowCount = rows.filter((row) => row.errors.length === 0).length
  const invalidRowCount = rows.length - validRowCount
  const hasErrors = invalidRowCount > 0

  const handleDownloadTemplate = () => {
    const templateRows = [
      { id_segmen: "123456789", subsegmen: "A1", periode: "2024-01", fase_tanam: "1" },
      { id_segmen: "123456790", subsegmen: "A2", periode: "2024-02", fase_tanam: "2" },
    ]
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateRows)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
    const excelData = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelData], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "template-data-ksa.xlsx"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setFileError("Format file tidak valid. Harap unggah file .xlsx atau .xls.")
      return
    }

    setSelectedFile(file)
    setFileError("")
    setStage("parsing")
    setIsLoading(true)

    parseExcelToRows(file).then((parsedRows) => {
      const validatedRows = validateImportRows(parsedRows)
      setRows(validatedRows)
      setIsLoading(false)
      setStage("preview")
    })
  }

  const resetUploader = () => {
    setStage("upload")
    setSelectedFile(null)
    setFileError("")
    setRows([])
    setSavedCount(0)
    setSaveError("")
  }

  const handleSaveToDatabase = async () => {
  setIsSaving(true)
  setSaveError("")

  const payload = rows.map(({ errors, isDuplicate, ...row }) => row)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setSaveError("Silakan login kembali.")
      return
    }

    const response = await fetch("/api/admin/admin/import-ksa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ rows: payload }),
    })

    const result = await response.json()

    if (!response.ok) {
      setSaveError(result?.error || "Gagal menyimpan data ke database.")
      return
    }

    setSavedCount(result.savedCount ?? payload.length)
    setStage("saved")
  } catch (error) {
    console.error(error)
    setSaveError("Terjadi kesalahan jaringan. Coba lagi.")
  } finally {
    setIsSaving(false)
  }
}

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const stepLabels = ["Upload", "Parsing", "Preview", "Selesai"]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {stepLabels.map((label, index) => {
          const stepIndex = index + 1
          const activeIndex =
            stage === "upload"
              ? 1
              : stage === "parsing"
              ? 2
              : stage === "preview"
              ? 3
              : 4
          const isActive = stepIndex === activeIndex
          return (
            <div
              key={label}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                isActive
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              }`}
            >
              {label}
            </div>
          )
        })}
      </div>

      {stage === "upload" && (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
            <div>
              <CardTitle>Unggah file KSA</CardTitle>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Seret dan letakkan file .xlsx/.xls di area ini atau pilih file dari komputer.
              </p>
            </div>
            <Button
              variant="outline"
              className="inline-flex items-center gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="size-4" /> Unduh Template
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="relative rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Upload className="mx-auto mb-3 size-6 text-emerald-600" />
              <p className="text-sm font-semibold">Tarik dan lepas file di sini</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Hanya file .xlsx dan .xls yang diterima.
              </p>
              <label className="mt-5 inline-flex cursor-pointer items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Pilih File
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  onChange={handleSelectFile}
                />
              </label>
              {fileError ? (
                <p className="mt-4 text-sm text-destructive">{fileError}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {stage === "parsing" && (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="px-5 py-10 text-center">
            <Upload className="mx-auto mb-4 size-10 text-emerald-600 animate-pulse" />
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Memproses file...</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sistem sedang membaca data Excel dan menyiapkan preview.
            </p>
          </CardContent>
        </Card>
      )}

      {stage === "preview" && (
        <div className="space-y-5">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="px-5 py-5">
              <CardTitle>Hasil Preview & Validasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="flex flex-wrap gap-4">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-semibold">Baris valid</p>
                  <p>{validRowCount}</p>
                </div>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <p className="font-semibold">Baris bermasalah</p>
                  <p>{invalidRowCount}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segmen</TableHead>
                      <TableHead>Subsegmen</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Fase Tanam</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => {
                      const rowHasError = row.errors.length > 0
                      return (
                        <TableRow
                          key={`${row.id_segmen}-${row.subsegmen}-${row.periode}-${index}`}
                          className={rowHasError ? "bg-rose-50 dark:bg-rose-950/40" : ""}
                        >
                          <TableCell>{row.id_segmen}</TableCell>
                          <TableCell>{row.subsegmen}</TableCell>
                          <TableCell>{row.periode}</TableCell>
                          <TableCell>{row.fase_tanam}</TableCell>
                          <TableCell className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            {rowHasError ? (
                              <>
                                <AlertTriangle className="size-4 text-rose-600" />
                                <span>{row.errors.join(", ")}</span>
                              </>
                            ) : (
                              <span className="text-emerald-700">Valid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {saveError ? (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <XCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" onClick={resetUploader} disabled={isSaving}>
                  Batal
                </Button>
                <Button disabled={hasErrors || isSaving} onClick={handleSaveToDatabase}>
                  {isSaving ? "Menyimpan..." : "Simpan ke Database"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "saved" && (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="text-center px-5 py-10">
            <CheckCircle className="mx-auto mb-4 size-10 text-emerald-600" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Data berhasil disimpan</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {savedCount} baris data berhasil disimpan.
            </p>
            <Button className="mt-6" onClick={resetUploader}>
              Upload Data Lain
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === "parsing" && isLoading && (
        <div className="sr-only">Memproses file...</div>
      )}
    </div>
  )
}