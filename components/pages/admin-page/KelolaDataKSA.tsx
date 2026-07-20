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
import { cn } from "@/lib/utils"

const KECAMATAN = [
  { id: "kec-1", kode_kecamatan: "K001", nama_kecamatan: "Cibeureum" },
  { id: "kec-2", kode_kecamatan: "K002", nama_kecamatan: "Mangkubumi" },
  { id: "kec-3", kode_kecamatan: "K003", nama_kecamatan: "Lengkongsari" },
  { id: "kec-4", kode_kecamatan: "K004", nama_kecamatan: "Cihideung" },
  { id: "kec-5", kode_kecamatan: "K005", nama_kecamatan: "Cipedes" },
  { id: "kec-6", kode_kecamatan: "K006", nama_kecamatan: "Cipari" },
  { id: "kec-7", kode_kecamatan: "K007", nama_kecamatan: "Campaka" },
  { id: "kec-8", kode_kecamatan: "K008", nama_kecamatan: "Cipatujah" },
  { id: "kec-9", kode_kecamatan: "K009", nama_kecamatan: "Tawang" },
  { id: "kec-10", kode_kecamatan: "K010", nama_kecamatan: "Purbaratu" },
]

const SEGMEN = [
  { id: "seg-1", id_segmen: "SGM001", kecamatan_id: "kec-1" },
  { id: "seg-2", id_segmen: "SGM002", kecamatan_id: "kec-1" },
  { id: "seg-3", id_segmen: "SGM003", kecamatan_id: "kec-2" },
  { id: "seg-4", id_segmen: "SGM004", kecamatan_id: "kec-2" },
  { id: "seg-5", id_segmen: "SGM005", kecamatan_id: "kec-3" },
  { id: "seg-6", id_segmen: "SGM006", kecamatan_id: "kec-3" },
  { id: "seg-7", id_segmen: "SGM007", kecamatan_id: "kec-4" },
  { id: "seg-8", id_segmen: "SGM008", kecamatan_id: "kec-4" },
  { id: "seg-9", id_segmen: "SGM009", kecamatan_id: "kec-5" },
  { id: "seg-10", id_segmen: "SGM010", kecamatan_id: "kec-5" },
  { id: "seg-11", id_segmen: "SGM011", kecamatan_id: "kec-6" },
  { id: "seg-12", id_segmen: "SGM012", kecamatan_id: "kec-7" },
  { id: "seg-13", id_segmen: "SGM013", kecamatan_id: "kec-8" },
  { id: "seg-14", id_segmen: "SGM014", kecamatan_id: "kec-9" },
  { id: "seg-15", id_segmen: "SGM015", kecamatan_id: "kec-10" },
]

const SUBSEGMEN = [
  { id: "sub-1", segmen_id: "seg-1", kode_subsegmen: "A1" },
  { id: "sub-2", segmen_id: "seg-1", kode_subsegmen: "A2" },
  { id: "sub-3", segmen_id: "seg-2", kode_subsegmen: "B1" },
  { id: "sub-4", segmen_id: "seg-2", kode_subsegmen: "B2" },
  { id: "sub-5", segmen_id: "seg-3", kode_subsegmen: "C1" },
  { id: "sub-6", segmen_id: "seg-3", kode_subsegmen: "C2" },
  { id: "sub-7", segmen_id: "seg-4", kode_subsegmen: "D1" },
  { id: "sub-8", segmen_id: "seg-4", kode_subsegmen: "D2" },
  { id: "sub-9", segmen_id: "seg-5", kode_subsegmen: "E1" },
  { id: "sub-10", segmen_id: "seg-5", kode_subsegmen: "E2" },
  { id: "sub-11", segmen_id: "seg-6", kode_subsegmen: "F1" },
  { id: "sub-12", segmen_id: "seg-6", kode_subsegmen: "F2" },
  { id: "sub-13", segmen_id: "seg-7", kode_subsegmen: "G1" },
  { id: "sub-14", segmen_id: "seg-7", kode_subsegmen: "G2" },
  { id: "sub-15", segmen_id: "seg-8", kode_subsegmen: "H1" },
  { id: "sub-16", segmen_id: "seg-8", kode_subsegmen: "H2" },
  { id: "sub-17", segmen_id: "seg-9", kode_subsegmen: "I1" },
  { id: "sub-18", segmen_id: "seg-9", kode_subsegmen: "I2" },
  { id: "sub-19", segmen_id: "seg-10", kode_subsegmen: "J1" },
  { id: "sub-20", segmen_id: "seg-10", kode_subsegmen: "J2" },
  { id: "sub-21", segmen_id: "seg-11", kode_subsegmen: "K1" },
  { id: "sub-22", segmen_id: "seg-12", kode_subsegmen: "L1" },
  { id: "sub-23", segmen_id: "seg-13", kode_subsegmen: "M1" },
  { id: "sub-24", segmen_id: "seg-14", kode_subsegmen: "N1" },
  { id: "sub-25", segmen_id: "seg-15", kode_subsegmen: "O1" },
  { id: "sub-26", segmen_id: "seg-11", kode_subsegmen: "K2" },
  { id: "sub-27", segmen_id: "seg-12", kode_subsegmen: "L2" },
  { id: "sub-28", segmen_id: "seg-13", kode_subsegmen: "M2" },
  { id: "sub-29", segmen_id: "seg-14", kode_subsegmen: "N2" },
  { id: "sub-30", segmen_id: "seg-15", kode_subsegmen: "O2" },
]

const VALID_PHASES = [
  "Persiapan Lahan",
  "Vegetatif 1",
  "Vegetatif 2",
  "Generatif 1",
  "Generatif 2",
  "Generatif 3",
  "Panen",
  "Bera",
]

const INITIAL_OBSERVASI = [
  { id: "obs-1", subsegmen_id: "sub-1", periode: "2024-01", fase_tanam: "Persiapan Lahan" },
  { id: "obs-2", subsegmen_id: "sub-2", periode: "2024-01", fase_tanam: "Vegetatif 1" },
  { id: "obs-3", subsegmen_id: "sub-3", periode: "2024-01", fase_tanam: "7.1" },
  { id: "obs-4", subsegmen_id: "sub-4", periode: "2024-02", fase_tanam: "Vegetatif 2" },
  { id: "obs-5", subsegmen_id: "sub-5", periode: "2024-02", fase_tanam: "Generatif 1" },
  { id: "obs-6", subsegmen_id: "sub-6", periode: "2024-03", fase_tanam: "4.5" },
  { id: "obs-7", subsegmen_id: "sub-7", periode: "2024-03", fase_tanam: "Generatif 2" },
  { id: "obs-8", subsegmen_id: "sub-8", periode: "2024-04", fase_tanam: "Generatif 3" },
  { id: "obs-9", subsegmen_id: "sub-9", periode: "2024-04", fase_tanam: "Panen" },
  { id: "obs-10", subsegmen_id: "sub-10", periode: "2024-05", fase_tanam: "Bera" },
  { id: "obs-11", subsegmen_id: "sub-11", periode: "2024-05", fase_tanam: "Persiapan Lahan" },
  { id: "obs-12", subsegmen_id: "sub-12", periode: "2024-06", fase_tanam: "Vegetatif 1" },
  { id: "obs-13", subsegmen_id: "sub-13", periode: "2024-06", fase_tanam: "7.3" },
  { id: "obs-14", subsegmen_id: "sub-14", periode: "2024-07", fase_tanam: "Vegetatif 2" },
  { id: "obs-15", subsegmen_id: "sub-15", periode: "2024-07", fase_tanam: "Generatif 1" },
  { id: "obs-16", subsegmen_id: "sub-16", periode: "2024-08", fase_tanam: "Generatif 2" },
  { id: "obs-17", subsegmen_id: "sub-17", periode: "2024-08", fase_tanam: "Generatif 3" },
  { id: "obs-18", subsegmen_id: "sub-18", periode: "2024-09", fase_tanam: "Panen" },
  { id: "obs-19", subsegmen_id: "sub-19", periode: "2024-09", fase_tanam: "Bera" },
  { id: "obs-20", subsegmen_id: "sub-20", periode: "2024-10", fase_tanam: "Persiapan Lahan" },
  { id: "obs-21", subsegmen_id: "sub-21", periode: "2024-10", fase_tanam: "Vegetatif 1" },
  { id: "obs-22", subsegmen_id: "sub-22", periode: "2024-11", fase_tanam: "Vegetatif 2" },
  { id: "obs-23", subsegmen_id: "sub-23", periode: "2024-11", fase_tanam: "Generatif 1" },
  { id: "obs-24", subsegmen_id: "sub-24", periode: "2024-12", fase_tanam: "Generatif 2" },
  { id: "obs-25", subsegmen_id: "sub-25", periode: "2024-12", fase_tanam: "Bera" },
  { id: "obs-26", subsegmen_id: "sub-26", periode: "2025-01", fase_tanam: "Persiapan Lahan" },
  { id: "obs-27", subsegmen_id: "sub-27", periode: "2025-01", fase_tanam: "Vegetatif 1" },
  { id: "obs-28", subsegmen_id: "sub-28", periode: "2025-02", fase_tanam: "7.1" },
  { id: "obs-29", subsegmen_id: "sub-29", periode: "2025-02", fase_tanam: "Generatif 3" },
  { id: "obs-30", subsegmen_id: "sub-30", periode: "2025-03", fase_tanam: "Panen" },
]

const PERIODE_OPTIONS = Array.from(
  new Set(INITIAL_OBSERVASI.map((item) => item.periode))
).sort()

interface ObservasiRow {
  id: string
  subsegmen_id: string
  periode: string
  fase_tanam: string
}

interface TableRowData {
  id: string
  id_segmen: string
  kode_subsegmen: string
  nama_kecamatan: string
  kode_kecamatan: string
  periode: string
  fase_tanam: string
  kecamatan_id: string
  segmen_id: string
}

function isValidPhase(fase: string) {
  return VALID_PHASES.includes(fase)
}

function getLabel(value: string) {
  return value
}

function buildTableRows(rows: ObservasiRow[]) {
  return rows.map((item) => {
    const sub = SUBSEGMEN.find((subsegmen) => subsegmen.id === item.subsegmen_id)
    const seg = SEGMEN.find((segmen) => segmen.id === sub?.segmen_id)
    const kec = KECAMATAN.find((kecamatan) => kecamatan.id === seg?.kecamatan_id)

    return {
      id: item.id,
      id_segmen: seg?.id_segmen ?? "-",
      kode_subsegmen: sub?.kode_subsegmen ?? "-",
      nama_kecamatan: kec?.nama_kecamatan ?? "-",
      kode_kecamatan: kec?.kode_kecamatan ?? "-",
      periode: item.periode,
      fase_tanam: item.fase_tanam,
      kecamatan_id: seg?.kecamatan_id ?? "",
      segmen_id: seg?.id ?? "",
    }
  })
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
      {children}
    </span>
  )
}

export default function KelolaDataKSA() {
  const [observations, setObservations] = React.useState<ObservasiRow[]>(INITIAL_OBSERVASI)
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
  const [editFase, setEditFase] = React.useState(VALID_PHASES[0])

  const [addKecamatan, setAddKecamatan] = React.useState("")
  const [addSegmen, setAddSegmen] = React.useState("")
  const [addSubsegmen, setAddSubsegmen] = React.useState("")
  const [addPeriode, setAddPeriode] = React.useState("")
  const [addFase, setAddFase] = React.useState(VALID_PHASES[0])
  const [addError, setAddError] = React.useState("")

  const [notification, setNotification] = React.useState<string>("")

  const tableRows = React.useMemo(() => buildTableRows(observations), [observations])

  const segmenOptions = React.useMemo(
    () =>
      filterKecamatan
        ? SEGMEN.filter((seg) => seg.kecamatan_id === filterKecamatan)
        : SEGMEN,
    [filterKecamatan]
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
    setEditFase(current.fase_tanam)
    setIsEditOpen(true)
  }

  const openDelete = (rowId: string) => {
    setViewingRowId(rowId)
    setIsDeleteOpen(true)
  }

  const selectedEditRow = viewingRowId
    ? tableRows.find((row) => row.id === viewingRowId)
    : null

  const handleSaveEdit = () => {
    if (!selectedEditRow) return
    setObservations((prev) =>
      prev.map((item) =>
        item.id === selectedEditRow.id
          ? { ...item, periode: editPeriode, fase_tanam: editFase }
          : item
      )
    )
    setIsEditOpen(false)
    setNotification("Perubahan berhasil disimpan")
  }

  const handleDelete = () => {
    if (!viewingRowId) return
    setObservations((prev) => prev.filter((item) => item.id !== viewingRowId))
    setIsDeleteOpen(false)
    setNotification("Data berhasil dihapus")
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
        ? SEGMEN.filter((seg) => seg.kecamatan_id === addKecamatan)
        : [],
    [addKecamatan]
  )

  const availableAddSubsegmen = React.useMemo(
    () =>
      addSegmen
        ? SUBSEGMEN.filter((sub) => sub.segmen_id === addSegmen)
        : [],
    [addSegmen]
  )

  const handleOpenAdd = () => {
    setAddKecamatan("")
    setAddSegmen("")
    setAddSubsegmen("")
    setAddPeriode("")
    setAddFase(VALID_PHASES[0])
    setAddError("")
    setIsAddOpen(true)
  }

  const addDuplicateError = React.useMemo(() => {
    if (!addSubsegmen || !addPeriode) return ""
    const exists = observations.some(
      (item) => item.subsegmen_id === addSubsegmen && item.periode === addPeriode
    )
    return exists ? "Data untuk subsegmen dan periode ini sudah ada" : ""
  }, [addSubsegmen, addPeriode, observations])

  const handleSaveAdd = () => {
    if (!addKecamatan || !addSegmen || !addSubsegmen || !addPeriode || !addFase) return
    if (addDuplicateError) {
      setAddError(addDuplicateError)
      return
    }

    const nextId = `obs-${Date.now()}`
    setObservations((prev) => [
      ...prev,
      { id: nextId, subsegmen_id: addSubsegmen, periode: addPeriode, fase_tanam: addFase },
    ])
    setIsAddOpen(false)
    setNotification("Data baru berhasil ditambahkan")
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
                    {KECAMATAN.map((item) => (
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
                    {PERIODE_OPTIONS.map((periode) => (
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
          <CardTitle className="mb-0">Daftar Observasi KSA</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {filteredRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-8 py-14 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              <AlertTriangle className="mx-auto mb-3 size-10" />
              <p className="text-lg font-semibold">Tidak ada data ditemukan</p>
              <p className="mt-2 text-sm">Ubah filter atau reset untuk melihat semua data.</p>
            </div>
          ) : (
            <>
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Segmen</TableHead>
                    <TableHead>Subsegmen</TableHead>
                    <TableHead>Kecamatan</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Fase Tanam</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id_segmen}</TableCell>
                      <TableCell>{row.kode_subsegmen}</TableCell>
                      <TableCell>{row.nama_kecamatan}</TableCell>
                      <TableCell>{row.periode}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{row.fase_tanam}</span>
                          {!isValidPhase(row.fase_tanam) ? <Badge>tidak valid</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
                      <SelectValue placeholder="Pilih fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_PHASES.map((fase) => (
                        <SelectItem key={fase} value={fase}>
                          {fase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                      {KECAMATAN.map((item) => (
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
                      <SelectValue placeholder="Pilih fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_PHASES.map((fase) => (
                        <SelectItem key={fase} value={fase}>
                          {fase}
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
