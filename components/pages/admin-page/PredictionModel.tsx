"use client";

import * as React from "react";
import { Activity } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAuth } from "@/components/pages/admin-page/AdminAuthContext";
import ModelSection, { ModelHistoryItem, SimulatedDataBadge } from "@/components/pages/admin-page/ModelSection";

const PHASE_LABELS = [
  "Vegetatif 1",
  "Vegetatif 2",
  "Generatif 1",
  "Generatif 2",
  "Generatif 3",
  "Panen",
  "Bera",
  "Persiapan Lahan",
];

const PHASE_METRICS = [
  [92, 8, 1, 0, 0, 0, 0, 1],
  [5, 88, 6, 1, 0, 0, 0, 0],
  [1, 7, 84, 5, 1, 0, 0, 0],
  [0, 1, 6, 81, 4, 0, 0, 0],
  [0, 0, 2, 5, 78, 4, 1, 0],
  [0, 0, 0, 1, 5, 76, 3, 0],
  [0, 0, 0, 0, 2, 3, 74, 1],
  [1, 0, 0, 0, 0, 1, 2, 73],
];

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
];

const LSTM_EVALUATION = [
  { horizon: "H+7", mae: 125000, rmse: 158000 },
  { horizon: "H+14", mae: 148000, rmse: 184000 },
  { horizon: "H+21", mae: 172000, rmse: 215000 },
  { horizon: "H+30", mae: 199000, rmse: 246000 },
];

const RANDOM_FOREST_HISTORY: ModelHistoryItem[] = [
  { version: "v2.3", trainedAt: "2026-07-18", summary: "Acc H+1: 92%", status: "Aktif" },
  { version: "v2.2", trainedAt: "2026-06-28", summary: "Acc H+1: 89%", status: "Nonaktif" },
  { version: "v2.1", trainedAt: "2026-05-14", summary: "Acc H+1: 86%", status: "Nonaktif" },
  { version: "v2.0", trainedAt: "2026-04-09", summary: "Acc H+1: 83%", status: "Nonaktif" },
];

const LSTM_HISTORY: ModelHistoryItem[] = [
  { version: "v1.4", trainedAt: "2026-07-15", summary: "MAE H+7: Rp125k", status: "Aktif" },
  { version: "v1.3", trainedAt: "2026-06-20", summary: "MAE H+7: Rp138k", status: "Nonaktif" },
  { version: "v1.2", trainedAt: "2026-05-22", summary: "MAE H+7: Rp149k", status: "Nonaktif" },
  { version: "v1.1", trainedAt: "2026-04-10", summary: "MAE H+7: Rp162k", status: "Nonaktif" },
];

// TODO: replace with real model evaluation results from the ML/backend team
const EVAL_SUMMARY = {
  rf: { accuracy: 85.2, precision: 87, recall: 84, f1: 85 },
  lstm: { mae: 145000, rmse: 210000, mape: 4.8, r2: 0.91 },
};

function formatCurrency(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function ConfusionMatrixTable() {
  return (
    <div className="overflow-x-auto">
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
                const isDiagonal = rowIndex === columnIndex;
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
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PredictionModel() {
  const { role } = useAdminAuth();
  const isSuperadmin = role === "superadmin";

  const [rfHistory, setRfHistory] = React.useState(RANDOM_FOREST_HISTORY);
  const [lstmHistory, setLstmHistory] = React.useState(LSTM_HISTORY);
  const [isTraining, setIsTraining] = React.useState(false);
  const setProgress = React.useState(0)[1];
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(handle);
  }, [message]);

  const handleRetrain = (modelType: "rf" | "lstm") => {
    setIsTraining(true);
    setProgress(0);
    setMessage("");

    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = value + 12;
        if (next >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 200);

    window.setTimeout(() => {
      window.clearInterval(interval);
      setProgress(100);
      setIsTraining(false);

      if (modelType === "rf") {
        setRfHistory((prev) => {
          const nextVersion = `v2.${prev.length + 2}`;
          return [
            { version: nextVersion, trainedAt: "2026-07-21", summary: "Acc H+1: 94%", status: "Aktif" },
            ...prev.map((item) => ({ ...item, status: "Nonaktif" })),
          ];
        });
      } else {
        setLstmHistory((prev) => {
          const nextVersion = `v1.${prev.length + 3}`;
          return [
            { version: nextVersion, trainedAt: "2026-07-21", summary: "MAE H+7: Rp118k", status: "Aktif" },
            ...prev.map((item) => ({ ...item, status: "Nonaktif" })),
          ];
        });
      }

      setMessage("Training selesai. Versi model terbaru sudah aktif.");
      // TODO: replace this simulation with a real training API call (POST /api/admin/model/train) once the ML model backend is available.
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Ringkasan Evaluasi Model
          </h2>
          <SimulatedDataBadge />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-emerald-50/40 p-5 dark:border-slate-800 dark:bg-emerald-950/10 border-l-4 border-l-emerald-400">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Evaluasi Klasifikasi (Fase Tanam)
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Random Forest — memprediksi 8 kategori fase tanam
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {EVAL_SUMMARY.rf.accuracy}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {EVAL_SUMMARY.rf.precision}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Precision</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {EVAL_SUMMARY.rf.recall}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Recall</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {EVAL_SUMMARY.rf.f1}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">F1-Score</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 dark:border-slate-800 dark:bg-slate-900/40 border-l-4 border-l-slate-400">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Evaluasi Regresi (Harga Beras)
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              LSTM — memprediksi harga beras dalam Rupiah
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(EVAL_SUMMARY.lstm.mae)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">MAE</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(EVAL_SUMMARY.lstm.rmse)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">RMSE</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {EVAL_SUMMARY.lstm.mape}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">MAPE</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {EVAL_SUMMARY.lstm.r2.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">R² Score</p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Detail evaluasi per horizon dan confusion matrix tersedia di masing-masing section di bawah.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Akurasi menurun seiring horizon makin jauh — ini keterbatasan wajar model, bukan cacat, sesuai prinsip pelaporan yang jujur.
        </p>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Activity className="size-4" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <ModelSection
        title="Model Fase Tanam (Random Forest)"
        description="Evaluasi walk-forward validation untuk prediksi fase tanam."
        version="v2.3"
        trainedAtLabel="18 Juli 2026"
        sampleCountLabel="2.410 sampel"
        history={rfHistory}
        isTraining={isTraining}
        isSuperadmin={isSuperadmin}
        onRetrain={() => handleRetrain("rf")}
        evalTable={
          <div className="space-y-5">
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

            <Accordion
              type="single"
              collapsible
              className="rounded-2xl border border-slate-200 p-2 dark:border-slate-800"
            >
              <AccordionItem value="confusion-matrix">
                <AccordionTrigger className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Lihat Confusion Matrix
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2">
                    <ConfusionMatrixTable />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        }
      />

      <ModelSection
        title="Model Harga Beras (LSTM)"
        description="Evaluasi walk-forward validation untuk prediksi harga beras."
        version="v1.4"
        trainedAtLabel="15 Juli 2026"
        sampleCountLabel="1.860 sampel"
        history={lstmHistory}
        isTraining={isTraining}
        isSuperadmin={isSuperadmin}
        onRetrain={() => handleRetrain("lstm")}
        evalTable={
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
        }
      />
    </div>
  );
}
