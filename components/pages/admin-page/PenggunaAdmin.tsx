"use client"

import * as React from "react"
import { CheckCircle, Plus, Trash2, UserCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

type UserProfile = {
  id: string
  email: string
  role: "admin" | "superadmin"
  created_at: string
}

type FetchStatus = "idle" | "loading" | "success" | "error"

const DUMMY_USERS: UserProfile[] = [
  { id: "user-1", email: "admin1@example.com", role: "admin", created_at: "2025-05-10T09:41:00Z" },
  { id: "user-2", email: "admin2@example.com", role: "admin", created_at: "2025-06-12T14:27:00Z" },
  { id: "user-3", email: "superadmin@example.com", role: "superadmin", created_at: "2025-04-05T08:12:00Z" },
  { id: "user-4", email: "admin3@example.com", role: "admin", created_at: "2025-07-01T11:07:00Z" },
  { id: "user-5", email: "supervisor@example.com", role: "superadmin", created_at: "2025-03-22T16:35:00Z" },
]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function RoleBadge({ role }: { role: UserProfile["role"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        role === "superadmin"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
          : "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
      }`}
    >
      {role === "superadmin" ? "Superadmin" : "Admin"}
    </span>
  )
}

export default function PenggunaAdmin() {
  const { role: currentRole } = useAdminAuth()
  const isSuperadmin = currentRole === "superadmin"

  const [users, setUsers] = React.useState<UserProfile[]>([])
  const [status, setStatus] = React.useState<FetchStatus>("idle")
  const [message, setMessage] = React.useState<string>("")

  const [isAdding, setIsAdding] = React.useState(false)
  const [newEmail, setNewEmail] = React.useState("")
  const [newRole, setNewRole] = React.useState<"admin" | "superadmin" | "">("")
  const [formError, setFormError] = React.useState("")

  const [isEditing, setIsEditing] = React.useState(false)
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null)
  const [editingUserRole, setEditingUserRole] = React.useState<"admin" | "superadmin" | "">("")
  const [editError, setEditError] = React.useState("")

  const fetchUsers = React.useCallback(async () => {
    setStatus("loading")
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Tidak dapat memuat daftar pengguna.")
      }
      const data = await response.json()
      if (!data?.users?.length) {
        // TODO: Fallback sementara ke data dummy bila backend belum siap atau mengembalikan kosong.
        setUsers(DUMMY_USERS)
        setStatus("success")
        return
      }

      setUsers(
        data.users.map((item: any) => ({
          id: item.id,
          email: item.email,
          role: item.role,
          created_at: item.created_at,
        })),
      )
      setStatus("success")
    } catch (error) {
      setUsers(DUMMY_USERS)
      setStatus("error")
      setMessage("Backend belum siap, menampilkan data dummy.")
    }
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  React.useEffect(() => {
    if (!message) return
    const handle = window.setTimeout(() => setMessage(""), 3000)
    return () => window.clearTimeout(handle)
  }, [message])

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const openAdd = () => {
    setNewEmail("")
    setNewRole("")
    setFormError("")
    setIsAdding(true)
  }

  const closeAdd = () => {
    setIsAdding(false)
    setFormError("")
  }

  const openEdit = (user: UserProfile) => {
    setEditingUserId(user.id)
    setEditingUserRole(user.role)
    setEditError("")
    setIsEditing(true)
  }

  const closeEdit = () => {
    setIsEditing(false)
    setEditingUserId(null)
    setEditError("")
  }

  const handleEditSave = async () => {
    if (!editingUserId) return
    if (!editingUserRole) {
      setEditError("Role harus dipilih.")
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUserId, role: editingUserRole }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Gagal memperbarui role pengguna.")
      }
      setMessage("Role pengguna berhasil diperbarui.")
      closeEdit()
      fetchUsers()
    } catch (error: any) {
      setEditError(error.message || "Terjadi kesalahan saat memperbarui role.")
    }
  }

  const handleSave = async () => {
    if (!validateEmail(newEmail.trim())) {
      setFormError("Email tidak valid.")
      return
    }
    if (!newRole) {
      setFormError("Role harus dipilih.")
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Gagal menambah pengguna.")
      }
      setMessage("Admin baru berhasil ditambahkan.")
      closeAdd()
      fetchUsers()
    } catch (error: any) {
      setFormError(error.message || "Terjadi kesalahan saat menambahkan.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus pengguna ini?")) {
      return
    }
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Gagal menghapus pengguna.")
      }
      setMessage("Pengguna berhasil dihapus.")
      fetchUsers()
    } catch (error: any) {
      setMessage(error.message || "Terjadi kesalahan saat menghapus.")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pengguna Admin
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Kelola akun admin dan superadmin.
            </CardDescription>
          </div>
          {isSuperadmin ? (
            <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={openAdd}>
              <Plus className="size-4" /> Tambah Admin
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentRole !== "superadmin" ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-200">
              Hanya superadmin yang dapat menambah atau menghapus akun admin.
            </div>
          ) : null}

          {message ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4" />
                <span>{message}</span>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto px-0">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama / Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal dibuat</TableHead>
                  {isSuperadmin ? <TableHead>Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    {isSuperadmin ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(user)}
                    >
                      <UserCheck className="size-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isAdding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tambah Admin Baru</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tambahkan akun admin atau superadmin melalui email.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeAdd}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="new-admin-email">Email</Label>
                <Input
                  id="new-admin-email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="new-admin-role">Role</Label>
                <Select
                  value={newRole}
                  onValueChange={(value) => setNewRole(value as "admin" | "superadmin" | "")}
                >
                  <SelectTrigger id="new-admin-role" className="w-full">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={closeAdd}>Batal</Button>
              <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={handleSave}>Simpan</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ubah Role Pengguna</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pilih role baru untuk akun admin ini.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeEdit}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="edit-admin-role">Role</Label>
                <Select
                  value={editingUserRole}
                  onValueChange={(value) => setEditingUserRole(value as "admin" | "superadmin" | "")}
                >
                  <SelectTrigger id="edit-admin-role" className="w-full">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editError ? <p className="text-sm text-rose-600">{editError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={closeEdit}>Batal</Button>
              <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={handleEditSave}>Simpan</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
