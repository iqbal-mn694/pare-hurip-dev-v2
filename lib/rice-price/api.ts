/**
 * Modul data & API untuk grafik "Prediksi Harga Beras Mingguan".
 *
 * Model ML (LSTM Hybrid) yang sebenarnya memprediksi harga secara HARIAN.
 * Di sisi frontend, data harian tersebut (baik historis maupun hasil
 * prediksi) diagregasi menjadi rata-rata MINGGUAN untuk ditampilkan di
 * grafik, supaya lebih ringkas dan mudah dibaca.
 *
 * Sumber data:
 * - Historis  -> dari tabel `rice_prices` di Supabase (database).
 * - Prediksi  -> di-proxy lewat Next.js API route `/api/v1/rice-price/predict/batch`,
 *   yang di baliknya manggil service ML lokal (`ml-pare-hurip`), endpoint
 *   `/api/v1/lstm-hybrid-price/predict/batch`. Selalu dipanggil batch untuk
 *   SEMUA jenis beras sekaligus (dipakai Card ringkasan); Card grafik cuma
 *   memfilter hasil ini, tidak fetch ulang per jenis.
 */

import { supabase } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// 1. Jenis beras
// ---------------------------------------------------------------------------

export interface RiceTypeOption {
  id: string;
  /** Nama persis yang dikirim ke API (`rice_type`) */
  label: string;
  /** Warna identitas garis (historis, solid) */
  color: string;
  /** Warna identitas garis (prediksi, sedikit lebih terang) */
  colorPrediction: string;
}

export const RICE_TYPES: RiceTypeOption[] = [
  { id: "bawah-1", label: "Beras Kualitas Bawah I", color: "#ea580c", colorPrediction: "#fb923c" },
  { id: "bawah-2", label: "Beras Kualitas Bawah II", color: "#d97706", colorPrediction: "#fbbf24" },
  { id: "medium", label: "Beras Kualitas Medium I", color: "#16a34a", colorPrediction: "#4ade80" },
  { id: "medium-2", label: "Beras Kualitas Medium II", color: "#0d9488", colorPrediction: "#2dd4bf" },
  { id: "super-1", label: "Beras Kualitas Super I", color: "#2563eb", colorPrediction: "#60a5fa" },
  { id: "super-2", label: "Beras Kualitas Super II", color: "#7c3aed", colorPrediction: "#a78bfa" },
];

export const getRiceTypeById = (id: string): RiceTypeOption | undefined =>
  RICE_TYPES.find((r) => r.id === id);

export interface DailyPricePoint {
  date: string;
  price: number;
}

export async function fetchRicePriceHistory(
  riceTypeId: number,
  days: number
): Promise<DailyPricePoint[]> {
  const { data, error } = await supabase
    .from("rice_prices")
    .select("date, price")
    .eq("rice_type_id", riceTypeId)
    .order("date", { ascending: false })
    .limit(days);

  if (error || !data || data.length === 0) return [];

  return data.reverse().map((row) => ({
    date: row.date,
    price: row.price,
  }));
}

// ---------------------------------------------------------------------------
// 3. Agregasi harian -> mingguan
// ---------------------------------------------------------------------------

export interface WeeklyPoint {
  weekKey: string; // identitas unik urutan minggu, dipakai sebagai kategori X
  label: string; // label pendek ditampilkan di sumbu X
  rangeLabel: string; // label lengkap "13 - 19 Jul 2026" untuk tooltip
  startDate: string;
  endDate: string;
  avgPrice: number;
}

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const DATE_FMT_YEAR = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

/** Kelompokkan data harian (urut kronologis) menjadi bucket 7-harian */
export function aggregateWeekly(daily: DailyPricePoint[], keyPrefix = "w"): WeeklyPoint[] {
  const weeks: WeeklyPoint[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    if (chunk.length === 0) continue;
    const avg = chunk.reduce((sum, d) => sum + d.price, 0) / chunk.length;
    const start = new Date(chunk[0].date);
    const end = new Date(chunk[chunk.length - 1].date);
    weeks.push({
      weekKey: `${keyPrefix}-${weeks.length}`,
      label: `${DATE_FMT.format(start)}`,
      rangeLabel: `${DATE_FMT.format(start)} – ${DATE_FMT_YEAR.format(end)}`,
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      avgPrice: Math.round(avg),
    });
  }
  return weeks;
}

/** Koefisien variasi (stdev / mean) dalam persen — dipakai sebagai ukuran volatilitas historis */
export function computeVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);
  return (stdev / mean) * 100;
}

// ---------------------------------------------------------------------------
// 4. Client API prediksi (LSTM Hybrid) — diproxy lewat Next.js API route
// ---------------------------------------------------------------------------

/**
 * Base URL ML API HANYA dipakai server-side (di dalam API route Next.js).
 * Browser tidak pernah manggil ini langsung lagi — makanya tidak perlu
 * NEXT_PUBLIC_ dan tidak akan kena CORS.
 */
export const ML_API_BASE_URL =
  process.env.ML_API_URL ?? "http://127.0.0.1:8000";

/** Path proxy same-origin di sisi Next.js (lihat app/api/v1/rice-price/predict/batch/route.ts) */
const PROXY_BATCH_PATH = "/api/v1/rice-price/predict/batch";

export interface PricePredictionPoint {
  target_date: string;
  predicted_price: number;
}

export interface RicePricePredictionResult {
  rice_type: string;
  last_known_price: number;
  last_known_date: string;
  lstm_weight: number;
  relative_volatility: number;
  predictions: PricePredictionPoint[];
}

interface PredictSingleRequest {
  rice_type: string;
  last_prices: number[];
  last_price_date: string;
}

interface PredictBatchRequest {
  items: PredictSingleRequest[];
}

interface PredictBatchResponse {
  results: RicePricePredictionResult[];
}

/**
 * Ambil prediksi untuk satu atau lebih jenis beras. Selalu lewat endpoint
 * batch (walau cuma 1 item) — endpoint single non-batch tidak dipakai lagi
 * karena pemanggil (RicePricePredictionChart) selalu mengirim seluruh
 * RICE_TYPES sekaligus dalam satu request.
 */
export async function predictRicePrices(
  items: PredictSingleRequest[]
): Promise<RicePricePredictionResult[]> {
  if (items.length === 0) return [];

  const body: PredictBatchRequest = { items };
  const res = await fetch(PROXY_BATCH_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Permintaan prediksi harga gagal (status ${res.status})`);
  }

  const data = (await res.json()) as PredictBatchResponse;
  return data.results ?? [];
}