/**
 * Modul data & API untuk halaman "Fase Tanam".
 *
 * Tanggung jawab file ini:
 * 1. Daftar kecamatan (+ kode distrik 6-digit yang dipakai backend ML).
 * 2. Palet warna per-kecamatan (dipakai untuk garis di chart, bukan warna fase).
 * 3. Generator data historis DUMMY (9 bulan ke belakang) — ganti dengan fetch
 *    ke Supabase (`data_ksa`) kalau data asli sudah siap.
 * 4. Client untuk memanggil endpoint Random Forest di service `ml-pare-hurip`
 *    (h+1, h+2, h+3 bulan ke depan).
 * 5. Fungsi penggabung: historis + prediksi -> satu deret waktu siap-pakai
 *    untuk chart, lengkap dengan penanda tipe titik (historis/prediksi).
 */

import { displayOrder, phaseToYValue, yValueToLabel, kecamatanMap } from "@/lib/utils";

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
const LINE_COLOR_PALETTE = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#4f46e5", "#ea580c",
];

export function getKecamatanColor(code: string): string {
  const idx = KECAMATAN_LIST.findIndex((k) => k.code === code);
  return LINE_COLOR_PALETTE[idx % LINE_COLOR_PALETTE.length] ?? "#64748b";
}

// ---------------------------------------------------------------------------
// Subsegmen per kecamatan
// ---------------------------------------------------------------------------
// TODO: ganti dengan hasil query nyata ("SELECT DISTINCT subsegmen FROM
// data_ksa WHERE id_segmen LIKE 'kode_kecamatan%'"). Untuk sekarang dipakai
// daftar contoh yang sama untuk tiap kecamatan supaya UI bisa didemokan.
export const AGGREGATE_VALUE = "aggregate";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSubsegmentOptions(districtCode: string): string[] {
  return ["A1", "A2", "B1", "B2"];
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
}

export interface KecamatanSeries {
  districtCode: string;
  kecamatanName: string;
  subsegment: string; // "aggregate" atau kode subsegmen, mis. "A1"
  points: PhasePoint[]; // 9 historis + 3 prediksi = 12 titik, urut waktu
}

// ---------------------------------------------------------------------------
// 3. Dummy data historis
// ---------------------------------------------------------------------------

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function monthsBackFromNow(count: number): { month: number; year: number }[] {
  const now = new Date();
  const result: { month: number; year: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
}

function monthsForwardFromNow(count: number): { month: number; year: number }[] {
  const now = new Date();
  const result: { month: number; year: number }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
}

/** Simple deterministic string hash -> seed angka, supaya tiap kombinasi
 * kecamatan+subsegmen menghasilkan pola dummy yang konsisten (tidak berubah
 * setiap re-render), bukan acak murni. */
function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Menghasilkan 9 bulan data historis DUMMY yang mengikuti siklus tumbuh padi
 * secara masuk akal (Persiapan Lahan -> Vegetatif -> Generatif -> Panen ->
 * ulang), dengan sedikit variasi supaya tiap seri terlihat berbeda.
 */
export function generateDummyHistory(seedKey: string, monthCount = 9): PhasePoint[] {
  const rand = mulberry32(seedFrom(seedKey));
  const months = monthsBackFromNow(monthCount);

  // titik awal acak (tapi deterministik) di siklus fase
  let cycleIdx = Math.floor(rand() * displayOrder.length);

  return months.map(({ month, year }) => {
    const phase = displayOrder[cycleIdx % displayOrder.length];
    // maju satu fase tiap bulan, kadang "tertahan" 1 bulan ekstra di fase yang
    // sama supaya pola tidak terlalu kaku/linear
    cycleIdx += rand() > 0.75 ? 0 : 1;
    return {
      monthLabel: `${MONTH_NAMES_SHORT[month - 1]} '${String(year).slice(-2)}`,
      month,
      year,
      phase,
      kind: "historical" as const,
    };
  });
}

// ---------------------------------------------------------------------------
// 4. API client — service ml-pare-hurip (FastAPI, model Random Forest)
// ---------------------------------------------------------------------------

const ML_API_BASE_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ?? "http://127.0.0.1:8000";

interface RandomForestHorizonPrediction {
  horizon_months: number;
  target_year: number;
  target_month: number;
  predicted_phase: string;
  confidence: number;
}

interface RandomForestPredictionResponse {
  segment_id?: string | null;
  subsegment: string;
  district_code: string;
  last_known_phase: string;
  last_known_year: number;
  last_known_month: number;
  predictions: RandomForestHorizonPrediction[];
}

interface RandomForestBatchResponse {
  results: RandomForestPredictionResponse[];
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

async function requestPrediction(
  params: PredictPhaseParams
): Promise<RandomForestPredictionResponse> {
  const res = await fetch(`${ML_API_BASE_URL}/random-forest/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      segment_id: params.segmentId,
      subsegment: params.subsegment,
      current_phase: String(params.currentPhase),
      previous_phase: String(params.previousPhase),
      district_code: params.districtCode,
      month: params.month,
      year: params.year,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat prediksi (${res.status})`);
  }
  return res.json();
}

async function requestPredictionBatch(
  paramsList: PredictPhaseParams[]
): Promise<RandomForestBatchResponse> {
  const res = await fetch(`${ML_API_BASE_URL}/random-forest/predict/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: paramsList.map((p) => ({
        segment_id: p.segmentId,
        subsegment: p.subsegment,
        current_phase: String(p.currentPhase),
        previous_phase: String(p.previousPhase),
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

/**
 * Ambil 3 titik prediksi (h+1..h+3) untuk satu kecamatan.
 * - Jika `subsegment === "aggregate"`, panggil batch untuk semua subsegmen
 *   yang ada di kecamatan tsb lalu rata-ratakan posisi fasenya per horizon.
 * - Selain itu, panggil endpoint single-predict untuk subsegmen tersebut.
 */
export async function fetchPrediction(
  districtCode: string,
  subsegment: string,
  history: PhasePoint[]
): Promise<PhasePoint[]> {
  const last = history[history.length - 1];
  const prev = history[history.length - 2] ?? last;
  const forwardMonths = monthsForwardFromNow(3);

  const baseParams = {
    districtCode,
    currentPhase: last.phase,
    previousPhase: prev.phase,
    month: last.month,
    year: last.year,
  };

  if (subsegment !== AGGREGATE_VALUE) {
    const res = await requestPrediction({ ...baseParams, subsegment });
    return res.predictions.map((p, i) => ({
      monthLabel: `${MONTH_NAMES_SHORT[forwardMonths[i].month - 1]} '${String(
        forwardMonths[i].year
      ).slice(-2)}`,
      month: p.target_month,
      year: p.target_year,
      phase: parseFloat(p.predicted_phase),
      kind: "prediction" as const,
      confidence: p.confidence,
    }));
  }

  const subOptions = getSubsegmentOptions(districtCode);
  const batch = await requestPredictionBatch(
    subOptions.map((sub) => ({ ...baseParams, subsegment: sub }))
  );

  const horizonCount = batch.results[0]?.predictions.length ?? 3;
  const combined: PhasePoint[] = [];

  for (let h = 0; h < horizonCount; h++) {
    const perSubsegment = batch.results.map((r) => r.predictions[h]);
    const avgPhaseValue =
      perSubsegment.reduce((sum, p) => sum + parseFloat(p.predicted_phase), 0) /
      perSubsegment.length;
    const avgConfidence =
      perSubsegment.reduce((sum, p) => sum + p.confidence, 0) / perSubsegment.length;
    const target = perSubsegment[0];

    combined.push({
      monthLabel: `${MONTH_NAMES_SHORT[forwardMonths[h].month - 1]} '${String(
        forwardMonths[h].year
      ).slice(-2)}`,
      month: target.target_month,
      year: target.target_year,
      phase: nearestKnownPhase(avgPhaseValue),
      kind: "prediction",
      confidence: avgConfidence,
    });
  }

  return combined;
}

/** Gabungkan historis (dummy) + prediksi (API) jadi satu deret waktu penuh. */
export async function loadKecamatanSeries(
  kec: KecamatanOption,
  subsegment: string
): Promise<KecamatanSeries> {
  const history = generateDummyHistory(`${kec.code}|${subsegment}`);
  const prediction = await fetchPrediction(kec.districtCode, subsegment, history);

  return {
    districtCode: kec.districtCode,
    kecamatanName: kec.name,
    subsegment,
    points: [...history, ...prediction],
  };
}

/** Konversi angka fase (mis. 3.1) -> label yang mudah dibaca (mis. "Generatif 1") */
export function phaseLabel(phase: number): string {
  const idx = phaseToYValue[String(phase)];
  return idx !== undefined ? yValueToLabel[String(idx)] ?? "-" : "-";
}

/** Posisi ternormalisasi (0..1) sebuah fase di dalam siklus tumbuh, dipakai
 * untuk menempatkan garis di dalam "lajur" band masing-masing kecamatan. */
export function phaseNormalizedPosition(phase: number): number {
  const idx = phaseToYValue[String(phase)] ?? 0;
  return idx / (displayOrder.length - 1);
}

export { phaseToYValue, yValueToLabel, displayOrder };
