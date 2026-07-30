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
import { Loader2, Sprout, X, Info } from "lucide-react";

import {
  KECAMATAN_LIST,
  KecamatanOption,
  KecamatanSeries,
  AGGREGATE_VALUE,
  getSubsegmentOptions,
  getKecamatanColor,
  loadKecamatanSeries,
  phaseLabel,
  phaseNormalizedPosition,
} from "@/lib/fase-tanam/data";

// Tinggi "lajur" (band) tiap kecamatan di dalam satu chart, dalam unit sumbu-Y.
const BAND_HEIGHT = 120;

interface Loadable {
  series?: KecamatanSeries;
  loading: boolean;
  error?: string;
}

export default function FaseTanamChart() {
  // urutan array = urutan tumpukan band (yang dipilih duluan di paling atas)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [subsegmentByCode, setSubsegmentByCode] = useState<Record<string, string>>({});
  const [dataByCode, setDataByCode] = useState<Record<string, Loadable>>({});
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());
  const [subsegmentOptions, setSubsegmentOptions] = useState<Record<string, string[]>>({});
  const [optionsLoading, setOptionsLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(async (kec: KecamatanOption, subsegment: string) => {
    setDataByCode((prev) => ({
      ...prev,
      [kec.code]: { ...prev[kec.code], loading: true, error: undefined },
    }));
    try {
      const series = await loadKecamatanSeries(kec, subsegment);
      setDataByCode((prev) => ({ ...prev, [kec.code]: { series, loading: false } }));
    } catch (e: any) {
      setDataByCode((prev) => ({
        ...prev,
        [kec.code]: { loading: false, error: e?.message ?? "Gagal memuat prediksi" },
      }));
    }
  }, []);

  const handleToggle = (kec: KecamatanOption, checked: boolean) => {
    if (checked) {
      setSelectedCodes((prev) => [...prev, kec.code]);
      setSubsegmentByCode((prev) => ({ ...prev, [kec.code]: AGGREGATE_VALUE }));
      void load(kec, AGGREGATE_VALUE);
      // Fetch subsegmen options dinamis dari database
      setOptionsLoading((prev) => ({ ...prev, [kec.code]: true }));
      getSubsegmentOptions(kec.code).then((opts) => {
        setSubsegmentOptions((prev) => ({ ...prev, [kec.code]: opts }));
        setOptionsLoading((prev) => ({ ...prev, [kec.code]: false }));
      });
    } else {
      setSelectedCodes((prev) => prev.filter((c) => c !== kec.code));
      setHiddenCodes((prev) => {
        const next = new Set(prev);
        next.delete(kec.code);
        return next;
      });
    }
  };

  const handleSubsegmentChange = (kec: KecamatanOption, value: string) => {
    setSubsegmentByCode((prev) => ({ ...prev, [kec.code]: value }));
    void load(kec, value);
  };

  const toggleHidden = (code: string) => {
    setHiddenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectedKecamatan = selectedCodes
    .map((code) => KECAMATAN_LIST.find((k) => k.code === code))
    .filter((k): k is KecamatanOption => Boolean(k));

  const readySeries = selectedKecamatan
    .map((k) => dataByCode[k.code]?.series)
    .filter((s): s is KecamatanSeries => Boolean(s));

  const isAnyLoading = selectedCodes.some((c) => dataByCode[c]?.loading);

  // ---------------------------------------------------------------------
  // Transformasi data historis+prediksi -> baris chart dengan band per kecamatan
  // ---------------------------------------------------------------------
  const { rows, boundaryLabel, monthLabels } = useMemo(() => {
    if (readySeries.length === 0) {
      return { rows: [] as any[], boundaryLabel: null as string | null, monthLabels: [] as string[] };
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
          name: series.kecamatanName,
          subsegment: series.subsegment,
          color: getKecamatanColor(selectedCodes[i]),
        };
      });
      out.push(row);
    }

    return {
      rows: out,
      boundaryLabel: months[historyLength - 1] ?? null,
      monthLabels: months,
    };
  }, [readySeries, selectedCodes]);

  const totalBands = readySeries.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* --- Panel Filter --- */}
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
            {KECAMATAN_LIST.map((kec) => {
              const checked = selectedCodes.includes(kec.code);
              return (
                <div key={kec.code} className="flex items-center gap-2">
                  <Checkbox
                    id={`kec-${kec.code}`}
                    checked={checked}
                    onCheckedChange={(v) => handleToggle(kec, Boolean(v))}
                  />
                  <Label
                    htmlFor={`kec-${kec.code}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: getKecamatanColor(kec.code) }}
                    />
                    {kec.name}
                  </Label>
                </div>
              );
            })}
          </div>

          {/* Tabel subsegmen: muncul per kecamatan yang sudah dicentang */}
          {selectedKecamatan.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Subsegmen per kecamatan
              </p>
              {selectedKecamatan.map((kec) => {
                const value = subsegmentByCode[kec.code] ?? AGGREGATE_VALUE;
                const options = subsegmentOptions[kec.code] ?? [];
                const state = dataByCode[kec.code];
                const loadingOpts = optionsLoading[kec.code];
                return (
                  <div key={kec.code} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: getKecamatanColor(kec.code) }}
                    />
                    <span className="text-xs w-20 truncate">{kec.name}</span>
                    <Select
                      value={value}
                      onValueChange={(v) => handleSubsegmentChange(kec, v)}
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

          {selectedKecamatan.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground gap-2">
              <Info className="h-6 w-6" />
              <p className="text-sm">
                Pilih minimal satu kecamatan pada panel di samping untuk
                menampilkan grafik prediksi.
              </p>
            </div>
          ) : (
            <>
              {/* Legend interaktif (klik untuk sembunyikan/tampilkan garis) */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedKecamatan.map((kec) => {
                  const hidden = hiddenCodes.has(kec.code);
                  const series = dataByCode[kec.code]?.series;
                  return (
                    <button
                      key={kec.code}
                      onClick={() => toggleHidden(kec.code)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity ${
                        hidden ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: getKecamatanColor(kec.code) }}
                      />
                      {kec.name}
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
                  <ComposedChart data={rows} margin={{ top: 24, right: 56, left: 32, bottom: 16 }}>
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

                    {/* Area prediksi (soft highlight) */}
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

                    {/* Separator historis → prediksi */}
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

                    {/* Garis pembatas & label tiap band kecamatan */}
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
                      tick={{ fontSize: 11 }}
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
                      const color = getKecamatanColor(code);
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
                            name={series.kecamatanName}
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

                {/* Label nama kecamatan di tiap lajur (band) */}
                <div className="pointer-events-none absolute inset-y-0 left-3 top-2 bottom-8 flex flex-col justify-between">
                  {readySeries.map((series, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-background/80 border w-fit"
                      style={{ color: getKecamatanColor(selectedCodes[i]) }}
                    >
                      {series.kecamatanName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ringkasan singkat untuk pengguna awam */}
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
                        style={{ background: getKecamatanColor(selectedCodes[i]) }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{series.kecamatanName}</p>
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

              <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Skala fase mengikuti label model ML: Vegetatif 1, Vegetatif 2, Generatif 1, Generatif 2, Generatif 3, Panen, dan Persiapan Lahan. Garis solid menunjukkan data historis, lalu garis putus-putus menunjukkan 3 bulan prediksi.
              </div>

              {isAnyLoading && (
                <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Memuat prediksi terbaru…
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dot kustom: titik historis solid, titik prediksi berbentuk cincin
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
// Tooltip kustom: menampilkan tiap kecamatan yang aktif di titik-x tersebut,
// dengan nama fase (bukan angka mentah) dan tingkat keyakinan untuk prediksi.
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
