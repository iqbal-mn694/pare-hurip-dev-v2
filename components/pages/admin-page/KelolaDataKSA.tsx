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

const DEFAULT_FASE_CODE = ""

interface DistrictRef {
  id: string
  district_code: string
  name: string
}

interface KsaSegmentRow {
  id: string
  segment_id: string
  subsegment: string
  periode: string
  phase: string
  created_at: string | null
}

interface TableRowData {
  id: string
  segment_id: string
  subsegment: string
  nama_kecamatan: string
  periode: string
  phase: string
  created_at: string | null
}

function buildTableRows(
  rows: KsaSegmentRow[],
  districtList: DistrictRef[]
): TableRowData[] {
  return rows.map((item) => {
    const kec = districtList.find((k) => item.segment_id.startsWith(k.district_code))

    return {
      id: item.id,
      segment_id: item.segment_id,
      subsegment: item.subsegment,
      nama_kecamatan: kec?.name ?? "-",
      periode: item.periode,
      phase: String(item.phase ?? ""),
      created_at: item.created_at,
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

export default function KelolaDataKSA() {
  const { id: actorId, name, email } = useAdminAuth()
  const actorName = name || email || "Admin"

  const [districtList, setDistrictList] = React.useState<DistrictRef[]>([])

  const [importRows, setImportRows] = React.useState<KsaSegmentRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState("")
  const [isLiveConnected, setIsLiveConnected] = React.useState(false)

  const [filterKecamatan, setFilterKecamatan] = React.useState("")
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

  const [addSegmenValue, setAddSegmenValue] = React.useState("")
  const [addSubsegmenValue, setAddSubsegmenValue] = React.useState("")
  const [addPeriode, setAddPeriode] = React.useState("")
  const [addFase, setAddFase] = React.useState(DEFAULT_FASE_CODE)
  const [addError, setAddError] = React.useState("")

  const [notification, setNotification] = React.useState<string>("")

  const fetchReferenceData = React.useCallback(async () => {
    const { data } = await supabase
      .from("districts")
      .select("id, district_code, name")
      .order("district_code")

    setDistrictList(data ?? [])
  }, [])

  const fetchImportedData = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError("")

    const { data, error } = await supabase
      .from("data_ksa")
      .select("id, segment_id, subsegment, periode, phase, created_at")
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
      .channel("data_ksa-kelola-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "data_ksa" },
        () => {
          fetchImportedData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "districts" },
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
    () => buildTableRows(importRows, districtList),
    [importRows, districtList]
  )

  const periodeOptions = React.useMemo(
    () => Array.from(new Set(tableRows.map((row) => row.periode))).sort(),
    [tableRows]
  )

  const filteredRows = React.useMemo(() => {
    return tableRows.filter((row) => {
      const matchesKecamatan = filterKecamatan
        ? row.segment_id.startsWith(filterKecamatan)
        : true
      const matchesPeriode = filterPeriode ? row.periode === filterPeriode : true
      const matchesSearch = searchQuery
        ? [row.segment_id, row.subsegment]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true

      return matchesKecamatan && matchesPeriode && matchesSearch
    })
  }, [filterKecamatan, filterPeriode, searchQuery, tableRows])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  React.useEffect(() => {
    setPage(1)
  }, [filterKecamatan, filterPeriode, searchQuery, pageSize])

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
    setEditFase(current.phase)
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
      .from("data_ksa")
      .update({ periode: editPeriode, phase: editFase })
      .eq("id", selectedEditRow.id)

    if (error) {
      setEditError(error.message || "Gagal menyimpan perubahan.")
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "update_data",
      description: `Memperbarui data KSA segmen ${selectedEditRow.segment_id} - ${selectedEditRow.subsegment} periode ${editPeriode}`,
      module: "kelola_data",
    })

    setIsEditOpen(false)
    setNotification("Perubahan berhasil disimpan")
    fetchImportedData()
  }

  const handleDelete = async () => {
    if (!viewingRowId) return

    const target = tableRows.find((row) => row.id === viewingRowId)

    const { error } = await supabase.from("data_ksa").delete().eq("id", viewingRowId)

    if (error) {
      setNotification(error.message || "Gagal menghapus data")
      setIsDeleteOpen(false)
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "delete_data",
      description: `Menghapus data KSA segmen ${target?.segment_id ?? ""} - ${target?.subsegment ?? ""} periode ${target?.periode ?? ""}`,
      module: "kelola_data",
    })

    setIsDeleteOpen(false)
    setNotification("Data berhasil dihapus")
    fetchImportedData()
  }

  const resetFilters = () => {
    setFilterKecamatan("")
    setFilterPeriode("")
    setSearchQuery("")
  }

  const handleOpenAdd = () => {
    setAddSegmenValue("")
    setAddSubsegmenValue("")
    setAddPeriode("")
    setAddFase(DEFAULT_FASE_CODE)
    setAddError("")
    setIsAddOpen(true)
  }

  const addDuplicateError = React.useMemo(() => {
    if (!addSegmenValue || !addSubsegmenValue || !addPeriode) return ""
    const exists = importRows.some(
      (item) =>
        item.segment_id === addSegmenValue &&
        item.subsegment === addSubsegmenValue &&
        item.periode === addPeriode
    )
    return exists ? "Data untuk subsegmen dan periode ini sudah ada" : ""
  }, [addSegmenValue, addSubsegmenValue, addPeriode, importRows])

  const handleSaveAdd = async () => {
    if (!addSegmenValue || !addSubsegmenValue || !addPeriode || !addFase) return
    if (addDuplicateError) {
      setAddError(addDuplicateError)
      return
    }

    setAddError("")

    const { error } = await supabase.from("data_ksa").insert({
      segment_id: addSegmenValue,
      subsegment: addSubsegmenValue,
      periode: addPeriode,
      phase: addFase,
    })

    if (error) {
      setAddError(error.message || "Gagal menambahkan data.")
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "add_reference",
      description: `Menambahkan data KSA manual: segmen ${addSegmenValue} - ${addSubsegmenValue} periode ${addPeriode}`,
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
            <div className="grid gap-4 md:grid-cols-3 md:flex-1">
              <div className="space-y-2">
                <Label htmlFor="filter-kecamatan">Kecamatan</Label>
                <Select
                  value={filterKecamatan}
                  onValueChange={(value) => setFilterKecamatan(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kecamatan</SelectItem>
                    {districtList.map((item) => (
                      <SelectItem key={item.id} value={item.district_code}>
                        {item.name}
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
                    placeholder="Cari segment_id atau subsegmen"
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
                        <TableCell className="text-center">{row.segment_id}</TableCell>
                        <TableCell className="text-center">{row.subsegment}</TableCell>
                        <TableCell className="text-center">{row.nama_kecamatan}</TableCell>
                        <TableCell className="text-center">{row.periode}</TableCell>
                        <TableCell className="text-center">{row.phase}</TableCell>
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
                  <Input value={selectedEditRow.segment_id} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Subsegmen</Label>
                  <Input value={selectedEditRow.subsegment} readOnly />
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
                  <Input
                    value={editFase}
                    onChange={(event) => setEditFase(event.target.value)}
                    placeholder="Contoh: 3.1"
                  />
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Segmen (segment_id)</Label>
                  <Input
                    value={addSegmenValue}
                    onChange={(event) => setAddSegmenValue(event.target.value)}
                    placeholder="Contoh: 3278071"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subsegmen</Label>
                  <Input
                    value={addSubsegmenValue}
                    onChange={(event) => setAddSubsegmenValue(event.target.value)}
                    placeholder="Contoh: A1"
                  />
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
                  <Input
                    value={addFase}
                    onChange={(event) => setAddFase(event.target.value)}
                    placeholder="Contoh: 3.1"
                  />
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
                  !addSegmenValue || !addSubsegmenValue || !addPeriode || !addFase || !!addDuplicateError
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
                <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">Segmen: {selectedDeleteRow.segment_id}</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">Subsegmen: {selectedDeleteRow.subsegment}</p>
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
