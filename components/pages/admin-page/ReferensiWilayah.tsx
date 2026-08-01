"use client"

import * as React from "react"
import { Edit3, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { TableLoading } from "@/components/ui/table-loading"
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

type Kecamatan = {
  id: string
  district_code: string
  name: string
}

export default function ReferensiWilayah() {
  const { id: actorId, name, email } = useAdminAuth()
  const actorName = name || email || "Admin"

  const [kecamatanData, setKecamatanData] = React.useState<Kecamatan[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState("")

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [kecamatanKode, setKecamatanKode] = React.useState("")
  const [kecamatanNama, setKecamatanNama] = React.useState("")
  const [formError, setFormError] = React.useState("")

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError("")

    const { data, error } = await supabase
      .from("districts")
      .select("id, district_code, name")
      .order("district_code")

    if (error) {
      setLoadError(error.message || "Gagal memuat data kecamatan.")
      setIsLoading(false)
      return
    }

    setKecamatanData(data ?? [])
    setIsLoading(false)
  }, [setIsLoading])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    const channel = supabase
      .channel("referensi-wilayah-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "districts" }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const openAdd = () => {
    setEditingId(null)
    setKecamatanKode("")
    setKecamatanNama("")
    setFormError("")
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const target = kecamatanData.find((item) => item.id === id)
    if (!target) return
    setEditingId(id)
    setKecamatanKode(target.district_code)
    setKecamatanNama(target.name)
    setFormError("")
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!kecamatanKode.trim() || !kecamatanNama.trim()) {
      setFormError("Kode dan nama kecamatan harus diisi.")
      return
    }

    const kodeBerulang = kecamatanData.some(
      (item) =>
        item.district_code === kecamatanKode.trim() &&
        item.id !== editingId,
    )
    if (kodeBerulang) {
      setFormError("Kode kecamatan sudah digunakan.")
      return
    }

    setFormError("")

    if (editingId) {
      const { error } = await supabase
        .from("districts")
        .update({ district_code: kecamatanKode.trim(), name: kecamatanNama.trim() })
        .eq("id", editingId)

      if (error) {
        setFormError(error.message || "Gagal menyimpan perubahan.")
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
      const { error } = await supabase.from("districts").insert({
        district_code: kecamatanKode.trim(),
        name: kecamatanNama.trim(),
      })

      if (error) {
        setFormError(error.message || "Gagal menambahkan kecamatan.")
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

    setModalOpen(false)
    fetchData()
  }

  const openDeleteModal = (item: Kecamatan) => {
    setDeleteTarget({ id: item.id, name: item.name })
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    const target = kecamatanData.find((item) => item.id === deleteTarget.id)
    const { error } = await supabase.from("districts").delete().eq("id", deleteTarget.id)

    if (error) {
      setDeleteModalOpen(false)
      return
    }

    await logActivity({
      actorId,
      actorName,
      actionType: "delete_data",
      description: `Menghapus kecamatan ${target?.district_code ?? ""} - ${target?.name ?? ""}`,
      module: "referensi_wilayah",
    })

    setDeleteModalOpen(false)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-200">
          {loadError}
        </p>
      ) : null}

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
            onClick={openAdd}
          >
            <Plus className="size-4" /> Tambah Kecamatan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Kecamatan</TableHead>
                  <TableHead>Nama Kecamatan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoading colSpan={3} />
                ) : kecamatanData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Belum ada kecamatan terdaftar.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  kecamatanData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.district_code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEdit(item.id)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(item)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingId ? "Edit Kecamatan" : "Tambah Kecamatan"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Kelola kode dan nama kecamatan.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
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
                  placeholder="Contoh: 3278071"
                />
              </div>
              <div>
                <Label htmlFor="kecamatan-nama">Nama Kecamatan</Label>
                <Input
                  id="kecamatan-nama"
                  value={kecamatanNama}
                  onChange={(event) => setKecamatanNama(event.target.value)}
                  placeholder="Contoh: Bungursari"
                />
              </div>
              {formError ? (
                <p className="text-sm text-rose-600">{formError}</p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={handleSave}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteModalOpen && deleteTarget !== null}
        title="Konfirmasi Hapus"
        description={
          deleteTarget
            ? `Yakin ingin menghapus kecamatan ${deleteTarget.name}? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
