"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase/client"
import { logActivity } from "@/lib/supabase/activity-log"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

const FASE_OPTIONS = [
  { value: "1", label: "1 - Vegetatif Awal" },
  { value: "2", label: "2 - Vegetatif Akhir" },
  { value: "3", label: "3 - Generatif" },
  { value: "4", label: "4 - Panen" },
  { value: "5", label: "5 - Persiapan Lahan" },
  { value: "6", label: "6 - Puso" },
  { value: "7", label: "7 - Sawah Bukan Padi" },
  { value: "8", label: "8 - Bukan Sawah" },
]

const DEFAULT_FASE_CODE = FASE_OPTIONS[0].value

interface KecamatanRef {
  id: string
  kode_kecamatan: string
  nama_kecamatan: string
}

interface SegmenRef {
  id: string
  id_segmen: string
  kecamatan_id: string
}

interface SubsegmenRef {
  id: string
  segmen_id: string
  kode_subsegmen: string
}

interface KsaSegmentRow {
  id: string
  id_segmen: string
  subsegmen: string
  periode: string
  fase_tanam: string
  created_at: string | null
}

interface TableRowData {
  id: string
  id_segmen: string
  kode_subsegmen: string
  nama_kecamatan: string
  kode_kecamatan: string
  periode: string
  fase_tanam: string
  created_at: string | null
  kecamatan_id: string
  segmen_id: string
}

function isValidPhaseCode(fase: string) {
  const num = Number(fase)
  if (Number.isNaN(num)) return false
  return num >= 1 && num < 9
}

function buildTableRows(
  rows: KsaSegmentRow[],
  segmenList: SegmenRef[],
  kecamatanList: KecamatanRef[]
): TableRowData[] {
  return rows.map((item) => {
    const seg = segmenList.find((segmen) => segmen.id_segmen === item.id_segmen)
    const kec = kecamatanList.find((kecamatan) => kecamatan.id === seg?.kecamatan_id)

    return {
      id: item.id,
      id_segmen: item.id_segmen,
      kode_subsegmen: item.subsegmen,
      nama_kecamatan: kec?.nama_kecamatan ?? "-",
      kode_kecamatan: kec?.kode_kecamatan ?? "-",
      periode: item.periode,
      fase_tanam: String(item.fase_tanam ?? ""),
      created_at: item.created_at,
      kecamatan_id: kec?.id ?? "",
      segmen_id: seg?.id ?? "",
    }
  })
}

function formatWaktuImport(value: string | null) {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return value
  }
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
      {children}
    </span>
  )
}

export default function KelolaDataKSA() {
  const { id: actorId, name, email } = useAdminAuth()
  const actorName = name || email || "Admin"

  const [kecamatanList, setKecamatanList] = React.useState<KecamatanRef[]>([])
  const [segmenList, setSegmenList] = React.useState<SegmenRef[]>([])
  const [subsegmenList, setSubsegmenList] = React.useState<SubsegmenRef[]>([])

  const [importRows, setImportRows] = React.useState<KsaSegmentRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState("")
  const [isLiveConnected, setIsLiveConnected] = React.useState(false)

  const [filterKecamatan, setFilterKecamatan] = React.useState("")
  const [filterSegmen, setFilterSegmen] = React.useState("")
  const [filterPeriode, setFilterPeriode] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [viewingRowId, setViewingRowId] = React.useState<string | null>(null)

  const [editPeriode, setEditPeriode] = React.useState("")
  const [editFase, setEditFase] = React.useState(DEFAULT_FASE_CODE)
  const [editError, setEditError] = React.useState("")

  const [addKecamatan, setAddKecamatan] = React.useState("")
  const [addSegmen, setAddSegmen] = React.useState("")
  const [addSubsegmen, setAddSubsegmen] = React.useState("")
  const [addPeriode, setAddPeriode] = React.useState("")
  const [addFase, setAddFase] = React.useState(DEFAULT_FASE_CODE)
  const [addError, setAddError] = React.useState("")

  const [notification, setNotification] = React.useState<string>("")

  const fetchReferenceData = React.useCallback(async () => {
    const [{ data: kec }, { data: seg }, { data: sub }] = await Promise.all([
      supabase.from("kecamatan").select("id, kode_kecamatan, nama_kecamatan").order("kode_kecamatan"),
      supabase.from("segmen").select("id, id_segmen, kecamatan_id").order("id_segmen"),
      supabase.from("subsegmen").select("id, segmen_id, kode_subsegmen").order("kode_subsegmen"),
    ])

    setKecamatanList(kec ?? [])
    setSegmenList(seg ?? [])
    setSubsegmenList(sub ?? [])
  }, [])

  const fetchImportedData = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError("")

    const { data, error } = await supabase
      .from("ksa_segments")
      .select("id, id_segmen, subsegmen, periode, fase_tanam, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (error) {
      setLoadError(error.message || "Gagal memuat data observasi KSA.")
      setIsLoading(false)
      return
    }

    setImportRows(data ?? [])
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    fetchReferenceData()
    fetchImportedData()
  }, [fetchReferenceData, fetchImportedData])

  React.useEffect(() => {
    const channel = supabase
      .channel("ksa_segments-kelola-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ksa_segments" },
        () => {
          fetchImportedData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kecamatan" },
        () => {
          fetchReferenceData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "segmen" },
        () => {
          fetchReferenceData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subsegmen" },
        () => {
          fetchReferenceData()
        }
      )
      .subscribe((status) => {
        setIsLiveConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchImportedData, fetchReferenceData])

  const tableRows = React.useMemo(
    () => buildTableRows(importRows, segmenList, kecamatanList),
    [importRows, segmenList, kecamatanList]
  )

  const periodeOptions = React.useMemo(
    () => Array.from(new Set(tableRows.map((row) => row.periode))).sort(),
    [tableRows]
  )

  const segmenOptions = React.useMemo(
    () =>
      filterKecamatan
        ? segmenList.filter((seg) => seg.kecamatan_id === filterKecamatan)
        : segmenList,
    [filterKecamatan, segmenList]
  )

  const filteredRows = React.useMemo(() => {
    return tableRows.filter((row) => {
      const matchesKecamatan = filterKecamatan ? row.kecamatan_id === filterKecamatan : true
      const matchesSegmen = filterSegmen ? row.segmen_id === filterSegmen : true
      const matchesPeriode = filterPeriode ? row.periode === filterPeriode : true
      const matchesSearch = searchQuery
        ? [row.id_segmen, row.kode_subsegmen]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true

      return matchesKecamatan && matchesSegmen && matchesPeriode && matchesSearch
    })
  }, [filterKecamatan, filterSegmen, filterPeriode, searchQuery, tableRows])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  React.useEffect(() => {
    setPage(1)
  }, [filterKecamatan, filterSegmen, filterPeriode, searchQuery, pageSize])

  React.useEffect(() => {
    if (!notification) return
    const handle = window.setTimeout(() => setNotification(""), 2500)
    return () => window.clearTimeout(handle)
  }, [notification])

  const openEdit = (rowId: string) => {
    const current = tableRows.find((row) => row.id === rowId)
    if (!current) return
    setViewingRowId(rowId)
    setEditPeriode(current.periode)

    setEditFase(
      FASE_OPTIONS.some((opt) => opt.value === current.fase_tanam)
        ? current.fase_tanam
        : DEFAULT_FASE_CODE
    )
    setEditError("")
    setIsEditOpen(true)
  }

  const openDelete = (rowId: string) => {
    setViewingRowId(rowId)
    setIsDeleteOpen(true)
  }

  const selectedEditRow = viewingRowId
    ? tableRows.find((row) => row.id === viewingRowId)
    : null

  const handleSaveEdit = async () => {
    if (!selectedEditRow) return
    setEditError("")

    const { error } = await supabase
      .from("ksa_segments")
      .update({ periode: editPeriode, fase_tanam: editFase })
      .eq("id", selectedEditRow.id)

    if (error) {
      setEditError(error.message || "Gagal menyimpan perubahan.")
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "update_data",
      description: `Memperbarui data KSA segmen ${selectedEditRow.id_segmen} - ${selectedEditRow.kode_subsegmen} periode ${editPeriode}`,
      module: "kelola_data",
    })

    setIsEditOpen(false)
    setNotification("Perubahan berhasil disimpan")
    fetchImportedData()
  }

  const handleDelete = async () => {
    if (!viewingRowId) return

    const target = tableRows.find((row) => row.id === viewingRowId)

    const { error } = await supabase.from("ksa_segments").delete().eq("id", viewingRowId)

    if (error) {
      setNotification(error.message || "Gagal menghapus data")
      setIsDeleteOpen(false)
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "delete_data",
      description: `Menghapus data KSA segmen ${target?.id_segmen ?? ""} - ${target?.kode_subsegmen ?? ""} periode ${target?.periode ?? ""}`,
      module: "kelola_data",
    })

    setIsDeleteOpen(false)
    setNotification("Data berhasil dihapus")
    fetchImportedData()
  }

  const resetFilters = () => {
    setFilterKecamatan("")
    setFilterSegmen("")
    setFilterPeriode("")
    setSearchQuery("")
  }

  const availableAddSegmen = React.useMemo(
    () =>
      addKecamatan
        ? segmenList.filter((seg) => seg.kecamatan_id === addKecamatan)
        : [],
    [addKecamatan, segmenList]
  )

  const availableAddSubsegmen = React.useMemo(
    () =>
      addSegmen
        ? subsegmenList.filter((sub) => sub.segmen_id === addSegmen)
        : [],
    [addSegmen, subsegmenList]
  )

  const handleOpenAdd = () => {
    setAddKecamatan("")
    setAddSegmen("")
    setAddSubsegmen("")
    setAddPeriode("")
    setAddFase(DEFAULT_FASE_CODE)
    setAddError("")
    setIsAddOpen(true)
  }

  const addSegmenCode = React.useMemo(
    () => segmenList.find((seg) => seg.id === addSegmen)?.id_segmen ?? "",
    [addSegmen, segmenList]
  )
  const addSubsegmenCode = React.useMemo(
    () => subsegmenList.find((sub) => sub.id === addSubsegmen)?.kode_subsegmen ?? "",
    [addSubsegmen, subsegmenList]
  )

  const addDuplicateError = React.useMemo(() => {
    if (!addSegmenCode || !addSubsegmenCode || !addPeriode) return ""
    const exists = importRows.some(
      (item) =>
        item.id_segmen === addSegmenCode &&
        item.subsegmen === addSubsegmenCode &&
        item.periode === addPeriode
    )
    return exists ? "Data untuk subsegmen dan periode ini sudah ada" : ""
  }, [addSegmenCode, addSubsegmenCode, addPeriode, importRows])

  const handleSaveAdd = async () => {
    if (!addKecamatan || !addSegmenCode || !addSubsegmenCode || !addPeriode || !addFase) return
    if (addDuplicateError) {
      setAddError(addDuplicateError)
      return
    }

    setAddError("")

    const { error } = await supabase.from("ksa_segments").insert({
      id_segmen: addSegmenCode,
      subsegmen: addSubsegmenCode,
      periode: addPeriode,
      fase_tanam: addFase,
    })

    if (error) {
      setAddError(error.message || "Gagal menambahkan data.")
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "add_reference",
      description: `Menambahkan data KSA manual: segmen ${addSegmenCode} - ${addSubsegmenCode} periode ${addPeriode}`,
      module: "kelola_data",
    })

    setIsAddOpen(false)
    setNotification("Data baru berhasil ditambahkan")
    fetchImportedData()
  }

  const selectedDeleteRow = viewingRowId
    ? tableRows.find((row) => row.id === viewingRowId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Button className="inline-flex items-center gap-2" onClick={handleOpenAdd}>
          <Plus className="size-4" /> Tambah Data
        </Button>
      </div>

      {notification ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            <span>{notification}</span>
          </div>
        </div>
      ) : null}

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="px-5 pt-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="grid gap-4 md:grid-cols-4 md:flex-1">
              <div className="space-y-2">
                <Label htmlFor="filter-kecamatan">Kecamatan</Label>
                <Select
                  value={filterKecamatan}
                  onValueChange={(value) => {
                    setFilterKecamatan(value)
                    setFilterSegmen("")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kecamatan</SelectItem>
                    {kecamatanList.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nama_kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-segmen">Segmen</Label>
                <Select
                  value={filterSegmen}
                  onValueChange={(value) => setFilterSegmen(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Segmen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Segmen</SelectItem>
                    {segmenOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.id_segmen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-periode">Bulan / Periode</Label>
                <Select
                  value={filterPeriode}
                  onValueChange={(value) => setFilterPeriode(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Periode</SelectItem>
                    {periodeOptions.map((periode) => (
                      <SelectItem key={periode} value={periode}>
                        {periode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-query">Cari Segmen/Subsegmen</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="search-query"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari id_segmen atau subsegmen"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="flex flex-col gap-4 border-t border-slate-200 px-5 pb-5 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {filteredRows.length} hasil ditemukan.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </CardHeader>
      </Card>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="mb-0">Daftar Observasi KSA</CardTitle>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isLiveConnected
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              {isLiveConnected ? "Live" : "Menghubungkan..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
              Data hasil Import Data, diperbarui otomatis.
            </p>
            <Button variant="outline" size="sm" onClick={fetchImportedData} disabled={isLoading}>
              {isLoading ? "Memuat..." : "Muat Ulang"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {loadError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-200">
              {loadError}
            </p>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-8 py-14 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              <AlertTriangle className="mx-auto mb-3 size-10" />
              <p className="text-lg font-semibold">
                {isLoading ? "Memuat data..." : "Tidak ada data ditemukan"}
              </p>
              <p className="mt-2 text-sm">
                {isLoading
                  ? "Mohon tunggu sebentar."
                  : "Ubah filter, reset, atau lakukan Import Data untuk melihat data di sini."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Segmen</TableHead>
                      <TableHead className="text-center">Subsegmen</TableHead>
                      <TableHead className="text-center">Kecamatan</TableHead>
                      <TableHead className="text-center">Periode</TableHead>
                      <TableHead className="text-center">Fase Tanam</TableHead>
                      <TableHead className="text-center">Waktu Import</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center">{row.id_segmen}</TableCell>
                        <TableCell className="text-center">{row.kode_subsegmen}</TableCell>
                        <TableCell className="text-center">{row.nama_kecamatan}</TableCell>
                        <TableCell className="text-center">{row.periode}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <span>{row.fase_tanam}</span>
                            {!isValidPhaseCode(row.fase_tanam) ? <Badge>tidak valid</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-600 dark:text-slate-300">
                          {formatWaktuImport(row.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEdit(row.id)}
                              className="border-slate-200 text-slate-600 hover:bg-slate-100"
                              aria-label="Edit"
                            >
                              <Edit3 className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openDelete(row.id)}
                              className="border-slate-200 text-slate-600 hover:bg-slate-100"
                              aria-label="Hapus"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span>Baris per halaman:</span>
                  <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-[6.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>Halaman</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={page <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <span>{page} / {pageCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                    disabled={page >= pageCount}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isEditOpen && selectedEditRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Observasi KSA</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Kecamatan, segmen, dan subsegmen tidak dapat diubah di sini.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Kecamatan</Label>
                  <Input value={selectedEditRow.nama_kecamatan} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Segmen</Label>
                  <Input value={selectedEditRow.id_segmen} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Subsegmen</Label>
                  <Input value={selectedEditRow.kode_subsegmen} readOnly />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Periode</Label>
                  <Input
                    type="month"
                    value={editPeriode}
                    onChange={(event) => setEditPeriode(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fase Tanam</Label>
                  <Select value={editFase} onValueChange={(value) => setEditFase(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kode fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {FASE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEditRow && !FASE_OPTIONS.some((opt) => opt.value === selectedEditRow.fase_tanam) ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kode asli data ini: {selectedEditRow.fase_tanam} (sub-kode). Simpan untuk mengganti ke kode utama di atas.
                    </p>
                  ) : null}
                </div>
              </div>
              {editError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-200">
                  {editError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={!editPeriode || !editFase}
                onClick={handleSaveEdit}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tambah Data Manual</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Isi semua field untuk menambahkan observasi baru.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Kecamatan</Label>
                  <Select value={addKecamatan} onValueChange={(value) => {
                    setAddKecamatan(value)
                    setAddSegmen("")
                    setAddSubsegmen("")
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Pilih Kecamatan</SelectItem>
                      {kecamatanList.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nama_kecamatan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Segmen</Label>
                  <Select value={addSegmen} onValueChange={(value) => {
                    setAddSegmen(value)
                    setAddSubsegmen("")
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Segmen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Pilih Segmen</SelectItem>
                      {availableAddSegmen.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.id_segmen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subsegmen</Label>
                  <Select value={addSubsegmen} onValueChange={(value) => setAddSubsegmen(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Subsegmen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Pilih Subsegmen</SelectItem>
                      {availableAddSubsegmen.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.kode_subsegmen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Periode</Label>
                  <Input
                    type="month"
                    value={addPeriode}
                    onChange={(event) => setAddPeriode(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fase Tanam</Label>
                  <Select value={addFase} onValueChange={(value) => setAddFase(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kode fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {FASE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {addError || addDuplicateError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-200">
                  {addError || addDuplicateError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={
                  !addKecamatan || !addSegmen || !addSubsegmen || !addPeriode || !addFase || !!addDuplicateError
                }
                onClick={handleSaveAdd}
              >
                Simpan Data
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteOpen && selectedDeleteRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Konfirmasi Hapus</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pastikan data yang akan dihapus sudah benar.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-600 dark:text-slate-400">Data yang akan dihapus:</p>
                <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">Segmen: {selectedDeleteRow.id_segmen}</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">Subsegmen: {selectedDeleteRow.kode_subsegmen}</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">Periode: {selectedDeleteRow.periode}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}