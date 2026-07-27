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
import { supabase } from "@/lib/supabase/client"
import { logActivity } from "@/lib/supabase/activity-log"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

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
  const { id: actorId, name, email } = useAdminAuth()
  const actorName = name || email || "Admin"

  const [activeTab, setActiveTab] = React.useState<TabKey>("Kecamatan")

  const [kecamatanData, setKecamatanData] = React.useState<Kecamatan[]>([])
  const [segmenData, setSegmenData] = React.useState<Segmen[]>([])
  const [subsegmenData, setSubsegmenData] = React.useState<Subsegmen[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState("")

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

  const fetchAllData = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError("")

    const [{ data: kec, error: kecError }, { data: seg, error: segError }, { data: sub, error: subError }] =
      await Promise.all([
        supabase.from("kecamatan").select("id, kode_kecamatan, nama_kecamatan").order("kode_kecamatan"),
        supabase.from("segmen").select("id, id_segmen, kecamatan_id").order("id_segmen"),
        supabase.from("subsegmen").select("id, segmen_id, kode_subsegmen").order("kode_subsegmen"),
      ])

    if (kecError || segError || subError) {
      setLoadError(
        kecError?.message || segError?.message || subError?.message || "Gagal memuat data referensi wilayah."
      )
      setIsLoading(false)
      return
    }

    setKecamatanData(kec ?? [])
    setSegmenData(seg ?? [])
    setSubsegmenData(sub ?? [])
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  React.useEffect(() => {
    const channel = supabase
      .channel("referensi-wilayah-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "kecamatan" }, () => fetchAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "segmen" }, () => fetchAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "subsegmen" }, () => fetchAllData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAllData])

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

  const handleSaveKecamatan = async () => {
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

    setKecamatanError("")

    if (editingKecamatanId) {
      const { error } = await supabase
        .from("kecamatan")
        .update({ kode_kecamatan: kecamatanKode.trim(), nama_kecamatan: kecamatanNama.trim() })
        .eq("id", editingKecamatanId)

      if (error) {
        setKecamatanError(error.message || "Gagal menyimpan perubahan.")
        return
      }

      await logActivity({
        actorId,
        actorName,
        actionType: "update_data",
        description: `Memperbarui kecamatan ${kecamatanKode.trim()} - ${kecamatanNama.trim()}`,
        module: "referensi_wilayah",
      })
    } else {
      const { error } = await supabase.from("kecamatan").insert({
        kode_kecamatan: kecamatanKode.trim(),
        nama_kecamatan: kecamatanNama.trim(),
      })

      if (error) {
        setKecamatanError(error.message || "Gagal menambahkan kecamatan.")
        return
      }

      await logActivity({
        actorId,
        actorName,
        actionType: "add_reference",
        description: `Menambahkan kecamatan baru ${kecamatanKode.trim()} - ${kecamatanNama.trim()}`,
        module: "referensi_wilayah",
      })
    }

    setKecamatanModalOpen(false)
    fetchAllData()
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

  const handleSaveSegmen = async () => {
    if (!segmenKecamatanId || !segmenIdSegmen.trim()) {
      setSegmenError("Pilih kecamatan dan masukkan id segmen.")
      return
    }

    const kecamatanCode = getKecamatanCode(segmenKecamatanId, kecamatanData)
    if (!kecamatanCode || segmenIdSegmen.trim().slice(0, kecamatanCode.length) !== kecamatanCode) {
      setSegmenError("Awalan id segmen harus sama dengan kode kecamatan yang dipilih.")
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

    setSegmenError("")

    if (editingSegmenId) {
      const { error } = await supabase
        .from("segmen")
        .update({ id_segmen: segmenIdSegmen.trim(), kecamatan_id: segmenKecamatanId })
        .eq("id", editingSegmenId)

      if (error) {
        setSegmenError(error.message || "Gagal menyimpan perubahan.")
        return
      }

      await logActivity({
        actorId,
        actorName,
        actionType: "update_data",
        description: `Memperbarui segmen ${segmenIdSegmen.trim()}`,
        module: "referensi_wilayah",
      })
    } else {
      const { error } = await supabase.from("segmen").insert({
        id_segmen: segmenIdSegmen.trim(),
        kecamatan_id: segmenKecamatanId,
      })

      if (error) {
        setSegmenError(error.message || "Gagal menambahkan segmen.")
        return
      }

      await logActivity({
        actorId,
        actorName,
        actionType: "add_reference",
        description: `Menambahkan segmen baru ${segmenIdSegmen.trim()}`,
        module: "referensi_wilayah",
      })
    }

    setSegmenModalOpen(false)
    fetchAllData()
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

  const handleSaveSubsegmen = async () => {
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

    setSubsegmenError("")

    if (editingSubsegmenId) {
      const { error } = await supabase
        .from("subsegmen")
        .update({ segmen_id: subsegmenSegmenId, kode_subsegmen: subsegmenKode.trim() })
        .eq("id", editingSubsegmenId)

      if (error) {
        setSubsegmenError(error.message || "Gagal menyimpan perubahan.")
        return
      }

      await logActivity({
        actorId,
        actorName,
        actionType: "update_data",
        description: `Memperbarui subsegmen ${subsegmenKode.trim()}`,
        module: "referensi_wilayah",
      })
    } else {
      const { error } = await supabase.from("subsegmen").insert({
        segmen_id: subsegmenSegmenId,
        kode_subsegmen: subsegmenKode.trim(),
      })

      if (error) {
        setSubsegmenError(error.message || "Gagal menambahkan subsegmen.")
        return
      }

      await logActivity({
        actorId,
        actorName,
        actionType: "add_reference",
        description: `Menambahkan subsegmen baru ${subsegmenKode.trim()}`,
        module: "referensi_wilayah",
      })
    }

    setSubsegmenModalOpen(false)
    fetchAllData()
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    if (deleteTarget.type === "kecamatan") {
      const target = kecamatanData.find((item) => item.id === deleteTarget.id)
      const { error } = await supabase.from("kecamatan").delete().eq("id", deleteTarget.id)
      if (error) {
        setDeleteWarningText(error.message || "Gagal menghapus kecamatan.")
        return
      }
      await logActivity({
        actorId,
        actorName,
        actionType: "delete_data",
        description: `Menghapus kecamatan ${target?.kode_kecamatan ?? ""} - ${target?.nama_kecamatan ?? ""}`,
        module: "referensi_wilayah",
      })
    }

    if (deleteTarget.type === "segmen") {
      const target = segmenData.find((item) => item.id === deleteTarget.id)
      const { error } = await supabase.from("segmen").delete().eq("id", deleteTarget.id)
      if (error) {
        setDeleteWarningText(error.message || "Gagal menghapus segmen.")
        return
      }
      await logActivity({
        actorId,
        actorName,
        actionType: "delete_data",
        description: `Menghapus segmen ${target?.id_segmen ?? ""}`,
        module: "referensi_wilayah",
      })
    }

    if (deleteTarget.type === "subsegmen") {
      const target = subsegmenData.find((item) => item.id === deleteTarget.id)
      const { error } = await supabase.from("subsegmen").delete().eq("id", deleteTarget.id)
      if (error) {
        setDeleteWarningText(error.message || "Gagal menghapus subsegmen.")
        return
      }
      await logActivity({
        actorId,
        actorName,
        actionType: "delete_data",
        description: `Menghapus subsegmen ${target?.kode_subsegmen ?? ""}`,
        module: "referensi_wilayah",
      })
    }

    setDeleteModalOpen(false)
    fetchAllData()
  }

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-200">
          {loadError}
        </p>
      ) : null}

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