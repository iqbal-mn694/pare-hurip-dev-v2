/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle, Loader2, Sprout, X } from "lucide-react";

import {
  DISTRICT_LIST,
  DistrictOption,
  DistrictSeries,
  AGGREGATE_VALUE,
  getSubsegmentOptions,
  getDistrictColor,
  loadDistrictSeries,
  phaseLabel,
  phaseNormalizedPosition,
} from "@/lib/planting-phase/data";
import { getPhaseColor } from "@/lib/planting-phase/constants";
import { useIsMobile } from "@/lib/use-media-query";

// Height of each district "lane" (band) within the chart, in Y-axis units.
const BAND_HEIGHT = 120;

// Phase color legend (square swatches) used in the note below the chart.
const PHASE_LEGEND: { value: number; label: string }[] = [
  { value: 1, label: "Vegetatif 1" },
  { value: 2, label: "Vegetatif 2" },
  { value: 3.1, label: "Generatif 1" },
  { value: 3.2, label: "Generatif 2" },
  { value: 3.3, label: "Generatif 3" },
  { value: 4, label: "Panen" },
  { value: 5, label: "Persiapan Lahan" },
  { value: 6, label: "Puso" },
];

interface Loadable {
  series?: DistrictSeries;
  loading: boolean;
  error?: string;
}

/** Build chart rows from the loaded series: one row per month with
 * per-district band values (history & prediction) plus meta for the tooltip. */
function buildChartRows(
  readySeries: DistrictSeries[],
  selectedCodes: string[]
): { rows: any[]; boundaryLabel: string | null; monthLabels: string[] } {
  if (readySeries.length === 0) {
    return { rows: [], boundaryLabel: null, monthLabels: [] };
  }

  const total = readySeries.length;
  const pointCount = readySeries[0].points.length;
  const historyLength = readySeries[0].points.filter((p) => p.kind === "historical").length;

  const months = readySeries[0].points.map((p) => p.monthLabel);
  const out: any[] = [];

  for (let t = 0; t < pointCount; t++) {
    const row: any = { monthLabel: months[t] };
    readySeries.forEach((series, i) => {
      const key = `k${i}`;
      const point = series.points[t];
      if (!point) return;
      const normalized = phaseNormalizedPosition(point.phase);
      const bandValue = (total - 1 - i) * BAND_HEIGHT + normalized * BAND_HEIGHT;

      row[`${key}_hist`] = t < historyLength ? bandValue : null;
      row[`${key}_pred`] = t >= historyLength - 1 ? bandValue : null;
      row[`${key}_meta`] = {
        phase: point.phase,
        kind: point.kind,
        confidence: point.confidence,
        label: phaseLabel(point.phase),
        name: series.districtName,
        subsegment: series.subsegment,
        color: getDistrictColor(selectedCodes[i]),
      };
    });
    out.push(row);
  }

  return {
    rows: out,
    boundaryLabel: months[historyLength - 1] ?? null,
    monthLabels: months,
  };
}

export default function PlantingPhaseChart() {
  const isMobile = useIsMobile();
  // array order = band stacking order (first selected is on top)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [subsegmentByCode, setSubsegmentByCode] = useState<Record<string, string>>({});
  const [dataByCode, setDataByCode] = useState<Record<string, Loadable>>({});
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());
  const [subsegmentOptions, setSubsegmentOptions] = useState<Record<string, string[]>>({});
  const [optionsLoading, setOptionsLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(async (district: DistrictOption, subsegment: string) => {
    setDataByCode((prev) => ({
      ...prev,
      [district.code]: { ...prev[district.code], loading: true, error: undefined },
    }));
    try {
      const series = await loadDistrictSeries(district, subsegment);
      setDataByCode((prev) => ({ ...prev, [district.code]: { series, loading: false } }));
    } catch (e: any) {
      setDataByCode((prev) => ({
        ...prev,
        [district.code]: { loading: false, error: e?.message ?? "Gagal memuat prediksi" },
      }));
    }
  }, []);

  const loadSubsegmentOptions = useCallback(async (districtCode: string) => {
    setOptionsLoading((prev) => ({ ...prev, [districtCode]: true }));
    try {
      const opts = await getSubsegmentOptions(districtCode);
      setSubsegmentOptions((prev) => ({ ...prev, [districtCode]: opts }));
    } catch {
      setSubsegmentOptions((prev) => ({ ...prev, [districtCode]: [] }));
    }
    setOptionsLoading((prev) => ({ ...prev, [districtCode]: false }));
  }, []);

  const handleToggle = async (district: DistrictOption, checked: boolean) => {
    if (checked) {
      setSelectedCodes((prev) => [...prev, district.code]);
      setSubsegmentByCode((prev) => ({ ...prev, [district.code]: AGGREGATE_VALUE }));
      void load(district, AGGREGATE_VALUE);
      // Fetch subsegment options dynamically from the database
      void loadSubsegmentOptions(district.code);
    } else {
      setSelectedCodes((prev) => prev.filter((c) => c !== district.code));
      setHiddenCodes((prev) => {
        const next = new Set(prev);
        next.delete(district.code);
        return next;
      });
    }
  };

  const handleSelectAll = () => {
    DISTRICT_LIST.forEach((district) => {
      if (!selectedCodes.includes(district.code)) void handleToggle(district, true);
    });
  };

  const handleReset = () => {
    setSelectedCodes([]);
    setSubsegmentByCode({});
    setDataByCode({});
    setHiddenCodes(new Set());
    setSubsegmentOptions({});
    setOptionsLoading({});
  };

  const handleSubsegmentChange = (district: DistrictOption, value: string) => {
    setSubsegmentByCode((prev) => ({ ...prev, [district.code]: value }));
    void load(district, value);
  };

  const toggleHidden = (code: string) => {
    setHiddenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectedDistricts = selectedCodes
    .map((code) => DISTRICT_LIST.find((k) => k.code === code))
    .filter((k): k is DistrictOption => Boolean(k));

  const readySeries = selectedDistricts
    .map((k) => dataByCode[k.code]?.series)
    .filter((s): s is DistrictSeries => Boolean(s && s.points.length > 0));

  const isAnyLoading = selectedCodes.some((c) => dataByCode[c]?.loading);

  // ---------------------------------------------------------------------
  // Transform history+prediction data -> chart rows with per-district bands
  // ---------------------------------------------------------------------
  const { rows, boundaryLabel, monthLabels } = useMemo(
    () => buildChartRows(readySeries, selectedCodes),
    [readySeries, selectedCodes]
  );

  const totalBands = readySeries.length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
          Prediksi <span className="text-green-600 dark:text-green-500">Fase Tanam</span> per
          Kecamatan
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          Bandingkan tren historis dan hasil prediksi fase tanam antar
          kecamatan yang dipilih.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* --- Filter Panel --- */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            Filter Kecamatan
          </CardTitle>
          <CardDescription>
            Centang kecamatan yang ingin dibandingkan, lalu atur subsegmennya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {DISTRICT_LIST.map((district) => {
              const checked = selectedCodes.includes(district.code);
              return (
                <div
                  key={district.code}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-green-50/60"
                >
                  <Checkbox
                    id={`district-${district.code}`}
                    checked={checked}
                    onCheckedChange={(v) => handleToggle(district, Boolean(v))}
                  />
                  <Label
                    htmlFor={`district-${district.code}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: getDistrictColor(district.code) }}
                    />
                    {district.name}
                  </Label>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={selectedCodes.length === DISTRICT_LIST.length}
              className="text-xs font-medium text-green-700 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400 hover:underline cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pilih Semua
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={selectedCodes.length === 0}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedCodes.length}/{DISTRICT_LIST.length} terpilih
            </span>
          </div>

          {/* Subsegment selectors: shown per checked district */}
          {selectedDistricts.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Subsegmen per kecamatan
              </p>
              {selectedDistricts.map((district) => {
                const value = subsegmentByCode[district.code] ?? AGGREGATE_VALUE;
                const options = subsegmentOptions[district.code] ?? [];
                const state = dataByCode[district.code];
                const loadingOpts = optionsLoading[district.code];
                return (
                  <div key={district.code} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: getDistrictColor(district.code) }}
                    />
                    <span className="text-xs w-20 truncate">{district.name}</span>
                    <Select
                      value={value}
                      onValueChange={(v) => handleSubsegmentChange(district, v)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AGGREGATE_VALUE}>
                          Aggregate (rata-rata)
                        </SelectItem>
                        {loadingOpts ? (
                          <SelectItem value="__loading__" disabled>
                            Memuat subsegmen...
                          </SelectItem>
                        ) : (
                          options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              Subsegmen {opt}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {(state?.loading || loadingOpts) && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Chart --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prediksi Fase Tanam</CardTitle>
          <CardDescription>
            Data historis dari database dan 3 bulan hasil prediksi model,
            ditampilkan per kecamatan dalam satu grafik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-8 rounded-full bg-foreground/70" />
              Historis
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-8 border-t-2 border-dashed border-foreground/70" />
              Prediksi 3 bulan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
              Titik data
            </span>
          </div>

          {selectedDistricts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/50">
                <Sprout className="h-7 w-7 text-green-700 dark:text-green-500" />
              </span>
              <p className="text-sm max-w-sm">
                Pilih minimal satu kecamatan pada panel di samping untuk
                menampilkan grafik prediksi.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Klik nama kecamatan pada daftar filter untuk mulai membandingkan.
              </p>
            </div>
          ) : (
            <>
              {/* Interactive legend (click to hide/show lines) */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedDistricts.map((district) => {
                  const hidden = hiddenCodes.has(district.code);
                  const series = dataByCode[district.code]?.series;
                  return (
                    <button
                      key={district.code}
                      onClick={() => toggleHidden(district.code)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-opacity cursor-pointer hover:border-green-300 ${
                        hidden ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: getDistrictColor(district.code) }}
                      />
                      {district.name}
                      <span className="text-muted-foreground">
                        ({series?.subsegment === AGGREGATE_VALUE
                          ? "Aggregate"
                          : series?.subsegment ?? "-"}
                        )
                      </span>
                      <X className="h-3 w-3 opacity-60" />
                    </button>
                  );
                })}
              </div>

              {/* Per-district data load status */}
              {selectedDistricts.map((district) => {
                const series = dataByCode[district.code]?.series;
                if (!series) return null;
                if (series.historyError) {
                  return (
                    <div
                      key={district.code}
                      className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                    >
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <p className="font-medium">
                          {district.name} — Gagal memuat data historis
                        </p>
                        <p className="mt-0.5 text-red-600/90 dark:text-red-400/90">
                          {series.historyError} Periksa koneksi database lalu pilih
                          ulang kecamatan ini.
                        </p>
                      </div>
                    </div>
                  );
                }
                if (series.predictionError) {
                  return (
                    <div
                      key={district.code}
                      className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <p className="font-medium">
                          {district.name} — Histori tampil, prediksi gagal
                        </p>
                        <p className="mt-0.5 text-amber-600/90 dark:text-amber-400/90">
                          {series.predictionError} Grafik hanya menampilkan data
                          historis.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {isAnyLoading && readySeries.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                  <p className="text-sm max-w-sm">Memuat data fase tanam...</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Mengambil data historis dan menjalankan prediksi model.
                  </p>
                </div>
              ) : readySeries.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground gap-3">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
                    <AlertCircle className="h-7 w-7 text-red-600" />
                  </span>
                  <p className="text-sm max-w-sm">
                    Tidak ada data yang dapat ditampilkan untuk kecamatan terpilih.
                  </p>
                </div>
              ) : (
                <>
              <div className="relative w-full" style={{ height: Math.max(300, totalBands * 150) }}>
                {/* Phase scale labels on the right */}
                <div className="pointer-events-none absolute inset-y-0 right-3 top-2 bottom-8 flex flex-col justify-between">
                  {readySeries.map((series, i) => (
                    <span
                      key={i}
                      className="flex flex-col justify-between text-[8px] leading-none text-muted-foreground/50 py-0.5"
                      style={{ height: BAND_HEIGHT }}
                    >
                      <span>Pn</span>
                      <span>G3</span>
                      <span>G2</span>
                      <span>G1</span>
                      <span>V2</span>
                      <span>V1</span>
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rows} margin={{ top: 24, right: isMobile ? 40 : 56, left: 32, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="var(--color-border)" strokeOpacity={0.15} />

                    {/* Alternating band backgrounds */}
                    {Array.from({ length: totalBands }).map((_, i) => (
                      <ReferenceArea
                        key={`band-bg-${i}`}
                        y1={i * BAND_HEIGHT}
                        y2={(i + 1) * BAND_HEIGHT}
                        fill="var(--color-muted)"
                        fillOpacity={i % 2 === 1 ? 0 : 0.3}
                      />
                    ))}

                    {/* Prediction area (soft highlight) */}
                    {boundaryLabel && (
                      <ReferenceArea
                        x1={boundaryLabel}
                        x2={monthLabels[monthLabels.length - 1]}
                        y1={0}
                        y2={totalBands * BAND_HEIGHT}
                        fill="var(--color-primary)"
                        fillOpacity={0.04}
                      />
                    )}

                    {/* History → prediction separator */}
                    {boundaryLabel && (
                      <ReferenceLine
                        x={boundaryLabel}
                        stroke="var(--color-muted-foreground)"
                        strokeDasharray="6 4"
                        strokeOpacity={0.8}
                        label={{
                          value: "Sekarang → Prediksi",
                          position: "top",
                          fontSize: 11,
                          fill: "var(--color-muted-foreground)",
                        }}
                      />
                    )}

                    {/* Boundary lines & labels for each district band */}
                    {Array.from({ length: totalBands + 1 }).map((_, idx) => (
                      <ReferenceLine
                        key={`band-line-${idx}`}
                        y={idx * BAND_HEIGHT}
                        stroke="var(--color-border)"
                        strokeOpacity={0.6}
                        strokeDasharray={idx === 0 || idx === totalBands ? "0" : "4 4"}
                      />
                    ))}

                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: isMobile ? 10 : 11 }}
                      minTickGap={isMobile ? 20 : 8}
                      axisLine={{ stroke: "var(--color-border)" }}
                    />
                    <YAxis
                      domain={[0, totalBands * BAND_HEIGHT]}
                      hide
                    />

                    <Tooltip content={<PhaseTooltip totalBands={totalBands} />} />

                    {readySeries.map((series, i) => {
                      const key = `k${i}`;
                      const code = selectedCodes[i];
                      const color = getDistrictColor(code);
                      const isHidden = hiddenCodes.has(code);
                      return (
                        <React.Fragment key={key}>
                          <Line
                            dataKey={`${key}_hist`}
                            stroke={color}
                            strokeWidth={isHidden ? 1 : 2.5}
                            strokeOpacity={isHidden ? 0.15 : 1}
                            type="monotone"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dot={(props) => renderDot(props, color, isHidden)}
                            activeDot={{ r: 5 }}
                            isAnimationActive
                            animationDuration={600}
                            name={series.districtName}
                          />
                          <Line
                            dataKey={`${key}_pred`}
                            stroke={color}
                            strokeWidth={isHidden ? 1 : 2.5}
                            strokeOpacity={isHidden ? 0.15 : 1}
                            strokeDasharray="6 4"
                            type="monotone"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dot={(props) => renderDot(props, color, isHidden, true)}
                            activeDot={{ r: 6 }}
                            isAnimationActive
                            animationDuration={600}
                            connectNulls
                            legendType="none"
                          />
                        </React.Fragment>
                      );
                    })}
                  </ComposedChart>
                </ResponsiveContainer>

                {/* District name labels in each lane (band) */}
                <div className="pointer-events-none absolute inset-y-0 left-3 top-2 bottom-8 flex flex-col justify-between">
                  {readySeries.map((series, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-background/80 border w-fit"
                      style={{ color: getDistrictColor(selectedCodes[i]) }}
                    >
                      {series.districtName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick summary for lay users */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {readySeries.map((series, i) => {
                  const nextPrediction = series.points.find((p) => p.kind === "prediction");
                  if (!nextPrediction) return null;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border p-2.5 text-xs"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: getDistrictColor(selectedCodes[i]) }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{series.districtName}</p>
                        <p className="text-muted-foreground truncate">
                          Bulan depan: {phaseLabel(nextPrediction.phase)}
                          {typeof nextPrediction.confidence === "number" &&
                            ` · ${Math.round(nextPrediction.confidence * 100)}% yakin`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg border bg-muted/30 p-3.5 space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {PHASE_LEGEND.map((item) => (
                    <span
                      key={item.value}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-[3px] ring-1 ring-black/10 shrink-0"
                        style={{ background: getPhaseColor(item.value) }}
                      />
                      {item.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground border-t border-slate-200/70 pt-3">
                  Garis utuh menampilkan data historis, sedangkan garis putus-putus menunjukkan prediksi 3 bulan ke depan.
                </p>
              </div>

              {isAnyLoading && (
                <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                  Memuat prediksi terbaru…
                </p>
              )}
              </>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom dot: solid dot for history, ring-shaped dot for prediction
// ---------------------------------------------------------------------------
function renderDot(props: any, color: string, hidden: boolean, isPrediction = false) {
  const { cx, cy, value } = props;
  if (value === null || value === undefined || cx === undefined) return <g key={props.key} />;
  if (isPrediction) {
    return (
      <circle
        key={props.key}
        cx={cx}
        cy={cy}
        r={4.5}
        fill="var(--color-background)"
        stroke={color}
        strokeWidth={2}
        opacity={hidden ? 0.15 : 1}
      />
    );
  }
  return (
    <circle
      key={props.key}
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      opacity={hidden ? 0.15 : 1}
    />
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip: shows every district active at that x point,
// with the phase name (not the raw number) and confidence for predictions.
// ---------------------------------------------------------------------------
const phaseColors: Record<string, string> = {
  "1": "#3E5F44", "2": "#5E936C", "3.1": "#93DA97", "3.2": "#B5E8B8",
  "3.3": "#DAF5DB", "4": "#FED16A", "5": "#A16D28", "6": "#101010",
};

function PhaseTooltip({ active, payload, label, totalBands }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload ?? {};
  const seen = new Set<string>();
  const items: any[] = [];

  for (let i = 0; i < totalBands; i++) {
    const meta = row[`k${i}_meta`];
    if (!meta || seen.has(meta.name + meta.subsegment)) continue;
    seen.add(meta.name + meta.subsegment);
    items.push(meta);
  }

  return (
    <div className="rounded-lg border shadow-md p-3 text-xs min-w-45"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <p className="font-semibold mb-2" style={{ color: "var(--color-card-foreground)" }}>{label}</p>
      <div className="space-y-1.5">
        {items.map((meta, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span
              className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: meta.color }}
            />
            <div>
              <p className="font-medium" style={{ color: "var(--color-card-foreground)" }}>
                {meta.name}{" "}
                <span className="font-normal" style={{ color: "var(--color-muted-foreground)" }}>
                  ({meta.subsegment === "aggregate" ? "Aggregate" : meta.subsegment})
                </span>
              </p>
              <p style={{ color: "var(--color-muted-foreground)" }}>
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                  style={{ background: phaseColors[String(meta.phase)] ?? "#78909C" }}
                />
                {meta.label}
                <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                  style={{ background: "var(--color-muted)" }}>
                  {meta.kind === "prediction" ? "Prediksi" : "Historis"}
                </span>
                {meta.kind === "prediction" && typeof meta.confidence === "number" && (
                  <span className="ml-1 rounded px-1 py-0.5"
                    style={{ background: "var(--color-primary)", opacity: 0.1, color: "var(--color-primary)" }}>
                    {Math.round(meta.confidence * 100)}% yakin
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
