"use client"

import { supabase } from "@/lib/supabase/client"
import { logActivity } from "@/lib/supabase/activity-log"
import * as React from "react"
import * as XLSX from "xlsx"
import { AlertTriangle, CheckCircle, Download, Upload, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
]

const INDONESIAN_MONTH: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, agu: 8,
  sep: 9, okt: 10, nov: 11, des: 12,
}

type ImportRow = {
  segment_id: string
  subsegment: string
  periode: string
  phase: string
}

type ValidatedImportRow = ImportRow & {
  errors: string[]
  autoFixes: string[]
  isDuplicate: boolean
  skip: boolean
}

function normalizeField(value: unknown) {
  return String(value ?? "").trim()
}

function tryFixSegmentId(raw: string): { value: string; fixed: boolean } | null {
  if (/^\d{9}$/.test(raw)) return { value: raw, fixed: false }

  const digitsOnly = raw.replace(/\D/g, "")

  if (digitsOnly.length === 9) return { value: digitsOnly, fixed: true }
  if (digitsOnly.length === 8) return { value: `0${digitsOnly}`, fixed: true }

  return null
}

function detectWideFormat(headers: string[]): string[] | null {
  const monthHeaders = headers.filter((h) => {
    const lower = h.toLowerCase()
    return MONTH_LABELS.some((m) => lower.startsWith(m.toLowerCase())) ||
      /^\d{3,4}$/.test(h.trim())
  })
  return monthHeaders.length > 0 ? monthHeaders : null
}

function parseWideFormat(
  raw: unknown[][],
  headers: string[],
  monthCols: string[],
  segmenIdx: number,
  subsegIdx: number,
  defaultYear?: number
): ImportRow[] {
  const rows: ImportRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]
    const segmentId = normalizeField(row[segmenIdx] ?? "")
    const subsegment = normalizeField(row[subsegIdx] ?? "")
    if (!segmentId || !subsegment) continue

    for (const monthCol of monthCols) {
      const colIdx = headers.indexOf(monthCol)
      if (colIdx === -1) continue
      const phaseRaw = row[colIdx]
      if (phaseRaw === "" || phaseRaw === undefined || phaseRaw === null) continue
      const phase = normalizeField(phaseRaw)
      if (!phase) continue

      let monthNum: number | null = null
      let year: number | null = null
      const lower = monthCol.toLowerCase()

      MONTH_LABELS.forEach((m, idx) => {
        if (lower.startsWith(m.toLowerCase())) monthNum = idx + 1
      })

      if (monthNum) {
        year = defaultYear ?? null
      } else {
        const digits = monthCol.replace(/\D/g, "")
        const m = parseInt(digits.slice(0, -2))
        if (m >= 1 && m <= 12) {
          monthNum = m
          const yy = parseInt(digits.slice(-2))
          year = yy > 50 ? 1900 + yy : 2000 + yy
        }
      }
      if (!monthNum || !year) continue

      const periode = `${year}-${String(monthNum).padStart(2, "0")}`
      rows.push({ segment_id: segmentId, subsegment, periode, phase })
    }
  }
  return rows
}

function parseLongFormat(
  headers: string[],
  raw: unknown[][],
  defaultPeriode?: string
): ImportRow[] {
  const rows: ImportRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]

    const segmentId = normalizeField(
      row[headers.findIndex((h) => ["segment_id", "id_segmen", "segmen", "id segmen"].includes(h.toLowerCase()))] ?? ""
    )
    const subsegment = normalizeField(
      row[headers.findIndex((h) => ["subsegment", "subsegmen", "sub segmen"].includes(h.toLowerCase()))] ?? ""
    )
    const periodeIdx = headers.findIndex((h) => h.toLowerCase() === "periode")
    const phaseIdx = headers.findIndex(
      (h) => ["phase", "fase_tanam", "fase tanam", "n"].includes(h.toLowerCase())
    )

    let periode = periodeIdx >= 0 ? normalizeField(row[periodeIdx] ?? "") : ""

    if (!periode) {
      const tanggalIdx = headers.findIndex((h) => h.toLowerCase() === "tanggal")
      if (tanggalIdx >= 0) {
        const rawDate = row[tanggalIdx]
        if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          const y = rawDate.getFullYear()
          const m = String(rawDate.getMonth() + 1).padStart(2, "0")
          periode = `${y}-${m}`
        }
      }
    }

    if (!periode) {
      periode = defaultPeriode ?? ""
    }

    const phase = phaseIdx >= 0 ? normalizeField(row[phaseIdx] ?? "") : ""

    rows.push({ segment_id: segmentId, subsegment, periode, phase })
  }
  return rows
}

function parseExcelToRows(file: File, defaultYear?: number, defaultPeriode?: string): Promise<ImportRow[]> {
  return new Promise(async (resolve) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: "" })
      const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { defval: "", header: 1 })

      if (json.length === 0 || raw.length < 2) {
        resolve([])
        return
      }

      const headers = raw[0].map((h) => String(h).trim())
      const monthCols = detectWideFormat(headers)

      let rows: ImportRow[]

      if (monthCols) {
        const segmenIdx = headers.findIndex(
          (h) => ["id segmen", "segmen", "segment_id", "id_segmen"].includes(h.toLowerCase())
        )
        const subsegIdx = headers.findIndex(
          (h) => ["subsegmen", "subsegment", "sub segmen"].includes(h.toLowerCase())
        )

        if (segmenIdx === -1 || subsegIdx === -1) {
          resolve([])
          return
        }

        rows = parseWideFormat(raw, headers, monthCols, segmenIdx, subsegIdx, defaultYear)
      } else {
        rows = parseLongFormat(headers, raw, defaultPeriode)
      }

      resolve(rows)
    } catch {
      resolve([])
    }
  })
}

function extractFileInfo(name: string): { periode?: string; year?: number } {
  const raw = name.replace(/\.\w+$/, "").toLowerCase()
  let foundMonth: number | null = null
  let foundYear: number | null = null

  for (const [word, num] of Object.entries(INDONESIAN_MONTH)) {
    if (raw.includes(word)) {
      foundMonth = num
      break
    }
  }

  const yearMatch = raw.match(/\b(20\d{2})\b/)
  if (yearMatch) foundYear = parseInt(yearMatch[1])

  if (foundMonth && foundYear) {
    return { periode: `${foundYear}-${String(foundMonth).padStart(2, "0")}`, year: foundYear }
  }
  if (foundYear) return { year: foundYear }
  return {}
}

export default function ImportDataKSA() {
  const [stage, setStage] = React.useState<"upload" | "parsing" | "preview" | "saved">("upload")
  const setSelectedFile = React.useState<File | null>(null)[1]
  const [fileError, setFileError] = React.useState<string>("")
  const [validatedRows, setValidatedRows] = React.useState<ValidatedImportRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [savedCount, setSavedCount] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string>("")
  const [periodeInput, setPeriodeInput] = React.useState("")

  const savableRows = validatedRows.filter((row) => row.errors.length === 0 && !row.skip)
  const validRowCount = savableRows.length
  const invalidRowCount = validatedRows.length - validRowCount
  const autoFixedCount = validatedRows.filter((row) => row.autoFixes.length > 0 && row.errors.length === 0).length

  function validateRows(rows: ImportRow[]): ValidatedImportRow[] {
    const fixedRows = rows.map((row) => {
      const errors: string[] = []
      const autoFixes: string[] = []

      let segment_id = row.segment_id
      const idFix = tryFixSegmentId(row.segment_id)
      if (idFix) {
        segment_id = idFix.value
        if (idFix.fixed) autoFixes.push(`ID segmen dikoreksi jadi "${idFix.value}"`)
      } else {
        errors.push("ID segmen harus 9 digit angka")
      }

      if (!row.subsegment) {
        errors.push("Subsegmen tidak boleh kosong")
      }
      if (!row.periode) {
        errors.push("Periode tidak boleh kosong")
      }
      if (!row.phase) {
        errors.push("Phase tidak boleh kosong")
      }

      return { ...row, segment_id, errors, autoFixes }
    })

    const keyCount = new Map<string, number>()
    fixedRows.forEach((row) => {
      const key = `${row.segment_id}|${row.subsegment}|${row.periode}`
      keyCount.set(key, (keyCount.get(key) ?? 0) + 1)
    })

    const seenKeys = new Set<string>()

    return fixedRows.map((row) => {
      const key = `${row.segment_id}|${row.subsegment}|${row.periode}`
      const isDuplicate = (keyCount.get(key) ?? 0) > 1
      let skip = false

      if (isDuplicate) {
        if (seenKeys.has(key)) {
          row.errors.push("Duplikat kombinasi segmen + subsegmen + periode (baris ini dilewati otomatis)")
          skip = true
        } else {
          row.autoFixes.push("Duplikat ditemukan -- baris pertama ini yang akan disimpan")
        }
        seenKeys.add(key)
      }

      return { ...row, isDuplicate, skip }
    })
  }

  const handleDownloadTemplate = () => {
    const templateRows = [
      { segment_id: "123456789", subsegment: "A1", periode: "2024-01", phase: "3.1" },
      { segment_id: "123456790", subsegment: "A2", periode: "2024-02", phase: "4" },
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

    const fileInfo = extractFileInfo(file.name)
    const effectivePeriode = periodeInput || (fileInfo.periode ?? "")
    const effectiveYear = fileInfo.year ?? (periodeInput ? parseInt(periodeInput.split("-")[0]) : undefined)

    parseExcelToRows(file, effectiveYear || undefined, effectivePeriode || undefined).then((parsedRows) => {
      const validated = validateRows(parsedRows)
      setValidatedRows(validated)
      setIsLoading(false)
      setStage("preview")
    })
  }

  const resetUploader = () => {
    setStage("upload")
    setSelectedFile(null)
    setFileError("")
    setValidatedRows([])
    setSavedCount(0)
    setSaveError("")
    setPeriodeInput("")
  }

  const handleSaveToDatabase = async () => {
    setIsSaving(true)
    setSaveError("")

    const payload = savableRows.map(({ segment_id, subsegment, periode, phase }) => ({
      segment_id,
      subsegment,
      periode,
      phase,
    }))

    if (payload.length === 0) {
      setSaveError("Tidak ada baris valid untuk disimpan.")
      setIsSaving(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const rowsToInsert = payload.map((row) => ({
        ...row,
        created_by: user?.id ?? null,
      }))

      const { error, count } = await supabase
        .from("data_ksa")
        .upsert(rowsToInsert, { onConflict: "segment_id,subsegment,periode", count: "exact" })

      if (error) {
        setSaveError(error.message || "Gagal menyimpan data ke database.")
        return
      }

      const savedRowCount = count ?? payload.length

      await logActivity({
        actorId: user?.id ?? null,
        actorName: user?.email ?? "Admin",
        actionType: "import_data",
        description: `Mengunggah ${savedRowCount} baris data KSA baru`,
        module: "import_data",
      })

      setSavedCount(savedRowCount)
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
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tahun / Periode <span className="text-slate-400">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={periodeInput}
                  onChange={(e) => setPeriodeInput(e.target.value)}
                  placeholder="contoh: 2025 atau 2025-06"
                  className="flex h-10 w-56 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="text-xs text-slate-400">
                  Diisi jika file tidak memiliki kolom <code>periode</code>. Terisi otomatis dari nama file jika dikenali.
                </p>
              </div>
            </div>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="relative rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Upload className="mx-auto mb-3 size-6 text-emerald-600" />
              <p className="text-sm font-semibold">Tarik dan lepas file di sini</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Mendukung format wide (kolom bulan), hybrid (nama bulan), maupun long (segment_id, subsegment, periode, phase).
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
                  <p className="font-semibold">Baris siap disimpan</p>
                  <p>{validRowCount}</p>
                </div>
                {autoFixedCount > 0 && (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">Otomatis diperbaiki</p>
                    <p>{autoFixedCount}</p>
                  </div>
                )}
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <p className="font-semibold">Dilewati (invalid/duplikat)</p>
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
                      <TableHead>Phase</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedRows.map((row, index) => {
                      const rowHasBlockingError = row.errors.length > 0
                      const rowHasAutoFix = row.autoFixes.length > 0 && !rowHasBlockingError
                      return (
                        <TableRow
                          key={`${row.segment_id}-${row.subsegment}-${row.periode}-${index}`}
                          className={
                            rowHasBlockingError
                              ? "bg-rose-50 dark:bg-rose-950/40"
                              : rowHasAutoFix
                              ? "bg-amber-50 dark:bg-amber-950/20"
                              : ""
                          }
                        >
                          <TableCell>{row.segment_id}</TableCell>
                          <TableCell>{row.subsegment}</TableCell>
                          <TableCell>{row.periode}</TableCell>
                          <TableCell>{row.phase}</TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            {rowHasBlockingError ? (
                              <div className="flex items-start gap-2">
                                <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                                <span>{row.errors.join(", ")}</span>
                              </div>
                            ) : rowHasAutoFix ? (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                <span>{row.autoFixes.join(", ")}</span>
                              </div>
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
                <Button disabled={validRowCount === 0 || isSaving} onClick={handleSaveToDatabase}>
                  {isSaving
                    ? "Menyimpan..."
                    : `Simpan ${validRowCount} Baris ke Database`}
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
