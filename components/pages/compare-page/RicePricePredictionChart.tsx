/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Info,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";
import {
  RICE_TYPES,
  RiceTypeOption,
  ML_API_BASE_URL,
  DailyPricePoint,
  WeeklyPoint,
  RicePricePredictionResult,
  fetchRicePriceHistory,
  aggregateWeekly,
  computeVolatility,
  predictRicePrices,
} from "@/lib/rice-price/api";

// ---------------------------------------------------------------------------
// Konfigurasi
// ---------------------------------------------------------------------------

const HISTORY_WEEKS = 8;
const DAILY_DAYS = 63;
const FEED_DAYS = 61;
const PREDICTION_WEEKS = 4;
const PREDICTION_HORIZON_DAYS = PREDICTION_WEEKS * 7; // 28 hari (4 minggu) dari 30 hari yg dikembalikan API
const AUTO_RETRY_DELAY_MS = 4000;
const FUTURE_KEY_PREFIX = "future";

const formatRupiah = (v: number | undefined | null) =>
  v === undefined || v === null
    ? "–"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(v);

const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

function volatilityTier(v: number): { label: string; className: string } {
  if (v < 1.5)
    return { label: "Stabil", className: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  if (v < 4)
    return { label: "Sedang", className: "bg-amber-100 text-amber-700 border-amber-300" };
  return { label: "Tinggi", className: "bg-rose-100 text-rose-700 border-rose-300" };
}

/** Agregasi 28 hari pertama dari array prediksi harian API menjadi 4 titik mingguan */
function buildFutureWeeklyPoints(prediction: RicePricePredictionResult | undefined): WeeklyPoint[] {
  if (!prediction || prediction.predictions.length === 0) return [];
  const daily: DailyPricePoint[] = prediction.predictions
    .slice(0, PREDICTION_HORIZON_DAYS)
    .map((p) => ({ date: p.target_date, price: p.predicted_price }));
  return aggregateWeekly(daily, FUTURE_KEY_PREFIX).slice(0, PREDICTION_WEEKS);
}

interface TypeChartInfo {
  type: RiceTypeOption;
  daily: DailyPricePoint[];
  weekly: WeeklyPoint[];
  prediction?: RicePricePredictionResult;
  predictedWeeks: WeeklyPoint[]; // hingga 4 titik mingguan ke depan
  predictedAvg?: number; // rata-rata seluruh predictedWeeks
  predictedRangeLabel?: string;
  historicalVolatility: number;
}

interface ChartRow {
  weekKey: string;
  label: string;
  rangeLabel: string;
  isFuture: boolean;
  [dataKey: string]: any;
}

const ALL_TYPE_IDS = RICE_TYPES.map((rt) => rt.id);

export default function RicePricePredictionChart() {
  const [dailyByType, setDailyByType] = useState<Record<string, DailyPricePoint[]>>({});
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRetryTick, setHistoryRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setHistoryError(null);
    async function load() {
      try {
        const promises = RICE_TYPES.map(async (rt, idx) => {
          const daily = await fetchRicePriceHistory(idx + 1, DAILY_DAYS);
          return { id: rt.id, daily };
        });
        const results = await Promise.all(promises);
        if (cancelled) return;
        const map: Record<string, DailyPricePoint[]> = {};
        results.forEach((r) => (map[r.id] = r.daily));
        setDailyByType(map);
      } catch (err) {
        if (cancelled) return;
        setDailyByType({});
        setHistoryError(
          "Gagal memuat data harga historis dari database. " +
            (err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.")
        );
      }
    }
    load();
    return () => { cancelled = true; };
  }, [historyRetryTick]);

  const weeklyByType = useMemo(() => {
    const map: Record<string, WeeklyPoint[]> = {};
    RICE_TYPES.forEach((rt) => {
      map[rt.id] = aggregateWeekly(dailyByType[rt.id] ?? []);
    });
    return map;
  }, [dailyByType]);

  // --- Prediksi diambil untuk SEMUA jenis beras sekaligus (dipakai Card 1) ---
  const [predictions, setPredictions] = useState<Record<string, RicePricePredictionResult>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const store = dailyByType; // baca sekali dalam closure
    if (Object.keys(store).length === 0) {
      setLoading(false);
      return;
    }

    const items = RICE_TYPES.map((type) => {
      const daily = store[type.id];
      if (!daily || daily.length < FEED_DAYS) return null;
      const feed = daily.slice(-FEED_DAYS);
      return {
        rice_type: type.label,
        last_prices: feed.map((d) => d.price),
        last_price_date: feed[feed.length - 1].date,
      };
    }).filter(Boolean) as { rice_type: string; last_prices: number[]; last_price_date: string }[];

    if (items.length === 0) { setLoading(false); return; }

    predictRicePrices(items)
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, RicePricePredictionResult> = {};
        results.forEach((r) => {
          const type = RICE_TYPES.find((rt) => rt.label === r.rice_type);
          if (type) map[type.id] = r;
        });
        setPredictions(map);
      })
      .catch((err) => {
        if (cancelled) return;
        setPredictions({});
        setErrorMsg(
          `Tidak dapat terhubung ke API prediksi di ${ML_API_BASE_URL}. Pastikan service ML Hybrid LSTM sedang berjalan. Data akan menampilkan histori saja untuk sementara. (${
            err instanceof Error ? err.message : "unknown error"
          })`
        );

        if (retryTick === 0) {
          setTimeout(() => {
            if (!cancelled) setRetryTick((t) => t + 1);
          }, AUTO_RETRY_DELAY_MS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dailyByType, retryTick]);

  // --- Info lengkap utk SEMUA jenis beras (dipakai Card 1: ringkasan) ---
  const allInfos: TypeChartInfo[] = useMemo(() => {
    return RICE_TYPES.map((type) => {
      const daily = dailyByType[type.id];
      const weekly = weeklyByType[type.id];
      const prediction = predictions[type.id];
      const predictedWeeks = buildFutureWeeklyPoints(prediction);
      let predictedAvg: number | undefined;
      let predictedRangeLabel: string | undefined;
      if (predictedWeeks.length > 0) {
        predictedAvg =
          predictedWeeks.reduce((s, w) => s + w.avgPrice, 0) / predictedWeeks.length;
        predictedRangeLabel = `${formatDateShort(predictedWeeks[0].startDate)} – ${formatDateShort(
          predictedWeeks[predictedWeeks.length - 1].endDate
        )}`;
      }
      return {
        type,
        daily,
        weekly,
        prediction,
        predictedWeeks,
        predictedAvg,
        predictedRangeLabel,
        historicalVolatility: computeVolatility(weekly.map((w) => w.avgPrice)),
      };
    });
  }, [dailyByType, weeklyByType, predictions]);

  const avgVolatilityAll =
    allInfos.length > 0
      ? allInfos.reduce((s, i) => s + i.historicalVolatility, 0) / allInfos.length
      : 0;

  // --- Selector KHUSUS untuk chart di Card 2 ---
  const [chartSelectedIds, setChartSelectedIds] = useState<string[]>([
    RICE_TYPES[0].id,
    RICE_TYPES[2].id,
    RICE_TYPES[4].id,
  ]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleChartType = (id: string) => {
    setChartSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const chartInfos: TypeChartInfo[] = useMemo(
    () => allInfos.filter((info) => chartSelectedIds.includes(info.type.id)),
    [allInfos, chartSelectedIds]
  );

  // ---------------------------------------------------------------------------
  // Susun data grafik gabungan: historis + 4 titik mingguan prediksi ke depan
  // ---------------------------------------------------------------------------
  const { rows, boundaryKey, rangeLookup } = useMemo(() => {
    const referenceWeekly = chartInfos[0]?.weekly ?? weeklyByType[RICE_TYPES[0].id];
    const referenceFutureWeekly = chartInfos[0]?.predictedWeeks ?? [];
    const rangeMap: Record<string, string> = {};

    const historicalRows: ChartRow[] = referenceWeekly.map((w, idx) => {
      const row: ChartRow = {
        weekKey: w.weekKey,
        label: w.label,
        rangeLabel: w.rangeLabel,
        isFuture: false,
      };
      rangeMap[w.weekKey] = w.rangeLabel;
      const isBoundary = idx === referenceWeekly.length - 1;
      chartInfos.forEach((info) => {
        const point = info.weekly[idx];
        if (!point) return;
        row[`hist_${info.type.id}`] = point.avgPrice;
        if (isBoundary) {
          row[`pred_${info.type.id}`] = point.avgPrice; // penyambung garis ke titik prediksi pertama
        }
      });
      return row;
    });

    const futureRows: ChartRow[] = [];
    if (referenceFutureWeekly.length > 0) {
      referenceFutureWeekly.forEach((fw, idx) => {
        const row: ChartRow = {
          weekKey: fw.weekKey,
          label: fw.label,
          rangeLabel: fw.rangeLabel,
          isFuture: true,
        };
        rangeMap[fw.weekKey] = fw.rangeLabel;
        chartInfos.forEach((info) => {
          const point = info.predictedWeeks[idx];
          if (point) row[`pred_${info.type.id}`] = point.avgPrice;
        });
        futureRows.push(row);
      });
    } else if (referenceWeekly.length > 0) {
      // Placeholder 4 minggu prediksi saat hasil ML belum tiba, supaya
      // sumbu-X stabil sejak awal (historis tidak membentang penuh lalu
      // "melompat" ketika prediksi datang).
      const base = new Date(referenceWeekly[referenceWeekly.length - 1].endDate);
      for (let i = 0; i < PREDICTION_WEEKS; i++) {
        const start = new Date(base);
        start.setDate(start.getDate() + 1 + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const startLabel = start.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        const endLabel = end.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const weekKey = `${FUTURE_KEY_PREFIX}-${i}`;
        futureRows.push({
          weekKey,
          label: startLabel,
          rangeLabel: `${startLabel} – ${endLabel}`,
          isFuture: true,
        });
        rangeMap[weekKey] = `${startLabel} – ${endLabel}`;
      }
    }

    const boundary = referenceWeekly[referenceWeekly.length - 1]?.weekKey ?? "";

    return {
      rows: [...historicalRows, ...futureRows],
      boundaryKey: boundary,
      rangeLookup: rangeMap,
    };
  }, [chartInfos, weeklyByType]);

  const avgVolatilityChart =
    chartInfos.length > 0
      ? chartInfos.reduce((s, i) => s + i.historicalVolatility, 0) / chartInfos.length
      : 0;

  const yDomain = useMemo((): [number, number] | undefined => {
    let min = Infinity;
    let max = -Infinity;
    rows.forEach((row) => {
      chartInfos.forEach((info) => {
        const h = row[`hist_${info.type.id}`];
        const p = row[`pred_${info.type.id}`];
        if (typeof h === "number") {
          min = Math.min(min, h);
          max = Math.max(max, h);
        }
        if (typeof p === "number") {
          min = Math.min(min, p);
          max = Math.max(max, p);
        }
      });
    });
    if (!isFinite(min) || !isFinite(max)) return undefined;
    const pad = Math.max(200, (max - min) * 0.15);
    return [Math.floor((min - pad) / 100) * 100, Math.ceil((max + pad) / 100) * 100];
  }, [rows, chartInfos]);

  if (Object.keys(dailyByType).length === 0) {
    if (historyError) {
      return (
        <Card className="border-amber-300 dark:border-amber-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{historyError}</span>
              <button
                type="button"
                onClick={() => setHistoryRetryTick((t) => t + 1)}
                className="shrink-0 text-xs font-medium underline hover:no-underline"
              >
                Coba Lagi
              </button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Memuat data harga beras">
        <Card className="border-green-100 dark:border-green-900/40 shadow-sm">
          <CardHeader>
            <div className="h-6 w-56 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-96 max-w-full rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
                >
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-8 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              ))}
              <div className="rounded-xl border border-dashed border-green-300 dark:border-green-800 p-4 col-span-2 sm:col-span-3 lg:col-span-2">
                <div className="h-4 w-2/3 rounded bg-green-200/50 dark:bg-green-900/40 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100 dark:border-green-900/40 shadow-sm">
          <CardContent className="p-4">
            <div className="h-[420px] md:h-[480px] rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =========================================================== */}
      {/* CARD 1 — Ringkasan SEMUA jenis beras, tanpa dropdown          */}
      {/* =========================================================== */}
      <Card className="overflow-hidden border-green-100 dark:border-green-900/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-slate-800 dark:text-white">
            <Wheat className="w-5 h-5 text-green-600" />
            Ringkasan Harga Beras
          </CardTitle>
          <CardDescription className="max-w-xl text-xs md:text-sm leading-relaxed">
            Harga minggu terakhir vs proyeksi minggu depan untuk semua jenis beras yang dipantau.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-1 space-y-1">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{errorMsg}</span>
              <button
                type="button"
                onClick={() => setRetryTick((t) => t + 1)}
                className="shrink-0 text-xs font-medium underline hover:no-underline"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {allInfos.map((info) => {
              const last = info.weekly[info.weekly.length - 1]?.avgPrice;
              const pred = info.predictedAvg;
              const delta = last && pred ? ((pred - last) / last) * 100 : undefined;
              const tier = volatilityTier(info.historicalVolatility);
              const TrendIcon =
                delta === undefined ? Minus : delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus;
              const trendColor =
                delta === undefined
                  ? "text-slate-400"
                  : delta > 0.05
                  ? "text-rose-600"
                  : delta < -0.05
                  ? "text-emerald-600"
                  : "text-slate-400";

              return (
                <div
                  key={info.type.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: info.type.color }}
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {info.type.label}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${tier.className}`}
                    >
                      {tier.label}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">Minggu Terakhir</p>
                      <p className="text-base font-bold text-slate-800 dark:text-white">
                        {formatRupiah(last)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Prediksi Minggu Depan</p>
                      <p className="text-base font-bold" style={{ color: info.type.colorPrediction }}>
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin inline text-slate-400" />
                        ) : (
                          formatRupiah(pred)
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    {delta !== undefined ? `${delta > 0 ? "+" : ""}${delta.toFixed(2)}%` : "Menunggu prediksi…"}
                    <span className="text-slate-400 font-normal ml-1">
                      • Volatilitas {info.historicalVolatility.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="rounded-xl border border-dashed border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 p-4 flex flex-col justify-center col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-semibold">
                <Activity className="w-4 h-4" />
                Volatilitas Rata-rata
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                {avgVolatilityAll.toFixed(1)}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Rata-rata koefisien variasi harga mingguan dari seluruh {allInfos.length} jenis beras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================== */}
      {/* CARD 2 — Grafik dengan dropdown pemilih line                  */}
      {/* =========================================================== */}
      <Card className="border-green-100 dark:border-green-900/40 shadow-sm">
        <CardHeader className="pb-3 relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white text-base md:text-lg">
                <Activity className="w-4.5 h-4.5 text-green-600" />
                Tren &amp; Prediksi Harga
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {HISTORY_WEEKS} minggu historis tersambung dengan proyeksi{" "}
                <strong>{PREDICTION_WEEKS} minggu ke depan</strong> dari LSTM Hybrid. Garis solid =
                historis, garis putus-putus = prediksi.
              </CardDescription>
            </div>

            {/* --- Dropdown pemilih line chart --- */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer"
              >
                <span className="flex -space-x-1">
                  {chartSelectedIds.slice(0, 3).map((id) => {
                    const rt = RICE_TYPES.find((r) => r.id === id)!;
                    return (
                      <span
                        key={id}
                        className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-800"
                        style={{ backgroundColor: rt.color }}
                      />
                    );
                  })}
                </span>
                {chartSelectedIds.length === 0
                  ? "Pilih Jenis Beras"
                  : `${chartSelectedIds.length} Line Ditampilkan`}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-200/70 dark:ring-slate-700/70 p-2">
                  <div className="flex items-center justify-between px-1.5 py-1 text-xs">
                    <span className="text-slate-500">Bandingkan hingga 6 jenis</span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-green-700 dark:text-green-400 hover:underline cursor-pointer"
                        onClick={() => setChartSelectedIds(ALL_TYPE_IDS)}
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        className="text-slate-500 hover:underline cursor-pointer"
                        onClick={() => setChartSelectedIds([])}
                      >
                        Bersihkan
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 max-h-64 overflow-y-auto">
                    {RICE_TYPES.map((rt) => (
                      <label
                        key={rt.id}
                        className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                      >
                        <Checkbox
                          checked={chartSelectedIds.includes(rt.id)}
                          onCheckedChange={() => toggleChartType(rt.id)}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: rt.color }}
                        />
                        <span className="text-slate-700 dark:text-slate-200">{rt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2 space-y-4">
          {chartSelectedIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-10 text-center">
              <Info className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Belum ada jenis beras yang dipilih. Buka dropdown di atas lalu pilih
                minimal satu jenis untuk menampilkan grafik.
              </p>
              <button
                type="button"
                onClick={() => setChartSelectedIds(ALL_TYPE_IDS)}
                className="text-xs font-medium text-green-700 dark:text-green-400 hover:underline cursor-pointer"
              >
                Pilih Semua Jenis
              </button>
            </div>
          ) : (
            <>
              <div className="h-[420px] md:h-[480px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rows} margin={{ top: 10, right: 24, left: 8, bottom: 8 }}>
                    <defs>
                      {chartInfos.map((info) => (
                        <linearGradient
                          key={`grad-${info.type.id}`}
                          id={`grad-${info.type.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={info.type.color} stopOpacity={0.32} />
                          <stop offset="100%" stopColor={info.type.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="weekKey"
                      tickFormatter={(key: string) => {
                        const row = rows.find((r) => r.weekKey === key);
                        return row?.label ?? key;
                      }}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(v) => formatRupiah(v)}
                      domain={yDomain as [number, number]}
                      width={95}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<RiceTooltip infos={chartInfos} rangeLookup={rangeLookup} />} />

                    {boundaryKey && (
                      <ReferenceLine
                        x={boundaryKey}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        label={{
                          value: "Sekarang → Prediksi",
                          position: "insideTopRight",
                          fill: "#64748b",
                          fontSize: 11,
                        }}
                      />
                    )}

                    {chartInfos.map((info) => (
                      <React.Fragment key={info.type.id}>
                        <Area
                          dataKey={`hist_${info.type.id}`}
                          name={info.type.label}
                          type="monotone"
                          stroke={info.type.color}
                          strokeWidth={2.5}
                          fill={`url(#grad-${info.type.id})`}
                          dot={{ r: 3, strokeWidth: 0, fill: info.type.color }}
                          activeDot={{ r: 6 }}
                          connectNulls
                          legendType="none"
                          isAnimationActive
                        />
                        <Line
                          dataKey={`pred_${info.type.id}`}
                          type="monotone"
                          stroke={info.type.colorPrediction}
                          strokeWidth={2.5}
                          strokeDasharray="7 5"
                          dot={{ r: 5, strokeWidth: 2, stroke: info.type.colorPrediction, fill: "white" }}
                          activeDot={{ r: 7 }}
                          connectNulls
                          legendType="none"
                          isAnimationActive
                        />
                      </React.Fragment>
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* --- Legenda kustom --- */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs md:text-sm">
                {chartInfos.map((info) => (
                  <div key={info.type.id} className="flex items-center gap-2">
                    <span className="w-6 h-0.5 rounded" style={{ backgroundColor: info.type.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{info.type.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-slate-400 ml-auto">
                  <span className="w-6 border-t-2 border-slate-400" />
                  <span>Historis (mingguan)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span
                    className="w-6 border-t-2 border-dashed border-slate-400"
                    style={{ display: "inline-block" }}
                  />
                  <span>Prediksi ({PREDICTION_WEEKS} minggu, LSTM Hybrid)</span>
                </div>
                {chartInfos.length > 1 && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Activity className="w-3.5 h-3.5" />
                    Volatilitas rata-rata: {avgVolatilityChart.toFixed(1)}%
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Data historis bersumber dari BI Harga Pangan (bi.go.id/hargapangan).
                {errorMsg
                  ? " Prediksi tidak tersedia saat ini karena service prediksi tidak dapat dihubungi; grafik menampilkan data historis saja."
                  : " Hasil prediksi merupakan estimasi model dan dapat berbeda dari kondisi aktual di lapangan."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip kustom
// ---------------------------------------------------------------------------

function RiceTooltip({
  active,
  payload,
  label,
  infos,
  rangeLookup,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  infos: TypeChartInfo[];
  rangeLookup: Record<string, string>;
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const isFuture = label.startsWith(FUTURE_KEY_PREFIX);

  return (
    <div className="rounded-lg border bg-white dark:bg-slate-900 shadow-lg p-3 text-xs md:text-sm min-w-[200px]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="font-semibold text-slate-700 dark:text-slate-100">
          {rangeLookup[label] ?? label}
        </span>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            isFuture ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isFuture ? "Prediksi" : "Historis"}
        </span>
      </div>
      <div className="space-y-1.5">
        {infos.map((info) => {
          const histKey = `hist_${info.type.id}`;
          const predKey = `pred_${info.type.id}`;
          const histEntry = payload.find((p) => p.dataKey === histKey);
          const predEntry = payload.find((p) => p.dataKey === predKey);
          const value = isFuture ? predEntry?.value : histEntry?.value ?? predEntry?.value;
          if (value === undefined || value === null) return null;
          const week = isFuture
            ? info.predictedWeeks.find((w) => w.weekKey === label)
            : undefined;
          const confidence = week?.confidence;
          const lstmWeight = info.prediction?.lstm_weight;
          const confidenceLabel =
            confidence !== undefined
              ? `keyakinan ${confidence <= 1 ? Math.round(confidence * 100) : confidence}%`
              : undefined;
          return (
            <div key={info.type.id} className="space-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isFuture ? info.type.colorPrediction : info.type.color }}
                  />
                  <span className="truncate text-slate-600 dark:text-slate-300">{info.type.label}</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-white shrink-0">
                  {formatRupiah(value)}
                </span>
              </div>
              {isFuture && lstmWeight !== undefined && (
                <p className="text-[10px] text-slate-400 pl-3">
                  bobot LSTM {(lstmWeight * 100).toFixed(0)}%
                  {confidenceLabel ? ` · ${confidenceLabel}` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}