"use client"

import * as React from "react"
import { AlertTriangle, Edit3, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TABS = ["Kecamatan", "Segmen", "Subsegmen"] as const

type TabKey = (typeof TABS)[number]

type Kecamatan = {
  id: string
  kode_kecamatan: string
  nama_kecamatan: string
}

type Segmen = {
  id: string
  id_segmen: string
  kecamatan_id: string
}

type Subsegmen = {
  id: string
  segmen_id: string
  kode_subsegmen: string
}

const INITIAL_KECAMATAN: Kecamatan[] = [
  { id: "kec-1", kode_kecamatan: "K001", nama_kecamatan: "Cibeureum" },
  { id: "kec-2", kode_kecamatan: "K002", nama_kecamatan: "Mangkubumi" },
  { id: "kec-3", kode_kecamatan: "K003", nama_kecamatan: "Lengkongsari" },
  { id: "kec-4", kode_kecamatan: "K004", nama_kecamatan: "Cihideung" },
  { id: "kec-5", kode_kecamatan: "K005", nama_kecamatan: "Cipedes" },
  { id: "kec-6", kode_kecamatan: "K006", nama_kecamatan: "Purbaratu" },
  { id: "kec-7", kode_kecamatan: "K007", nama_kecamatan: "Indihiang" },
  { id: "kec-8", kode_kecamatan: "K008", nama_kecamatan: "Tawang" },
  { id: "kec-9", kode_kecamatan: "K009", nama_kecamatan: "Cipatujah" },
  { id: "kec-10", kode_kecamatan: "K010", nama_kecamatan: "Cipari" },
]

const INITIAL_SEGMEN: Segmen[] = [
  { id: "seg-1", id_segmen: "K001001", kecamatan_id: "kec-1" },
  { id: "seg-2", id_segmen: "K001002", kecamatan_id: "kec-1" },
  { id: "seg-3", id_segmen: "K002001", kecamatan_id: "kec-2" },
  { id: "seg-4", id_segmen: "K002002", kecamatan_id: "kec-2" },
  { id: "seg-5", id_segmen: "K003001", kecamatan_id: "kec-3" },
  { id: "seg-6", id_segmen: "K003002", kecamatan_id: "kec-3" },
  { id: "seg-7", id_segmen: "K004001", kecamatan_id: "kec-4" },
  { id: "seg-8", id_segmen: "K004002", kecamatan_id: "kec-4" },
  { id: "seg-9", id_segmen: "K005001", kecamatan_id: "kec-5" },
  { id: "seg-10", id_segmen: "K005002", kecamatan_id: "kec-5" },
  { id: "seg-11", id_segmen: "K006001", kecamatan_id: "kec-6" },
  { id: "seg-12", id_segmen: "K006002", kecamatan_id: "kec-6" },
  { id: "seg-13", id_segmen: "K007001", kecamatan_id: "kec-7" },
  { id: "seg-14", id_segmen: "K007002", kecamatan_id: "kec-7" },
  { id: "seg-15", id_segmen: "K008001", kecamatan_id: "kec-8" },
  { id: "seg-16", id_segmen: "K008002", kecamatan_id: "kec-8" },
  { id: "seg-17", id_segmen: "K009001", kecamatan_id: "kec-9" },
  { id: "seg-18", id_segmen: "K009002", kecamatan_id: "kec-9" },
  { id: "seg-19", id_segmen: "K010001", kecamatan_id: "kec-10" },
  { id: "seg-20", id_segmen: "K010002", kecamatan_id: "kec-10" },
]

const INITIAL_SUBSEGMEN: Subsegmen[] = [
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
  { id: "sub-22", segmen_id: "seg-11", kode_subsegmen: "K2" },
  { id: "sub-23", segmen_id: "seg-12", kode_subsegmen: "L1" },
  { id: "sub-24", segmen_id: "seg-12", kode_subsegmen: "L2" },
  { id: "sub-25", segmen_id: "seg-13", kode_subsegmen: "M1" },
  { id: "sub-26", segmen_id: "seg-13", kode_subsegmen: "M2" },
  { id: "sub-27", segmen_id: "seg-14", kode_subsegmen: "N1" },
  { id: "sub-28", segmen_id: "seg-14", kode_subsegmen: "N2" },
  { id: "sub-29", segmen_id: "seg-15", kode_subsegmen: "O1" },
  { id: "sub-30", segmen_id: "seg-15", kode_subsegmen: "O2" },
]

function getKecamatanName(kecamatanId: string, kecamatan: Kecamatan[]) {
  return kecamatan.find((item) => item.id === kecamatanId)?.nama_kecamatan ?? "-"
}

function getKecamatanCode(kecamatanId: string, kecamatan: Kecamatan[]) {
  return kecamatan.find((item) => item.id === kecamatanId)?.kode_kecamatan ?? ""
}

function getSegmenById(segmenId: string, segmen: Segmen[]) {
  return segmen.find((item) => item.id === segmenId)
}

export default function ReferensiWilayah() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("Kecamatan")

  const [kecamatanData, setKecamatanData] = React.useState<Kecamatan[]>(INITIAL_KECAMATAN)
  const [segmenData, setSegmenData] = React.useState<Segmen[]>(INITIAL_SEGMEN)
  const [subsegmenData, setSubsegmenData] = React.useState<Subsegmen[]>(INITIAL_SUBSEGMEN)

  const [kecamatanModalOpen, setKecamatanModalOpen] = React.useState(false)
  const [editingKecamatanId, setEditingKecamatanId] = React.useState<string | null>(null)
  const [kecamatanKode, setKecamatanKode] = React.useState("")
  const [kecamatanNama, setKecamatanNama] = React.useState("")
  const [kecamatanError, setKecamatanError] = React.useState("")

  const [segmenModalOpen, setSegmenModalOpen] = React.useState(false)
  const [editingSegmenId, setEditingSegmenId] = React.useState<string | null>(null)
  const [segmenKecamatanId, setSegmenKecamatanId] = React.useState("")
  const [segmenIdSegmen, setSegmenIdSegmen] = React.useState("")
  const [segmenError, setSegmenError] = React.useState("")
  const [segmenFilterKecamatan, setSegmenFilterKecamatan] = React.useState("")

  const [subsegmenModalOpen, setSubsegmenModalOpen] = React.useState(false)
  const [editingSubsegmenId, setEditingSubsegmenId] = React.useState<string | null>(null)
  const [subsegmenKecamatanId, setSubsegmenKecamatanId] = React.useState("")
  const [subsegmenSegmenId, setSubsegmenSegmenId] = React.useState("")
  const [subsegmenKode, setSubsegmenKode] = React.useState("")
  const [subsegmenError, setSubsegmenError] = React.useState("")
  const [subsegmenFilterKecamatan, setSubsegmenFilterKecamatan] = React.useState("")
  const [subsegmenFilterSegmen, setSubsegmenFilterSegmen] = React.useState("")

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<
    | { type: "kecamatan"; id: string }
    | { type: "segmen"; id: string }
    | { type: "subsegmen"; id: string }
    | null
  >(null)
  const [deleteWarningText, setDeleteWarningText] = React.useState("")

  const filteredSegmen = React.useMemo(() => {
    if (!segmenFilterKecamatan) {
      return segmenData
    }
    return segmenData.filter((item) => item.kecamatan_id === segmenFilterKecamatan)
  }, [segmenData, segmenFilterKecamatan])

  const filteredSubsegmen = React.useMemo(() => {
    return subsegmenData.filter((item) => {
      const segmen = getSegmenById(item.segmen_id, segmenData)
      if (!segmen) return false
      const matchesKecamatan = subsegmenFilterKecamatan
        ? segmen.kecamatan_id === subsegmenFilterKecamatan
        : true
      const matchesSegmen = subsegmenFilterSegmen
        ? item.segmen_id === subsegmenFilterSegmen
        : true
      return matchesKecamatan && matchesSegmen
    })
  }, [subsegmenData, segmenData, subsegmenFilterKecamatan, subsegmenFilterSegmen])

  const availableSubsegmenSegmenOptions = React.useMemo(() => {
    return segmenData.filter((item) =>
      subsegmenKecamatanId ? item.kecamatan_id === subsegmenKecamatanId : true
    )
  }, [segmenData, subsegmenKecamatanId])

  const openAddKecamatan = () => {
    setEditingKecamatanId(null)
    setKecamatanKode("")
    setKecamatanNama("")
    setKecamatanError("")
    setKecamatanModalOpen(true)
  }

  const openEditKecamatan = (id: string) => {
    const target = kecamatanData.find((item) => item.id === id)
    if (!target) return
    setEditingKecamatanId(id)
    setKecamatanKode(target.kode_kecamatan)
    setKecamatanNama(target.nama_kecamatan)
    setKecamatanError("")
    setKecamatanModalOpen(true)
  }

  const handleSaveKecamatan = () => {
    if (!kecamatanKode.trim() || !kecamatanNama.trim()) {
      setKecamatanError("Kode dan nama kecamatan harus diisi.")
      return
    }

    const kodeBerulang = kecamatanData.some(
      (item) =>
        item.kode_kecamatan === kecamatanKode.trim() &&
        item.id !== editingKecamatanId,
    )
    if (kodeBerulang) {
      setKecamatanError("Kode kecamatan sudah digunakan.")
      return
    }

    if (editingKecamatanId) {
      setKecamatanData((prev) =>
        prev.map((item) =>
          item.id === editingKecamatanId
            ? { ...item, kode_kecamatan: kecamatanKode.trim(), nama_kecamatan: kecamatanNama.trim() }
            : item,
        ),
      )
    } else {
      setKecamatanData((prev) => [
        ...prev,
        {
          id: `kec-${Date.now()}`,
          kode_kecamatan: kecamatanKode.trim(),
          nama_kecamatan: kecamatanNama.trim(),
        },
      ])
    }

    setKecamatanModalOpen(false)
  }

  const openAddSegmen = () => {
    setEditingSegmenId(null)
    setSegmenKecamatanId("")
    setSegmenIdSegmen("")
    setSegmenError("")
    setSegmenModalOpen(true)
  }

  const openEditSegmen = (id: string) => {
    const target = segmenData.find((item) => item.id === id)
    if (!target) return
    setEditingSegmenId(id)
    setSegmenKecamatanId(target.kecamatan_id)
    setSegmenIdSegmen(target.id_segmen)
    setSegmenError("")
    setSegmenModalOpen(true)
  }

  const handleSaveSegmen = () => {
    if (!segmenKecamatanId || !segmenIdSegmen.trim()) {
      setSegmenError("Pilih kecamatan dan masukkan id segmen.")
      return
    }

    const kecamatanCode = getKecamatanCode(segmenKecamatanId, kecamatanData)
    if (!kecamatanCode || segmenIdSegmen.trim().slice(0, 7) !== kecamatanCode) {
      setSegmenError("7 digit pertama id segmen harus sama dengan kode kecamatan yang dipilih.")
      return
    }

    const segmenBerulang = segmenData.some(
      (item) =>
        item.id_segmen === segmenIdSegmen.trim() &&
        item.id !== editingSegmenId,
    )
    if (segmenBerulang) {
      setSegmenError("ID segmen sudah digunakan.")
      return
    }

    if (editingSegmenId) {
      setSegmenData((prev) =>
        prev.map((item) =>
          item.id === editingSegmenId
            ? { ...item, id_segmen: segmenIdSegmen.trim(), kecamatan_id: segmenKecamatanId }
            : item,
        ),
      )
    } else {
      setSegmenData((prev) => [
        ...prev,
        {
          id: `seg-${Date.now()}`,
          id_segmen: segmenIdSegmen.trim(),
          kecamatan_id: segmenKecamatanId,
        },
      ])
    }

    setSegmenModalOpen(false)
  }

  const openAddSubsegmen = () => {
    setEditingSubsegmenId(null)
    setSubsegmenKecamatanId("")
    setSubsegmenSegmenId("")
    setSubsegmenKode("")
    setSubsegmenError("")
    setSubsegmenModalOpen(true)
  }

  const openEditSubsegmen = (id: string) => {
    const target = subsegmenData.find((item) => item.id === id)
    if (!target) return
    const parentSegmen = getSegmenById(target.segmen_id, segmenData)
    setEditingSubsegmenId(id)
    setSubsegmenKecamatanId(parentSegmen?.kecamatan_id ?? "")
    setSubsegmenSegmenId(target.segmen_id)
    setSubsegmenKode(target.kode_subsegmen)
    setSubsegmenError("")
    setSubsegmenModalOpen(true)
  }

  const handleSaveSubsegmen = () => {
    if (!subsegmenKecamatanId || !subsegmenSegmenId || !subsegmenKode.trim()) {
      setSubsegmenError("Lengkapi kecamatan, segmen, dan kode subsegmen.")
      return
    }

    const segmen = getSegmenById(subsegmenSegmenId, segmenData)
    if (!segmen || segmen.kecamatan_id !== subsegmenKecamatanId) {
      setSubsegmenError("Segmen yang dipilih harus sesuai dengan kecamatan.")
      return
    }

    const duplicateSub = subsegmenData.some(
      (item) =>
        item.kode_subsegmen === subsegmenKode.trim() &&
        item.segmen_id === subsegmenSegmenId &&
        item.id !== editingSubsegmenId,
    )
    if (duplicateSub) {
      setSubsegmenError("Kode subsegmen sudah ada untuk segmen ini.")
      return
    }

    if (editingSubsegmenId) {
      setSubsegmenData((prev) =>
        prev.map((item) =>
          item.id === editingSubsegmenId
            ? {
                ...item,
                segmen_id: subsegmenSegmenId,
                kode_subsegmen: subsegmenKode.trim(),
              }
            : item,
        ),
      )
    } else {
      setSubsegmenData((prev) => [
        ...prev,
        {
          id: `sub-${Date.now()}`,
          segmen_id: subsegmenSegmenId,
          kode_subsegmen: subsegmenKode.trim(),
        },
      ])
    }

    setSubsegmenModalOpen(false)
  }

  const openDeleteModal = (
    type: "kecamatan" | "segmen" | "subsegmen",
    id: string,
  ) => {
    const childCount =
      type === "kecamatan"
        ? segmenData.filter((item) => item.kecamatan_id === id).length
        : type === "segmen"
        ? subsegmenData.filter((item) => item.segmen_id === id).length
        : 0

    setDeleteTarget({ type, id })
    setDeleteWarningText(
      childCount > 0
        ? `Item ini memiliki ${childCount} data turunan, menghapus akan memengaruhi data terkait.`
        : "Yakin ingin menghapus item ini?",
    )
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === "kecamatan") {
      const segmenToRemove = segmenData.filter((item) => item.kecamatan_id === deleteTarget.id)
      const segmenIds = segmenToRemove.map((item) => item.id)
      setKecamatanData((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setSegmenData((prev) => prev.filter((item) => item.kecamatan_id !== deleteTarget.id))
      setSubsegmenData((prev) => prev.filter((item) => !segmenIds.includes(item.segmen_id)))
    }

    if (deleteTarget.type === "segmen") {
      setSegmenData((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setSubsegmenData((prev) => prev.filter((item) => item.segmen_id !== deleteTarget.id))
    }

    if (deleteTarget.type === "subsegmen") {
      setSubsegmenData((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    }

    setDeleteModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const active = tab === activeTab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[#639922] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === "Kecamatan" ? (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Kecamatan
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Tambahkan atau kelola kecamatan sampel.
              </CardDescription>
            </div>
            <Button
              className="bg-[#639922] hover:bg-[#58751d]"
              onClick={openAddKecamatan}
            >
              <Plus className="size-4" /> Tambah Kecamatan
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Kecamatan</TableHead>
                  <TableHead>Nama Kecamatan</TableHead>
                  <TableHead>Jumlah Segmen</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kecamatanData.map((item) => {
                  const segmenCount = segmenData.filter((seg) => seg.kecamatan_id === item.id).length
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.kode_kecamatan}</TableCell>
                      <TableCell>{item.nama_kecamatan}</TableCell>
                      <TableCell>{segmenCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditKecamatan(item.id)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteModal("kecamatan", item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "Segmen" ? (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Segmen
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Kelola segmen berdasarkan kecamatan.
              </CardDescription>
            </div>
            <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={openAddSegmen}>
              <Plus className="size-4" /> Tambah Segmen
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
              <div>
                <Label htmlFor="filter-kecamatan-segmen">Filter Kecamatan</Label>
                <Select
                  value={segmenFilterKecamatan}
                  onValueChange={(value) => setSegmenFilterKecamatan(value)}
                >
                  <SelectTrigger id="filter-kecamatan-segmen" className="w-full">
                    <SelectValue placeholder="Semua Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kecamatan</SelectItem>
                    {kecamatanData.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.kode_kecamatan} - {item.nama_kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto px-0">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Segmen</TableHead>
                    <TableHead>Kecamatan</TableHead>
                    <TableHead>Jumlah Subsegmen</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSegmen.map((item) => {
                    const subCount = subsegmenData.filter((sub) => sub.segmen_id === item.id).length
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.id_segmen}</TableCell>
                        <TableCell>{getKecamatanName(item.kecamatan_id, kecamatanData)}</TableCell>
                        <TableCell>{subCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditSegmen(item.id)}
                            >
                              <Edit3 className="size-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteModal("segmen", item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "Subsegmen" ? (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Subsegmen
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Kelola subsegmen dengan filter cascading kecamatan dan segmen.
              </CardDescription>
            </div>
            <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={openAddSubsegmen}>
              <Plus className="size-4" /> Tambah Subsegmen
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <Label htmlFor="filter-kecamatan-subsegmen">Filter Kecamatan</Label>
                <Select
                  value={subsegmenFilterKecamatan}
                  onValueChange={(value) => {
                    setSubsegmenFilterKecamatan(value)
                    setSubsegmenFilterSegmen("")
                  }}
                >
                  <SelectTrigger id="filter-kecamatan-subsegmen" className="w-full">
                    <SelectValue placeholder="Semua Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kecamatan</SelectItem>
                    {kecamatanData.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.kode_kecamatan} - {item.nama_kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-segmen-subsegmen">Filter Segmen</Label>
                <Select
                  value={subsegmenFilterSegmen}
                  onValueChange={(value) => setSubsegmenFilterSegmen(value)}
                >
                  <SelectTrigger id="filter-segmen-subsegmen" className="w-full">
                    <SelectValue placeholder="Semua Segmen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Segmen</SelectItem>
                    {availableSubsegmenSegmenOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.id_segmen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto px-0">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Subsegmen</TableHead>
                    <TableHead>Segmen</TableHead>
                    <TableHead>Kecamatan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubsegmen.map((item) => {
                    const segmen = getSegmenById(item.segmen_id, segmenData)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.kode_subsegmen}</TableCell>
                        <TableCell>{segmen?.id_segmen ?? "-"}</TableCell>
                        <TableCell>{getKecamatanName(segmen?.kecamatan_id ?? "", kecamatanData)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditSubsegmen(item.id)}
                            >
                              <Edit3 className="size-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteModal("subsegmen", item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {kecamatanModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingKecamatanId ? "Edit Kecamatan" : "Tambah Kecamatan"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Kelola kode dan nama kecamatan.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setKecamatanModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="kecamatan-kode">Kode Kecamatan</Label>
                <Input
                  id="kecamatan-kode"
                  value={kecamatanKode}
                  onChange={(event) => setKecamatanKode(event.target.value)}
                  placeholder="Contoh: K011"
                />
              </div>
              <div>
                <Label htmlFor="kecamatan-nama">Nama Kecamatan</Label>
                <Input
                  id="kecamatan-nama"
                  value={kecamatanNama}
                  onChange={(event) => setKecamatanNama(event.target.value)}
                  placeholder="Contoh: Payung"
                />
              </div>
              {kecamatanError ? (
                <p className="text-sm text-rose-600">{kecamatanError}</p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setKecamatanModalOpen(false)}>
                Batal
              </Button>
              <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={handleSaveKecamatan}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {segmenModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingSegmenId ? "Edit Segmen" : "Tambah Segmen"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hubungkan segmen dengan kecamatan dan pastikan id segmen benar.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSegmenModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="segmen-kecamatan">Kecamatan</Label>
                <Select
                  value={segmenKecamatanId}
                  onValueChange={(value) => setSegmenKecamatanId(value)}
                >
                  <SelectTrigger id="segmen-kecamatan" className="w-full">
                    <SelectValue placeholder="Pilih Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {kecamatanData.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.kode_kecamatan} - {item.nama_kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="segmen-id">ID Segmen</Label>
                <Input
                  id="segmen-id"
                  value={segmenIdSegmen}
                  onChange={(event) => setSegmenIdSegmen(event.target.value)}
                  placeholder="Contoh: K001001"
                />
              </div>
              {segmenError ? <p className="text-sm text-rose-600">{segmenError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSegmenModalOpen(false)}>
                Batal
              </Button>
              <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={handleSaveSegmen}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {subsegmenModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingSubsegmenId ? "Edit Subsegmen" : "Tambah Subsegmen"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pilih kecamatan, segmen, dan isi kode subsegmen.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSubsegmenModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="subsegmen-kecamatan">Kecamatan</Label>
                <Select
                  value={subsegmenKecamatanId}
                  onValueChange={(value) => {
                    setSubsegmenKecamatanId(value)
                    setSubsegmenSegmenId("")
                  }}
                >
                  <SelectTrigger id="subsegmen-kecamatan" className="w-full">
                    <SelectValue placeholder="Pilih Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {kecamatanData.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.kode_kecamatan} - {item.nama_kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subsegmen-segmen">Segmen</Label>
                <Select
                  value={subsegmenSegmenId}
                  onValueChange={(value) => setSubsegmenSegmenId(value)}
                >
                  <SelectTrigger id="subsegmen-segmen" className="w-full">
                    <SelectValue placeholder="Pilih Segmen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubsegmenSegmenOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.id_segmen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subsegmen-kode">Kode Subsegmen</Label>
                <Input
                  id="subsegmen-kode"
                  value={subsegmenKode}
                  onChange={(event) => setSubsegmenKode(event.target.value)}
                  placeholder="Contoh: A1"
                />
              </div>
              {subsegmenError ? <p className="text-sm text-rose-600">{subsegmenError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSubsegmenModalOpen(false)}>
                Batal
              </Button>
              <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={handleSaveSubsegmen}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalOpen && deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Konfirmasi Hapus
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hapus data secara permanen dari daftar.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="size-5" />
                <p>{deleteWarningText}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
