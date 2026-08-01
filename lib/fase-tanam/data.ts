/**
 * Modul data & API untuk halaman "Fase Tanam".
 *
 * Tanggung jawab file ini:
 * 1. Daftar kecamatan (+ kode distrik 6-digit yang dipakai backend ML).
 * 2. Palet warna per-kecamatan (dipakai untuk garis di chart, bukan warna fase).
 * 3. Fetch data historis dari Supabase (`data_ksa`).
 * 4. Client untuk memanggil endpoint Random Forest di service `ml-pare-hurip`
 *    (h+1, h+2, h+3 bulan ke depan).
 * 5. Fungsi penggabung: historis + prediksi -> satu deret waktu siap-pakai
 *    untuk chart, lengkap dengan penanda tipe titik.
 */

import { displayOrder, phaseToYValue, yValueToLabel, kecamatanMap, getModus } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// 1. Kecamatan & kode distrik
// ---------------------------------------------------------------------------

export interface KecamatanOption {
  /** Kode 7-digit yang dipakai di GeoJSON / kecamatanMap */
  code: string;
  name: string;
  /**
   * Kode distrik 6-digit yang diminta API ml-pare-hurip (`district_code`).
   * Diturunkan dari `code` (6 digit pertama). Sesuaikan di sini kalau
   * mapping resminya berbeda.
   */
  districtCode: string;
}

export const KECAMATAN_LIST: KecamatanOption[] = Object.entries(kecamatanMap).map(
  ([code, name]) => ({
    code,
    name,
    districtCode: code.slice(0, 6),
  })
);

// Palet kategori-warna: satu warna tetap per kecamatan (identitas garis),
// terpisah dari getPhaseColor() yang dipakai untuk mewarnai fase.
// Menggunakan nuansa nature/agriculture dari project.
const LINE_COLOR_PALETTE = [
  "#3E5F44", "#639922", "#2a9d8f", "#016630", "#93DA97",
  "#d4a843", "#5E936C", "#A16D28", "#7cb342", "#c0784a",
];

export function getKecamatanColor(code: string): string {
  const idx = KECAMATAN_LIST.findIndex((k) => k.code === code);
  return LINE_COLOR_PALETTE[idx % LINE_COLOR_PALETTE.length] ?? "#64748b";
}

// ---------------------------------------------------------------------------
// Subsegmen per kecamatan — diambil real dari database
// ---------------------------------------------------------------------------
export const AGGREGATE_VALUE = "aggregate";

export async function getSubsegmentOptions(kecamatanCode: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("data_ksa")
    .select("subsegment")
    .like("segment_id", `${kecamatanCode}%`)
    .neq("subsegment", "")
    .not("subsegment", "is", null);

  if (error) {
    throw new Error("Gagal memuat daftar subsegmen.")
  }

  const unique = [...new Set((data ?? []).map((r) => r.subsegment).filter(Boolean))] as string[];
  return unique.sort();
}

// ---------------------------------------------------------------------------
// 2. Tipe data titik chart
// ---------------------------------------------------------------------------

export type PointKind = "historical" | "prediction";

export interface PhasePoint {
  /** label bulan singkat untuk sumbu-X, mis. "Nov '25" */
  monthLabel: string;
  month: number; // 1-12
  year: number;
  /** kode fase numerik, mis. 3.1, 4.0, dst (lihat displayOrder di lib/utils) */
  phase: number;
  kind: PointKind;
  /** hanya terisi untuk titik prediksi */
  confidence?: number;
  /** segment_id dari baris data_ksa asal (historis saja) */
  segment_id?: string;
}

export interface KecamatanSeries {
  districtCode: string;
  kecamatanName: string;
  subsegment: string; // "aggregate" atau kode subsegmen, mis. "A1"
  points: PhasePoint[]; // 9 historis + 3 prediksi = 12 titik, urut waktu
  /** Terisi bila pemuatan data historis dari database gagal */
  historyError?: string;
  /** Terisi bila layanan prediksi ML tidak dapat dijangkau */
  predictionError?: string;
}

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// ---------------------------------------------------------------------------
// 3b. Fetch historical data from Supabase (data_ksa)
// ---------------------------------------------------------------------------

interface DataKsaRow {
  segment_id: string
  subsegment: string
  periode: string
  phase: string
}

/**
 * Ambil baris mentah `data_ksa` untuk satu kecamatan dan subsegmen.
 * Filter menggunakan 7-digit kode kecamatan sebagai prefix segment_id.
 * - Jika subsegment === "aggregate", semua subsegmen di kecamatan diambil.
 * - Jika query database gagal, melempar error (ditangani pemanggil).
 * - Jika data tidak ditemukan, mengembalikan array kosong (bukan error).
 */
async function fetchRawRows(
  kecamatanCode: string,
  subsegment: string
): Promise<DataKsaRow[]> {
  let query = supabase
    .from("data_ksa")
    .select("segment_id, subsegment, periode, phase")
    .like("segment_id", `${kecamatanCode}%`);

  if (subsegment !== AGGREGATE_VALUE) {
    query = query.eq("subsegment", subsegment);
  }

  query = query.not("phase", "like", "7.%");
  query = query.neq("phase", "8");

  const { data, error } = await query.order("periode", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat data historis dari database.");
  }

  return (data ?? []) as DataKsaRow[];
}

/** Susun deret historis dari baris mentah (aggregate = rata-rata per periode,
 * selain itu = modus per periode). */
function buildHistoryFromRows(rows: DataKsaRow[], subsegment: string): PhasePoint[] {
  if (rows.length === 0) return [];

  if (subsegment === AGGREGATE_VALUE) {
    const grouped = new Map<string, DataKsaRow[]>();
    for (const row of rows) {
      const list = grouped.get(row.periode) ?? [];
      list.push(row);
      grouped.set(row.periode, list);
    }
    const aggregated: PhasePoint[] = [];
    for (const [periode, group] of grouped) {
      const [year, month] = periode.split("-").map(Number);
      const avgPhase =
        group.reduce((sum, r) => sum + parseFloat(r.phase), 0) / group.length;
      aggregated.push({
        monthLabel: `${MONTH_NAMES_SHORT[month - 1]} '${String(year).slice(-2)}`,
        month,
        year,
        phase: nearestKnownPhase(avgPhase),
        kind: "historical",
      });
    }
    return aggregated;
  }

  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.periode) ?? [];
    list.push(row.phase);
    grouped.set(row.periode, list);
  }
  return [...grouped].map(([periode, phases]) => {
    const [year, month] = periode.split("-").map(Number);
    return {
      monthLabel: `${MONTH_NAMES_SHORT[month - 1]} '${String(year).slice(-2)}`,
      month,
      year,
      phase: nearestKnownPhase(parseFloat(getModus(phases))),
      kind: "historical" as const,
    };
  });
}

/**
 * Ambil data historis dari tabel `data_ksa` untuk satu kecamatan dan subsegmen.
 * - Jika subsegment === "aggregate", semua subsegmen di kecamatan dirata-rata
 *   per periode.
 * - Jika query database gagal, melempar error (ditangani pemanggil).
 * - Jika data tidak ditemukan, mengembalikan array kosong (bukan error).
 */
export async function fetchHistoryFromDataKsa(
  kecamatanCode: string,
  subsegment: string
): Promise<PhasePoint[]> {
  const rows = await fetchRawRows(kecamatanCode, subsegment);
  return buildHistoryFromRows(rows, subsegment);
}

// ---------------------------------------------------------------------------
// 4. API client — service ml-pare-hurip (FastAPI, model Random Forest)
// ---------------------------------------------------------------------------

const ML_API_BATCH_PATH = "/api/v1/random-forest/predict/batch";

interface RandomForestPredictionItem {
  horizon_months: number;
  target_year: number;
  target_month: number;
  predicted_phase: string;
  confidence: number;
}

interface RandomForestBatchResult {
  segment_id?: string | null;
  subsegment: string;
  district_code: string;
  last_known_phase: string;
  last_known_year: number;
  last_known_month: number;
  predictions: RandomForestPredictionItem[];
}

interface RandomForestBatchResponse {
  results: RandomForestBatchResult[];
}

interface PredictPhaseParams {
  districtCode: string;
  subsegment: string;
  currentPhase: number;
  previousPhase: number;
  month: number;
  year: number;
  segmentId?: string;
}

function normalizePhase(phase: number): string {
  const s = String(phase);
  if (Number.isInteger(phase) && !s.includes(".")) {
    return phase + ".0";
  }
  return s;
}

async function requestPredictionBatch(
  paramsList: PredictPhaseParams[]
): Promise<RandomForestBatchResponse> {
  const res = await fetch(ML_API_BATCH_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: paramsList.map((p) => ({
        segment_id: p.segmentId ?? null,
        subsegment: p.subsegment,
        current_phase: normalizePhase(p.currentPhase),
        previous_phase: normalizePhase(p.previousPhase),
        district_code: p.districtCode,
        month: p.month,
        year: p.year,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat prediksi batch (${res.status})`);
  }
  return res.json();
}

/** Cari nilai fase terdekat di `displayOrder` untuk sebuah angka (dipakai
 * setelah merata-ratakan beberapa prediksi subsegmen untuk mode aggregate). */
function nearestKnownPhase(value: number): number {
  return displayOrder.reduce((closest, phase) =>
    Math.abs(phase - value) < Math.abs(closest - value) ? phase : closest
  , displayOrder[0]);
}

/** Cache hasil prediksi per (kecamatan, subsegmen, periode terakhir).
 *  Invalisi otomatis saat periode terakhir berubah (data baru masuk). */
const predictionCache = new Map<string, PhasePoint[]>();
const PREDICTION_CACHE_MAX = 200;

/**
 * Ambil 3 titik prediksi (h+1..h+3) untuk satu kecamatan.
 * - Jika `subsegment === "aggregate"`, ambil 2 data poin terakhir PER
 *   SUBSEGMEN dari `rawRows` (hasil query yang sama dengan historis),
 *   kirim batch, lalu rata-rata hasil prediksi per horizon.
 * - Selain itu, kirim satu item dengan data dari riwayat (history).
 * - Hasil di-cache per (kecamatan, subsegmen, periode terakhir).
 */
export async function fetchPrediction(
  districtCode: string,
  subsegment: string,
  history: PhasePoint[],
  kecamatanCode: string,
  rawRows: DataKsaRow[]
): Promise<PhasePoint[]> {
  const last = history[history.length - 1];
  const prev = history[history.length - 2] ?? last;

  const cacheKey = `${kecamatanCode}|${subsegment}|${last.year}-${last.month}`;
  const cached = predictionCache.get(cacheKey);
  if (cached) return cached;

  let batch: RandomForestBatchResponse;

  if (subsegment === AGGREGATE_VALUE) {
    // Susun 2 baris terbaru per subsegmen dari baris yang sudah diambil
    // (baris urut ascending periode; sisakan 2 terakhir per subsegmen).
    const bySub = new Map<string, DataKsaRow[]>();
    for (const row of rawRows) {
      const list = bySub.get(row.subsegment) ?? [];
      list.push(row);
      if (list.length > 2) list.shift();
      bySub.set(row.subsegment, list);
    }

    const paramsList: PredictPhaseParams[] = [];
    for (const [sub, rows] of bySub) {
      const newest = rows[rows.length - 1];
      const prevRow = rows.length > 1 ? rows[rows.length - 2] : newest;
      const [year, month] = newest.periode.split("-").map(Number);
      paramsList.push({
        districtCode,
        subsegment: sub,
        currentPhase: parseFloat(newest.phase),
        previousPhase: parseFloat(prevRow.phase),
        month,
        year,
        segmentId: newest.segment_id,
      });
    }

    if (paramsList.length === 0) return [];
    batch = await requestPredictionBatch(paramsList);
  } else {
    batch = await requestPredictionBatch([{
      districtCode,
      subsegment,
      currentPhase: last.phase,
      previousPhase: prev.phase,
      month: last.month,
      year: last.year,
      segmentId: last.segment_id,
    }]);
  }

  const horizonCount = batch.results[0]?.predictions.length ?? 3;
  const combined: PhasePoint[] = [];

  for (let h = 0; h < horizonCount; h++) {
    const perSubsegment = batch.results
      .map((r) => r.predictions[h])
      .filter((prediction): prediction is RandomForestPredictionItem => Boolean(prediction));

    if (perSubsegment.length === 0) continue;

    const avgPhaseValue =
      perSubsegment.reduce((sum, p) => sum + parseFloat(p.predicted_phase), 0) /
      perSubsegment.length;
    const avgConfidence =
      perSubsegment.reduce((sum, p) => sum + p.confidence, 0) / perSubsegment.length;
    const target = perSubsegment[0];

    combined.push({
      monthLabel: `${MONTH_NAMES_SHORT[target.target_month - 1]} '${String(
        target.target_year
      ).slice(-2)}`,
      month: target.target_month,
      year: target.target_year,
      phase: nearestKnownPhase(avgPhaseValue),
      kind: "prediction",
      confidence: avgConfidence,
    });
  }

  if (predictionCache.size >= PREDICTION_CACHE_MAX) predictionCache.clear();
  predictionCache.set(cacheKey, combined);
  return combined;
}

/**
 * Gabungkan historis (dari data_ksa) + prediksi (API) jadi satu deret waktu penuh.
 * - Gagal muat historis -> points kosong + historyError.
 * - Historis kosong -> points kosong tanpa error.
 * - ML tidak dapat dijangkau -> historis tetap tampil + predictionError.
 */
export async function loadKecamatanSeries(
  kec: KecamatanOption,
  subsegment: string
): Promise<KecamatanSeries> {
  let history: PhasePoint[];
  let rawRows: DataKsaRow[];
  try {
    // Satu query DB per kecamatan: baris mentah dipakai untuk historis
    // DAN untuk menyusun input prediksi (tanpa query kedua).
    rawRows = await fetchRawRows(kec.code, subsegment);
    history = buildHistoryFromRows(rawRows, subsegment);
  } catch (error) {
    return {
      districtCode: kec.districtCode,
      kecamatanName: kec.name,
      subsegment,
      points: [],
      historyError: error instanceof Error ? error.message : "Gagal memuat data historis.",
    };
  }

  if (history.length === 0) {
    return {
      districtCode: kec.districtCode,
      kecamatanName: kec.name,
      subsegment,
      points: [],
    };
  }

  let prediction: PhasePoint[];
  try {
    prediction = await fetchPrediction(kec.districtCode, subsegment, history, kec.code, rawRows);
  } catch (error) {
    return {
      districtCode: kec.districtCode,
      kecamatanName: kec.name,
      subsegment,
      points: history,
      predictionError:
        error instanceof Error ? error.message : "Layanan prediksi tidak dapat dijangkau.",
    };
  }

  return {
    districtCode: kec.districtCode,
    kecamatanName: kec.name,
    subsegment,
    points: [...history, ...prediction],
  };
}

/** Snap phase ke nilai displayOrder terdekat (dipakai untuk nilai DB
 * yang tidak cocok dengan key phaseToYValue seperti "1", "4.5", dsb). */
function snapToDisplayOrder(phase: number): number {
  return displayOrder.reduce((closest, p) =>
    Math.abs(p - phase) < Math.abs(closest - phase) ? p : closest
  , displayOrder[0]);
}

/** Konversi angka fase (mis. 3.1) -> label yang mudah dibaca (mis. "Generatif 1") */
export function phaseLabel(phase: number): string {
  let idx = phaseToYValue[String(phase)];
  if (idx === undefined) {
    idx = phaseToYValue[String(snapToDisplayOrder(phase))] ?? 0;
  }
  return yValueToLabel[String(idx)] ?? "-";
}

/** Posisi ternormalisasi (0..1) sebuah fase di dalam siklus tumbuh, dipakai
 * untuk menempatkan garis di dalam "lajur" band masing-masing kecamatan. */
export function phaseNormalizedPosition(phase: number): number {
  const key = String(phase);
  let idx = phaseToYValue[key];
  if (idx === undefined) {
    idx = phaseToYValue[String(snapToDisplayOrder(phase))] ?? 0;
  }
  return idx / (displayOrder.length - 1);
}

export { phaseToYValue, yValueToLabel, displayOrder };
