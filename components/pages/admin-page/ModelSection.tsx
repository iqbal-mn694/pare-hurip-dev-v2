"use client";

import * as React from "react";
import { Activity, BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ModelHistoryItem {
  version: string
  trainedAt: string
  summary: string
  status: string
}

export function SimulatedDataBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-300">
      <Activity className="size-3" />
      Data simulasi — menunggu integrasi backend ML
    </span>
  );
}

function ModelStats({ version, trainedAtLabel, sampleCountLabel }: { version: string; trainedAtLabel: string; sampleCountLabel: string }) {
  const stats = [
    { label: "Versi aktif", value: version },
    { label: "Dilatih terakhir", value: trainedAtLabel },
    { label: "Data latih", value: sampleCountLabel },
    { label: "Status", value: "Aktif" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          {stat.label === "Status" ? (
            <p className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
              {stat.value}
            </p>
          ) : (
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {stat.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function ModelVersionHistory({ history, formatDate }: { history: ModelHistoryItem[]; formatDate: (value: string) => string }) {
  return (
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
            {history.map((item) => (
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
  );
}

interface ModelSectionProps {
  title: string
  description: string
  version: string
  trainedAtLabel: string
  sampleCountLabel: string
  history: ModelHistoryItem[]
  isTraining: boolean
  isSuperadmin: boolean
  onRetrain: () => void
  evalTable: React.ReactNode
}

export default function ModelSection({
  title,
  description,
  version,
  trainedAtLabel,
  sampleCountLabel,
  history,
  isTraining,
  isSuperadmin,
  onRetrain,
  evalTable,
}: ModelSectionProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            {description}
          </CardDescription>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <SimulatedDataBadge />
          {isSuperadmin ? (
            <Button className="bg-[#639922] hover:bg-[#58751d]" onClick={onRetrain} disabled={isTraining}>
              {isTraining ? <span className="inline-flex items-center gap-2"><RefreshCw className="size-4 animate-spin" /> Melatih ulang model...</span> : <><RefreshCw className="size-4" /> Latih Ulang Model</>}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isSuperadmin ? null : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-200">
            Hanya superadmin yang dapat memicu pelatihan ulang model.
          </div>
        )}

        <ModelStats version={version} trainedAtLabel={trainedAtLabel} sampleCountLabel={sampleCountLabel} />

        {evalTable}

        <ModelVersionHistory history={history} formatDate={formatDate} />
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
