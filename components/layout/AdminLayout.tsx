"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Upload,
  Database,
  MapPin,
  Cpu,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"
import { DevRoleSwitcher } from "@/components/layout/DevRoleSwitcher"

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Import Data KSA", href: "/admin/import-data-ksa", icon: Upload },
  { name: "Kelola Data KSA", href: "/admin/kelola-data-ksa", icon: Database },
  { name: "Referensi Wilayah", href: "/admin/referensi-wilayah", icon: MapPin },
  { name: "Model Prediksi", href: "/admin/model-prediksi", icon: Cpu },
  { name: "Pengguna Admin", href: "/admin/pengguna-admin", icon: Users },
]

const secondaryNavItem = {
  name: "Pengaturan",
  href: "/admin/pengaturan",
  icon: Settings,
}

interface AdminLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

function getInitials(source: string) {
  const normalized = source.trim().toLowerCase()

  if (normalized === "admin") {
    return "AD"
  }

  if (normalized === "superadmin" || normalized === "super admin") {
    return "SA"
  }

  const words = source
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.trim())

  if (words.length === 0) {
    return "PH"
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).replace(/[^A-Za-z]/g, "") || "PH"
  }

  return (words[0][0] + words[1][0]).toUpperCase()
}

function sentenceCase(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value
}

export function AdminLayout({ title, subtitle, children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null)
  const { role, setRole } = useAdminAuth()

  const activePath = pathname ?? "/admin/dashboard"
  const initials = getInitials(role || "Admin")
  const displayRole = sentenceCase(role || "Admin")

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const handleLogout = React.useCallback(async () => {
    const confirmed = window.confirm("Yakin ingin keluar?")
    if (!confirmed) {
      return
    }

    setProfileMenuOpen(false)

    try {
      await supabase.auth.signOut()
    } catch {
      // TODO: Sign out akan efektif penuh begitu tim backend menyelesaikan integrasi sesi Supabase.
    }

    setRole("")
    router.push("/admin/login")
  }, [router, setRole])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative flex min-h-screen">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden",
            sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="mb-8 flex items-center gap-3 px-2 text-slate-900 dark:text-slate-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/20">
              <Image
                src="/images/logo.png"
                alt="Pare Hurip"
                width={40}
                height={40}
                className="rounded-2xl object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold">Pare Hurip</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                // Hide the Pengguna Admin menu for non-superadmin roles
                if (item.href === "/admin/pengguna-admin" && role !== "superadmin") {
                  return null
                }

                const Icon = item.icon
                const isActive =
                  activePath === item.href || activePath.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="size-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="border-t border-slate-200 pt-4 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {(() => {
              const SecondaryIcon = secondaryNavItem.icon
              return (
                <Link
                  href={secondaryNavItem.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                    activePath === secondaryNavItem.href
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <SecondaryIcon className="size-4" />
                  <span>{secondaryNavItem.name}</span>
                </Link>
              )
            })()}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((value) => !value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
                >
                  {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Halaman Admin</p>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
                  {subtitle ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                  ) : null}
                </div>
              </div>

              <div className="relative flex items-center gap-3" ref={profileMenuRef}>
                {process.env.NODE_ENV !== "production" ? <DevRoleSwitcher /> : null}
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200">
                  {displayRole}
                </span>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-900 transition hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-label="Buka menu profil"
                >
                  <span className="text-sm font-semibold">{initials}</span>
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                        <span className="text-sm font-semibold">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {displayRole}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          admin@bps-tasikmalaya.go.id
                        </p>
                      </div>
                    </div>
                    <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="size-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
