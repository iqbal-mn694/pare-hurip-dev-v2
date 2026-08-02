/**
 * Random Forest prediction client — calls the ml-pare-hurip FastAPI
 * service through the proxied Next.js route `/api/v1/random-forest/predict/batch`.
 * Includes a per-(district, subsegment, last period) cache.
 */

import { AGGREGATE_VALUE, MONTH_NAMES_SHORT } from "@/lib/planting-phase/constants";
import { nearestKnownPhase } from "@/lib/planting-phase/transform";
import type { PhasePoint } from "@/lib/planting-phase/data";
import type { DataKsaRow } from "@/lib/planting-phase/queries";

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

/** Cache prediction results per (district, subsegment, last period).
 *  Auto-invalidated when the last period changes (new data arrives). */
const predictionCache = new Map<string, PhasePoint[]>();
const PREDICTION_CACHE_MAX = 200;

/**
 * Fetch 3 prediction points (h+1..h+3) for one district.
 * - If `subsegment === "aggregate"`, take the last 2 data points PER
 *   SUBSEGMENT from `rawRows` (same query result as the history),
 *   send a batch, then average the predictions per horizon.
 * - Otherwise, send a single item built from the history.
 * - Results are cached per (district, subsegment, last period).
 */
export async function fetchPrediction(
  districtCode: string,
  subsegment: string,
  history: PhasePoint[],
  segmentPrefix: string,
  rawRows: DataKsaRow[]
): Promise<PhasePoint[]> {
  const last = history[history.length - 1];
  const prev = history[history.length - 2] ?? last;

  const cacheKey = `${segmentPrefix}|${subsegment}|${last.year}-${last.month}`;
  const cached = predictionCache.get(cacheKey);
  if (cached) return cached;

  let batch: RandomForestBatchResponse;

  if (subsegment === AGGREGATE_VALUE) {
    // Keep the 2 newest rows per subsegment from the fetched rows
    // (rows are ascending by period; keep only the last 2 per subsegment).
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
