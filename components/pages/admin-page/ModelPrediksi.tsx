"use client"

import * as React from "react"
import { Activity, AlertCircle, BrainCircuit, RefreshCw } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext"

const PHASE_LABELS = [
  "Vegetatif 1",
  "Vegetatif 2",
  "Generatif 1",
  "Generatif 2",
  "Generatif 3",
  "Panen",
  "Bera",
  "Persiapan Lahan",
]

const PHASE_METRICS = [
  [92, 8, 1, 0, 0, 0, 0, 1],
  [5, 88, 6, 1, 0, 0, 0, 0],
  [1, 7, 84, 5, 1, 0, 0, 0],
  [0, 1, 6, 81, 4, 0, 0, 0],
  [0, 0, 2, 5, 78, 4, 1, 0],
  [0, 0, 0, 1, 5, 76, 3, 0],
  [0, 0, 0, 0, 2, 3, 74, 1],
  [1, 0, 0, 0, 0, 1, 2, 73],
]

const RANDOM_FOREST_EVALUATION = [
  { horizon: "H+1", accuracy: 92.4 },
  { horizon: "H+2", accuracy: 90.8 },
  { horizon: "H+3", accuracy: 88.7 },
  { horizon: "H+4", accuracy: 86.1 },
  { horizon: "H+5", accuracy: 83.4 },
  { horizon: "H+6", accuracy: 80.2 },
  { horizon: "H+7", accuracy: 77.5 },
  { horizon: "H+8", accuracy: 74.8 },
  { horizon: "H+9", accuracy: 71.2 },
  { horizon: "H+10", accuracy: 68.4 },
  { horizon: "H+11", accuracy: 64.9 },
  { horizon: "H+12", accuracy: 58.7 },
]

const LSTM_EVALUATION = [
  { horizon: "H+7", mae: 125000, rmse: 158000 },
  { horizon: "H+14", mae: 148000, rmse: 184000 },
  { horizon: "H+21", mae: 172000, rmse: 215000 },
  { horizon: "H+30", mae: 199000, rmse: 246000 },
]

const RANDOM_FOREST_HISTORY = [
  { version: "v2.3", trainedAt: "2026-07-18", summary: "Acc H+1: 92%", status: "Aktif" },
  { version: "v2.2", trainedAt: "2026-06-28", summary: "Acc H+1: 89%", status: "Nonaktif" },
  { version: "v2.1", trainedAt: "2026-05-14", summary: "Acc H+1: 86%", status: "Nonaktif" },
  { version: "v2.0", trainedAt: "2026-04-09", summary: "Acc H+1: 83%", status: "Nonaktif" },
]

const LSTM_HISTORY = [
  { version: "v1.4", trainedAt: "2026-07-15", summary: "MAE H+7: Rp125k", status: "Aktif" },
  { version: "v1.3", trainedAt: "2026-06-20", summary: "MAE H+7: Rp138k", status: "Nonaktif" },
  { version: "v1.2", trainedAt: "2026-05-22", summary: "MAE H+7: Rp149k", status: "Nonaktif" },
  { version: "v1.1", trainedAt: "2026-04-10", summary: "MAE H+7: Rp162k", status: "Nonaktif" },
]

function formatCurrency(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function ModelPrediksi() {
  const { role } = useAdminAuth()
  const isSuperadmin = role === "superadmin"

  const [rfHistory, setRfHistory] = React.useState(RANDOM_FOREST_HISTORY)
  const [lstmHistory, setLstmHistory] = React.useState(LSTM_HISTORY)
  const [isTraining, setIsTraining] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    if (!message) return
    const handle = window.setTimeout(() => setMessage(""), 3000)
    return () => window.clearTimeout(handle)
  }, [message])

  const handleRetrain = (modelType: "rf" | "lstm") => {
    setIsTraining(true)
    setProgress(0)
    setMessage("")

    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = value + 12
        if (next >= 100) {
          window.clearInterval(interval)
          return 100
        }
        return next
      })
    }, 200)

    window.setTimeout(() => {
      window.clearInterval(interval)
      setProgress(100)
      setIsTraining(false)

      if (modelType === "rf") {
        setRfHistory((prev) => {
          const nextVersion = `v2.${prev.length + 2}`
          return [
            { version: nextVersion, trainedAt: "2026-07-21", summary: `Acc H+1: 94%`, status: "Aktif" },
            ...prev.map((item) => ({ ...item, status: "Nonaktif" })),
          ]
        })
      } else {
        setLstmHistory((prev) => {
          const nextVersion = `v1.${prev.length + 3}`
          return [
            { version: nextVersion, trainedAt: "2026-07-21", summary: `MAE H+7: Rp118k`, status: "Aktif" },
            ...prev.map((item) => ({ ...item, status: "Nonaktif" })),
          ]
        })
      }

      setMessage("Training selesai. Versi model terbaru sudah aktif.")
      // TODO: ganti simulasi ini dengan pemanggilan API training sungguhan (POST /api/admin/model/train) setelah backend model ML tersedia.
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Akurasi menurun seiring horizon makin jauh — ini keterbatasan wajar model, bukan cacat, sesuai prinsip pelaporan yang jujur.
        </p>
      </div>

      {message ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Activity className="size-4" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Model Fase Tanam (Random Forest)
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Evaluasi walk-forward validation untuk prediksi fase tanam.
            </CardDescription>
          </div>
          {isSuperadmin ? (
            <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={() => handleRetrain("rf")} disabled={isTraining}>
              {isTraining ? <span className="inline-flex items-center gap-2"><RefreshCw className="size-4 animate-spin" /> Melatih ulang model...</span> : <><RefreshCw className="size-4" /> Latih Ulang Model</>}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {isSuperadmin ? null : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-200">
              Hanya superadmin yang dapat memicu pelatihan ulang model.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Versi aktif</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">v2.3</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Dilatih terakhir</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">18 Juli 2026</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Data latih</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">2.410 sampel</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
              <p className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">Aktif</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Horizon</TableHead>
                  <TableHead>Accuracy (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RANDOM_FOREST_EVALUATION.map((item) => (
                  <TableRow key={item.horizon}>
                    <TableCell>{item.horizon}</TableCell>
                    <TableCell>{item.accuracy.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 p-2 dark:border-slate-800">
            <AccordionItem value="confusion-matrix">
              <AccordionTrigger className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Lihat Confusion Matrix
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto pt-2">
                  <Table className="min-w-[620px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Actual / Pred</TableHead>
                        {PHASE_LABELS.map((label) => (
                          <TableHead key={label} className="min-w-[90px] text-center">{label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PHASE_METRICS.map((row, rowIndex) => (
                        <TableRow key={PHASE_LABELS[rowIndex]}>
                          <TableCell className="font-medium">{PHASE_LABELS[rowIndex]}</TableCell>
                          {row.map((value, columnIndex) => {
                            const isDiagonal = rowIndex === columnIndex
                            const intensity = isDiagonal ? Math.max(0.25, value / 100) : 0.12
                            return (
                              <TableCell key={`${rowIndex}-${columnIndex}`} className="text-center">
                                <span
                                  className={`inline-flex min-w-10 justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                                    isDiagonal
                                      ? `text-white ${value >= 90 ? "bg-emerald-700" : value >= 80 ? "bg-emerald-600" : value >= 70 ? "bg-emerald-500" : "bg-emerald-400"}`
                                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  {value}
                                </span>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <BrainCircuit className="size-4" />
              <span>Riwayat versi model</span>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Versi</TableHead>
                    <TableHead>Tanggal dilatih</TableHead>
                    <TableHead>Ringkasan metrik</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfHistory.map((item) => (
                    <TableRow key={`${item.version}-${item.trainedAt}`}>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>{formatDate(item.trainedAt)}</TableCell>
                      <TableCell>{item.summary}</TableCell>
                      <TableCell>{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Model Harga Beras (LSTM)
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Evaluasi walk-forward validation untuk prediksi harga beras.
            </CardDescription>
          </div>
          {isSuperadmin ? (
            <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={() => handleRetrain("lstm")} disabled={isTraining}>
              {isTraining ? <span className="inline-flex items-center gap-2"><RefreshCw className="size-4 animate-spin" /> Melatih ulang model...</span> : <><RefreshCw className="size-4" /> Latih Ulang Model</>}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {isSuperadmin ? null : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-200">
              Hanya superadmin yang dapat memicu pelatihan ulang model.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Versi aktif</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">v1.4</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Dilatih terakhir</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">15 Juli 2026</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Data latih</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">1.860 sampel</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
              <p className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">Aktif</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Horizon</TableHead>
                  <TableHead>MAE</TableHead>
                  <TableHead>RMSE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LSTM_EVALUATION.map((item) => (
                  <TableRow key={item.horizon}>
                    <TableCell>{item.horizon}</TableCell>
                    <TableCell>{formatCurrency(item.mae)}</TableCell>
                    <TableCell>{formatCurrency(item.rmse)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <BrainCircuit className="size-4" />
              <span>Riwayat versi model</span>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Versi</TableHead>
                    <TableHead>Tanggal dilatih</TableHead>
                    <TableHead>Ringkasan metrik</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lstmHistory.map((item) => (
                    <TableRow key={`${item.version}-${item.trainedAt}`}>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>{formatDate(item.trainedAt)}</TableCell>
                      <TableCell>{item.summary}</TableCell>
                      <TableCell>{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
