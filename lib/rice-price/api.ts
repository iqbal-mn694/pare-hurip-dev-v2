/**
 * Modul data & API untuk grafik "Prediksi Harga Beras Mingguan".
 *
 * Model ML (LSTM Hybrid) yang sebenarnya memprediksi harga secara HARIAN.
 * Di sisi frontend, data harian tersebut (baik historis maupun hasil
 * prediksi) diagregasi menjadi rata-rata MINGGUAN untuk ditampilkan di
 * grafik, supaya lebih ringkas dan mudah dibaca.
 *
 * Sumber data:
 * - Historis  -> DUMMY (random-walk deterministik per jenis beras).
 *   TODO: ganti dengan data historis asli begitu endpoint/dataset resmi
 *   sudah tersedia (jangan pakai `data/data_harga_beras.json`, kategorinya
 *   sudah tidak relevan dengan jenis beras di bawah).
 * - Prediksi  -> API service ML lokal (`ml-pare-hurip`), endpoint
 *   `/api/v1/lstm-hybrid-price/predict` (1 jenis) dan
 *   `/api/v1/lstm-hybrid-price/predict/batch` (banyak jenis sekaligus).
 */

// ---------------------------------------------------------------------------
// 1. Jenis beras
// ---------------------------------------------------------------------------

export interface RiceTypeOption {
  id: string;
  /** Nama persis yang dikirim ke API (`rice_type`) */
  label: string;
  /** Harga dasar dummy (Rp/kg) — dipakai sebagai jangkar random-walk historis */
  basePrice: number;
  /** Warna identitas garis (historis, solid) */
  color: string;
  /** Warna identitas garis (prediksi, sedikit lebih terang) */
  colorPrediction: string;
}

export const RICE_TYPES: RiceTypeOption[] = [
  { id: "bawah-1", label: "Beras Kualitas Bawah I", basePrice: 12550, color: "#ea580c", colorPrediction: "#fb923c" },
  { id: "bawah-2", label: "Beras Kualitas Bawah II", basePrice: 12050, color: "#d97706", colorPrediction: "#fbbf24" },
  { id: "medium", label: "Beras Kualitas Medium", basePrice: 13850, color: "#16a34a", colorPrediction: "#4ade80" },
  { id: "medium-2", label: "Beras Kualitas Medium II", basePrice: 13400, color: "#0d9488", colorPrediction: "#2dd4bf" },
  { id: "super-1", label: "Beras Kualitas Super I", basePrice: 16150, color: "#2563eb", colorPrediction: "#60a5fa" },
  { id: "super-2", label: "Beras Kualitas Super II", basePrice: 15600, color: "#7c3aed", colorPrediction: "#a78bfa" },
];

export const getRiceTypeById = (id: string): RiceTypeOption | undefined =>
  RICE_TYPES.find((r) => r.id === id);

// ---------------------------------------------------------------------------
// 2. Generator data historis harian (DUMMY)
// ---------------------------------------------------------------------------

/** PRNG seed sederhana yang deterministik (supaya data dummy stabil antar-render) */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export interface DailyPricePoint {
  date: string; // yyyy-mm-dd
  price: number;
}

/**
 * Menghasilkan `days` harga harian dummy yang berakhir di `endDate`
 * (inklusif), berbentuk random-walk halus + tren musiman kecil supaya
 * terlihat wajar sebagai harga beras riil.
 */
export function generateDummyDailyPrices(
  riceType: RiceTypeOption,
  days: number,
  endDate: Date
): DailyPricePoint[] {
  const rand = mulberry32(hashString(riceType.id) ^ 0x9e3779b9);
  const points: DailyPricePoint[] = [];

  let price = riceType.basePrice;
  const drift = (rand() - 0.5) * 6; // tren harian sangat kecil

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);

    const noise = (rand() - 0.5) * riceType.basePrice * 0.006; // ~0.3% noise
    const seasonal = Math.sin((days - i) / 9) * riceType.basePrice * 0.004;
    price = price + drift + noise;
    // tarik lembut ke basePrice supaya tidak melayang jauh
    price += (riceType.basePrice - price) * 0.03;

    const finalPrice = Math.max(0, Math.round((price + seasonal) / 50) * 50);
    points.push({ date: date.toISOString().slice(0, 10), price: finalPrice });
  }

  return points;
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
// 4. Client API prediksi (LSTM Hybrid)
// ---------------------------------------------------------------------------

export const ML_API_BASE_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ?? "http://127.0.0.1:8000";

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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ML_API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Permintaan ke ${path} gagal (status ${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function predictRicePriceSingle(
  req: PredictSingleRequest
): Promise<RicePricePredictionResult> {
  return postJson<RicePricePredictionResult>(
    "/api/v1/lstm-hybrid-price/predict",
    req
  );
}

export async function predictRicePriceBatch(
  items: PredictSingleRequest[]
): Promise<RicePricePredictionResult[]> {
  const body: PredictBatchRequest = { items };
  const data = await postJson<PredictBatchResponse>(
    "/api/v1/lstm-hybrid-price/predict/batch",
    body
  );
  return data.results ?? [];
}

/**
 * Ambil prediksi untuk satu atau lebih jenis beras sekaligus, otomatis
 * memilih endpoint single vs batch sesuai jumlah item (mengikuti kontrak
 * API: endpoint single untuk 1 jenis, batch untuk >1 jenis).
 */
export async function predictRicePrices(
  items: PredictSingleRequest[]
): Promise<RicePricePredictionResult[]> {
  if (items.length === 0) return [];
  if (items.length === 1) {
    const result = await predictRicePriceSingle(items[0]);
    return [result];
  }
  return predictRicePriceBatch(items);
}
