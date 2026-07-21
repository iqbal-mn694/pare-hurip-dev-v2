// "use client"

// import * as React from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { Eye, EyeOff, ShieldCheck } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

// type LoginErrors = {
//   email?: string
//   password?: string
//   role?: string
// }

// function isValidEmail(value: string) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
// }

// function handleLogin(email: string, password: string, role: string) {
//   // TODO: Integrasi API auth nyata nanti.
//   // Validasi kombinasi email + password + role akan diverifikasi oleh backend.
//   console.log("Mock login", { email, password, role })
// }

// export default function Login() {
//   const router = useRouter()
//   const { setRole: setAdminRole } = useAdminAuth()

//   const [email, setEmail] = React.useState("")
//   const [password, setPassword] = React.useState("")
//   const [role, setRole] = React.useState("")
//   const [rememberMe, setRememberMe] = React.useState(false)
//   const [showPassword, setShowPassword] = React.useState(false)
//   const [errors, setErrors] = React.useState<LoginErrors>({})

//   const validate = React.useCallback(() => {
//     const nextErrors: LoginErrors = {}

//     if (!email.trim()) {
//       nextErrors.email = "Email wajib diisi."
//     } else if (!isValidEmail(email)) {
//       nextErrors.email = "Format email tidak valid."
//     }

//     if (!password) {
//       nextErrors.password = "Kata sandi wajib diisi."
//     }

//     if (!role) {
//       nextErrors.role = "Pilih role Anda."
//     }

//     setErrors(nextErrors)
//     return Object.keys(nextErrors).length === 0
//   }, [email, password, role])

//   const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault()

//     if (!validate()) {
//       return
//     }

//     setAdminRole(role)
//     handleLogin(email, password, role)
//     router.push("/admin/dashboard")
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
//       <div className="mx-auto flex w-full max-w-md flex-col gap-6">
//         <div className="text-center">
//           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-200">
//             <ShieldCheck className="size-7" />
//           </div>
//           <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
//             Pare Hurip Admin
//           </h1>
//           <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
//             Masuk untuk mengelola data KSA resmi
//           </p>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="space-y-5 px-6 py-8">
//             <form className="space-y-5" onSubmit={onSubmit} noValidate>
//               <div className="space-y-2">
//                 <Label htmlFor="admin-email">Email</Label>
//                 <Input
//                   id="admin-email"
//                   type="email"
//                   value={email}
//                   onChange={(event) => setEmail(event.target.value)}
//                   placeholder="admin@bps-tasikmalaya.go.id"
//                   autoComplete="email"
//                 />
//                 {errors.email ? (
//                   <p className="text-sm text-destructive">{errors.email}</p>
//                 ) : null}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="admin-password" className="flex items-center justify-between">
//                   <span>Password</span>
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="admin-password"
//                     type={showPassword ? "text" : "password"}
//                     value={password}
//                     onChange={(event) => setPassword(event.target.value)}
//                     placeholder="Masukkan kata sandi"
//                     autoComplete="current-password"
//                     className="pr-10"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword((value) => !value)}
//                     className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
//                     aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
//                   >
//                     {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//                   </button>
//                 </div>
//                 {errors.password ? (
//                   <p className="text-sm text-destructive">{errors.password}</p>
//                 ) : null}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="admin-role">Role</Label>
//                 <Select value={role} onValueChange={setRole}>
//                   <SelectTrigger id="admin-role" className="w-full">
//                     <SelectValue placeholder="Pilih role..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Admin">Admin</SelectItem>
//                     <SelectItem value="Superadmin">Superadmin</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 {errors.role ? (
//                   <p className="text-sm text-destructive">{errors.role}</p>
//                 ) : null}
//               </div>

//               <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
//                 <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
//                   <input
//                     type="checkbox"
//                     checked={rememberMe}
//                     onChange={(event) => setRememberMe(event.target.checked)}
//                     className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900"
//                   />
//                   Ingat saya
//                 </label>
//                 <Link
//                   href="#"
//                   className="text-sm text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
//                 >
//                   Lupa kata sandi?
//                 </Link>
//               </div>

//               <Button
//                 type="submit"
//                 className="w-full bg-[#639922] text-white hover:bg-[#4f7d19]"
//               >
//                 Masuk
//               </Button>
//             </form>
//           </CardContent>
//         </Card>

//         <div className="rounded-xl border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
//           Halaman ini khusus untuk admin BPS Kota Tasikmalaya. Pengunjung umum tidak perlu login, silakan gunakan menu Coba Sekarang di beranda.
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

type LoginErrors = {
  email?: string
  password?: string
  form?: string
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function Login() {
  const router = useRouter()
  const { setRole: setAdminRole } = useAdminAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [errors, setErrors] = React.useState<LoginErrors>({})
  const [loading, setLoading] = React.useState(false)

  const validate = React.useCallback(() => {
    const nextErrors: LoginErrors = {}

    if (!email.trim()) {
      nextErrors.email = "Email wajib diisi."
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Format email tidak valid."
    }

    if (!password) {
      nextErrors.password = "Kata sandi wajib diisi."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [email, password])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    setErrors({})

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      setLoading(false)
      setErrors({ form: "Email atau kata sandi salah." })
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      setErrors({ form: "Gagal mengambil data profil. Coba lagi." })
      return
    }

    if (profile.role !== "admin" && profile.role !== "superadmin") {
      setErrors({ form: "Akun ini belum memiliki akses admin. Hubungi superadmin." })
      await supabase.auth.signOut()
      return
    }

    setAdminRole(profile.role)
    router.push("/admin/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-200">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Pare Hurip Admin
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Masuk untuk mengelola data KSA resmi
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="space-y-5 px-6 py-8">
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              {errors.form ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errors.form}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@bps-tasikmalaya.go.id"
                  autoComplete="email"
                />
                {errors.email ? (
                  <p className="text-sm text-destructive">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="flex items-center justify-between">
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password}</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                  Ingat saya
                </label>
                <Link
                  href="#"
                  className="text-sm text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
                >
                  Lupa kata sandi?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#639922] text-white hover:bg-[#4f7d19]"
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          Halaman ini khusus untuk admin BPS Kota Tasikmalaya. Pengunjung umum tidak perlu login, silakan gunakan menu Coba Sekarang di beranda.
        </div>
      </div>
    </div>
  )
}
