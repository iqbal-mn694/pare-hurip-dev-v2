"use client"

import * as React from "react"
import {
  Database,
  Layers,
  MapPin,
  ArrowUpRight,
  Upload,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const summaryItems = [
  { title: "Total segmen", value: "312", icon: Database },
  { title: "Observasi bulan berjalan", value: "248/312", icon: Upload },
  { title: "Kecamatan lengkap", value: "7/10", icon: Layers },
  { title: "Versi model aktif", value: "v1.4.2", icon: Settings },
]

const kecamatanProgress = [
  { name: "Cibeureum", percent: 96 },
  { name: "Mangkubumi", percent: 88 },
  { name: "Lengkongsari", percent: 82 },
  { name: "Cihideung", percent: 74 },
  { name: "Cipedes", percent: 61 },
  { name: "Cipari", percent: 58 },
  { name: "Campaka", percent: 45 },
  { name: "Cipatujah", percent: 33 },
  { name: "Tawang", percent: 28 },
  { name: "Purbaratu", percent: 19 },
]

const activityLogs = [
  { icon: Upload, text: "Mengunggah data KSA segmentasi baru", actor: "Aini", time: "2 jam lalu" },
  { icon: Database, text: "Memperbarui data luas panen Kecamatan Cibeureum", actor: "Adnan", time: "4 jam lalu" },
  { icon: MapPin, text: "Menambahkan referensi wilayah baru", actor: "Dewi", time: "Kemarin" },
  { icon: Layers, text: "Memeriksa validitas model prediksi", actor: "Rizal", time: "Kemarin" },
  { icon: ArrowUpRight, text: "Menjalankan pelatihan model prediksi", actor: "Nanda", time: "2 hari lalu" },
]

function getProgressColor(percent: number) {
  if (percent >= 80) return "bg-emerald-500"
  if (percent >= 40) return "bg-amber-500"
  return "bg-destructive"
}

export default function Dashboard() {
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
            {activityLogs.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.text}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.actor} · {item.time}
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
