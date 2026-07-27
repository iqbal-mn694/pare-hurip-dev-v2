"use client"

import * as React from "react"
import {
  Database,
  Layers,
  MapPin,
  Upload,
  Settings,
  Cpu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

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

interface KsaRow {
  id_segmen: string
  periode: string
}

interface ActivityLogRow {
  id: string
  actor_id: string | null
  actor_name: string | null
  action_type: string | null
  module: string | null
  description: string | null
  created_at: string | null
}

function getCurrentPeriode() {
  return new Date().toISOString().slice(0, 7) // format YYYY-MM, sesuai <input type="month">
}

function getProgressColor(percent: number) {
  if (percent >= 80) return "bg-emerald-500"
  if (percent >= 40) return "bg-amber-500"
  return "bg-destructive"
}

function getActivityIcon(module: string | null) {
  switch (module) {
    case "import_data":
      return Upload
    case "kelola_data":
      return Database
    case "referensi_wilayah":
      return MapPin
    case "model_prediksi":
      return Cpu
    default:
      return Database
  }
}

function formatRelativeTime(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "Baru saja"
  if (diffMin < 60) return `${diffMin} menit lalu`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return "Kemarin"
  if (diffDay < 7) return `${diffDay} hari lalu`

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

export default function Dashboard() {
  const [kecamatanList, setKecamatanList] = React.useState<KecamatanRef[]>([])
  const [segmenList, setSegmenList] = React.useState<SegmenRef[]>([])
  const [ksaRows, setKsaRows] = React.useState<KsaRow[]>([])
  const [modelVersion, setModelVersion] = React.useState("v1.4.2")
  const [activityLogs, setActivityLogs] = React.useState<ActivityLogRow[]>([])

  const currentPeriode = React.useMemo(() => getCurrentPeriode(), [])

  const fetchSummaryData = React.useCallback(async () => {
    const [{ data: kec }, { data: seg }, { data: ksa }] = await Promise.all([
      supabase.from("kecamatan").select("id, kode_kecamatan, nama_kecamatan"),
      supabase.from("segmen").select("id, id_segmen, kecamatan_id"),
      supabase
        .from("ksa_segments")
        .select("id_segmen, periode")
        .eq("periode", currentPeriode),
    ])

    setKecamatanList(kec ?? [])
    setSegmenList(seg ?? [])
    setKsaRows(ksa ?? [])

    try {
      const { data: model } = await supabase
        .from("model_versions")
        .select("version")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (model?.version) setModelVersion(model.version)
    } catch {
      
    }
  }, [currentPeriode])

  const fetchActivityLogs = React.useCallback(async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, actor_id, actor_name, action_type, module, description, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    setActivityLogs(data ?? [])
  }, [])

  React.useEffect(() => {
    fetchSummaryData()
    fetchActivityLogs()
  }, [fetchSummaryData, fetchActivityLogs])

  React.useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ksa_segments" },
        () => {
          fetchSummaryData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log" },
        () => {
          fetchActivityLogs()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "segmen" },
        () => {
          fetchSummaryData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kecamatan" },
        () => {
          fetchSummaryData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSummaryData, fetchActivityLogs])

  const totalSegmen = segmenList.length

  const observedSegmenSet = React.useMemo(
    () => new Set(ksaRows.map((row) => row.id_segmen)),
    [ksaRows]
  )
  const observasiCount = observedSegmenSet.size

  const kecamatanProgress = React.useMemo(() => {
    return kecamatanList
      .map((kec) => {
        const segmenInKec = segmenList.filter((seg) => seg.kecamatan_id === kec.id)
        const totalInKec = segmenInKec.length
        const observedInKec = segmenInKec.filter((seg) =>
          observedSegmenSet.has(seg.id_segmen)
        ).length
        const percent = totalInKec > 0 ? Math.round((observedInKec / totalInKec) * 100) : 0
        return { name: kec.nama_kecamatan, percent }
      })
      .sort((a, b) => b.percent - a.percent)
  }, [kecamatanList, segmenList, observedSegmenSet])

  const kecamatanLengkapCount = kecamatanProgress.filter((item) => item.percent === 100).length

  const summaryItems = [
    { title: "Total segmen", value: String(totalSegmen), icon: Database },
    { title: "Observasi bulan berjalan", value: `${observasiCount}/${totalSegmen}`, icon: Upload },
    { title: "Kecamatan lengkap", value: `${kecamatanLengkapCount}/${kecamatanList.length}`, icon: Layers },
    { title: "Versi model aktif", value: modelVersion, icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="rounded-xl border shadow-sm">
              <CardHeader className="px-5 pt-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <Icon className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {item.title}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-3">
                <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[60%_40%]">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="px-5 pb-0 pt-4">
            <CardTitle className="mb-0">Status Kelengkapan Data per Kecamatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-0">
            {kecamatanProgress.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>{item.name}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      getProgressColor(item.percent)
                    )}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="px-5 pb-0 pt-4">
            <CardTitle className="mb-0">Log Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-0">
            {activityLogs.map((item) => {
              const Icon = getActivityIcon(item.module)
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.description ?? "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.actor_name ?? "Admin"} · {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}