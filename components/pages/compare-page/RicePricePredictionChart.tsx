/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
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
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
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
  generateDummyDailyPrices,
  aggregateWeekly,
  computeVolatility,
  predictRicePrices,
} from "@/lib/rice-price/api";

// ---------------------------------------------------------------------------
// Konfigurasi
// ---------------------------------------------------------------------------

const HISTORY_WEEKS = 8;
const DAILY_DAYS = 63
const FEED_DAYS = 61; // jumlah hari terakhir yang dikirim sbg `last_prices` ke API
const PREDICTION_HORIZON_DAYS = 7; // "1 minggu ke depan"

const FUTURE_KEY = "future";

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

interface TypeChartInfo {
  type: RiceTypeOption;
  daily: DailyPricePoint[];
  weekly: WeeklyPoint[];
  prediction?: RicePricePredictionResult;
  predictedWeekAvg?: number;
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

export default function RicePricePredictionChart() {
  // Tanggal jangkar: "kemarin", supaya konsisten dgn contoh payload API
  const anchorDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Data harian dummy untuk SEMUA jenis beras, dibangun sekali (deterministik)
  const dailyByType = useMemo(() => {
    const map: Record<string, DailyPricePoint[]> = {};
    RICE_TYPES.forEach((rt) => {
      map[rt.id] = generateDummyDailyPrices(rt, DAILY_DAYS, anchorDate);
    });
    return map;
  }, [anchorDate]);

  // Agregasi mingguan (semua jenis punya window tanggal yg sama -> weekKey selaras)
  const weeklyByType = useMemo(() => {
    const map: Record<string, WeeklyPoint[]> = {};
    RICE_TYPES.forEach((rt) => {
      map[rt.id] = aggregateWeekly(dailyByType[rt.id]);
    });
    return map;
  }, [dailyByType]);

  const [selectedIds, setSelectedIds] = useState<string[]>([
    RICE_TYPES[0].id,
    RICE_TYPES[2].id,
    RICE_TYPES[4].id,
  ]);
  const [predictions, setPredictions] = useState<Record<string, RicePricePredictionResult>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (selectedIds.length === 0) {
      setPredictions({});
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const items = selectedIds.map((id) => {
      const type = RICE_TYPES.find((rt) => rt.id === id)!;
      const daily = dailyByType[id];
      const feed = daily.slice(-FEED_DAYS);
      return {
        rice_type: type.label,
        last_prices: feed.map((d) => d.price),
        last_price_date: feed[feed.length - 1].date,
      };
    });

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
          `Tidak dapat terhubung ke API prediksi di ${ML_API_BASE_URL}. Pastikan service ML Hybrid LSTM sedang berjalan. Grafik akan menampilkan data historis saja untuk sementara. (${
            err instanceof Error ? err.message : "unknown error"
          })`
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIds, dailyByType]);

  const chartInfos: TypeChartInfo[] = useMemo(() => {
    return selectedIds
      .map((id) => RICE_TYPES.find((rt) => rt.id === id)!)
      .filter(Boolean)
      .map((type) => {
        const daily = dailyByType[type.id];
        const weekly = weeklyByType[type.id];
        const prediction = predictions[type.id];
        let predictedWeekAvg: number | undefined;
        let predictedRangeLabel: string | undefined;
        if (prediction && prediction.predictions.length > 0) {
          const horizon = prediction.predictions.slice(0, PREDICTION_HORIZON_DAYS);
          predictedWeekAvg =
            horizon.reduce((s, p) => s + p.predicted_price, 0) / horizon.length;
          predictedRangeLabel = `${formatDateShort(horizon[0].target_date)} – ${formatDateShort(
            horizon[horizon.length - 1].target_date
          )}`;
        }
        return {
          type,
          daily,
          weekly,
          prediction,
          predictedWeekAvg,
          predictedRangeLabel,
          historicalVolatility: computeVolatility(weekly.map((w) => w.avgPrice)),
        };
      });
  }, [selectedIds, dailyByType, weeklyByType, predictions]);

  // ---------------------------------------------------------------------------
  // Susun data grafik gabungan (historis + 1 titik prediksi mingguan)
  // ---------------------------------------------------------------------------
  const { rows, boundaryKey, rangeLookup } = useMemo(() => {
    const referenceWeekly = chartInfos[0]?.weekly ?? weeklyByType[RICE_TYPES[0].id];
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
          row[`pred_${info.type.id}`] = point.avgPrice; // penyambung garis
        }
      });
      return row;
    });

    const hasAnyPrediction = chartInfos.some((info) => info.predictedWeekAvg !== undefined);
    const futureRow: ChartRow | null = hasAnyPrediction
      ? {
          weekKey: FUTURE_KEY,
          label: "Minggu Depan",
          rangeLabel: "Prediksi 7 hari ke depan",
          isFuture: true,
        }
      : null;

    if (futureRow) {
      chartInfos.forEach((info) => {
        if (info.predictedWeekAvg !== undefined) {
          futureRow[`pred_${info.type.id}`] = info.predictedWeekAvg;
        }
      });
      rangeMap[FUTURE_KEY] = futureRow.rangeLabel;
    }

    const boundary = referenceWeekly[referenceWeekly.length - 1]?.weekKey ?? "";

    return {
      rows: futureRow ? [...historicalRows, futureRow] : historicalRows,
      boundaryKey: boundary,
      rangeLookup: rangeMap,
    };
  }, [chartInfos, weeklyByType]);

  const avgVolatility =
    chartInfos.length > 0
      ? chartInfos.reduce((s, i) => s + i.historicalVolatility, 0) / chartInfos.length
      : 0;

  const toggleType = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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

  return (
    <Card className="overflow-hidden border-green-100 dark:border-green-900/40 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-green-50 via-white to-amber-50 dark:from-green-950/30 dark:via-slate-900 dark:to-amber-950/20">
        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Wheat className="w-5 h-5 text-green-600" />
          Prediksi Harga Beras Mingguan
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Model memprediksi harga beras secara <strong>harian</strong> menggunakan LSTM
          Hybrid; grafik ini menampilkan hasilnya sebagai <strong>rata-rata mingguan</strong> —
          {" "}
          {HISTORY_WEEKS} minggu historis (data sementara) tersambung dengan proyeksi{" "}
          <strong>1 minggu ke depan</strong> dari API prediksi.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* --- Pemilih jenis beras --- */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Pilih Jenis Beras (bisa lebih dari satu untuk membandingkan)
            </p>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="text-green-700 dark:text-green-400 hover:underline"
                onClick={() => setSelectedIds(RICE_TYPES.map((r) => r.id))}
              >
                Pilih Semua
              </button>
              <button
                type="button"
                className="text-slate-500 hover:underline"
                onClick={() => setSelectedIds([])}
              >
                Bersihkan
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {RICE_TYPES.map((rt) => {
              const active = selectedIds.includes(rt.id);
              return (
                <button
                  type="button"
                  key={rt.id}
                  onClick={() => toggleType(rt.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm font-medium transition-all ${
                    active
                      ? "shadow-sm text-white border-transparent"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  }`}
                  style={active ? { backgroundColor: rt.color } : undefined}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: active ? "white" : rt.color }}
                  />
                  {rt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Info galat / status --- */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {selectedIds.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500">
            <Info className="w-4 h-4" />
            Pilih minimal satu jenis beras untuk menampilkan grafik.
          </div>
        )}

        {/* --- Kartu ringkasan per jenis beras --- */}
        {chartInfos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chartInfos.map((info) => {
              const last = info.weekly[info.weekly.length - 1]?.avgPrice;
              const pred = info.predictedWeekAvg;
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: info.type.color }}
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {info.type.label}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tier.className}`}
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
                      <p className="text-[11px] text-slate-400">Prediksi Depan</p>
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

            {chartInfos.length > 1 && (
              <div className="rounded-xl border border-dashed border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-semibold">
                  <Activity className="w-4 h-4" />
                  Volatilitas Rata-rata
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                  {avgVolatility.toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Rata-rata koefisien variasi harga mingguan dari {chartInfos.length} jenis beras
                  yang dipilih.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- Grafik --- */}
        {rows.length > 0 && chartInfos.length > 0 && (
          <div className="h-[440px] w-full">
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
                      <stop offset="0%" stopColor={info.type.color} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={info.type.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
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
                      value: "Sekarang · Prediksi ▶",
                      position: "insideTopRight",
                      fill: "#64748b",
                      fontSize: 11,
                    }}
                  />
                )}

                {chartInfos.map((info) => (
                  <React.Fragment key={info.type.id}>
                    <Line
                      dataKey={`hist_${info.type.id}`}
                      name={info.type.label}
                      type="natural"
                      stroke={info.type.color}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 0, fill: info.type.color }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      legendType="none"
                      isAnimationActive
                    />
                    <Line
                      dataKey={`pred_${info.type.id}`}
                      type="natural"
                      stroke={info.type.colorPrediction}
                      strokeWidth={3}
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
        )}

        {/* --- Legenda kustom --- */}
        {chartInfos.length > 0 && (
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
              <span>Prediksi (LSTM Hybrid)</span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Data historis pada grafik ini masih bersifat sementara (dummy) dan akan digantikan
          data historis resmi. Nilai prediksi diambil langsung dari API{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{ML_API_BASE_URL}</code>.
        </p>
      </CardContent>
    </Card>
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

  const isFuture = label === FUTURE_KEY;

  return (
    <div className="rounded-lg border bg-white dark:bg-slate-900 shadow-lg p-3 text-xs md:text-sm min-w-[200px]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="font-semibold text-slate-700 dark:text-slate-100">
          {rangeLookup[label] ?? label}
        </span>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            isFuture
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-600"
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
          return (
            <div key={info.type.id} className="flex items-center justify-between gap-3">
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
          );
        })}
      </div>
    </div>
  );
}
