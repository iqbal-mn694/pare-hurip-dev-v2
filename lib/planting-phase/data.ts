/**
 * Public API module for the "Fase Tanam" (planting phase) page.
 *
 * Responsibilities:
 * 1. District list (+ 6-digit district codes used by the ML backend).
 * 2. Chart point types shared across the module.
 * 3. History + prediction orchestration (`loadDistrictSeries`).
 * 4. Phase label / position helpers used by the chart.
 *
 * Data access is split by responsibility:
 * - `constants.ts`  — shared constants & pure helpers
 * - `transform.ts`  — raw row -> history series transformation
 * - `queries.ts`    — Supabase queries
 * - `prediction.ts` — Random Forest ML client (+ cache)
 */

import { displayOrder, phaseToYValue, yValueToLabel, districtMap, AGGREGATE_VALUE } from "@/lib/planting-phase/constants";
import { fetchRawRows, fetchHistoryFromDataKsa, getSubsegmentOptions, type DataKsaRow } from "@/lib/planting-phase/queries";
import { fetchPrediction } from "@/lib/planting-phase/prediction";
import { buildHistoryFromRows } from "@/lib/planting-phase/transform";

// ---------------------------------------------------------------------------
// Districts & district codes
// ---------------------------------------------------------------------------

export interface DistrictOption {
  /** 7-digit code used in GeoJSON / districtMap */
  code: string;
  name: string;
  /**
   * 6-digit district code expected by the ml-pare-hurip API (`district_code`).
   * Derived from `code` (first 6 digits). Adjust here if the official
   * mapping differs.
   */
  districtCode: string;
}

export const DISTRICT_LIST: DistrictOption[] = Object.entries(districtMap).map(
  ([code, name]) => ({
    code,
    name,
    districtCode: code.slice(0, 6),
  })
);

// Category color palette: one fixed color per district (line identity),
// separate from getPhaseColor() used for phase coloring.
// Uses the project's nature/agriculture tones.
const LINE_COLOR_PALETTE = [
  "#3E5F44", "#639922", "#2a9d8f", "#016630", "#93DA97",
  "#d4a843", "#5E936C", "#A16D28", "#7cb342", "#c0784a",
];

export function getDistrictColor(code: string): string {
  const idx = DISTRICT_LIST.findIndex((k) => k.code === code);
  return LINE_COLOR_PALETTE[idx % LINE_COLOR_PALETTE.length] ?? "#64748b";
}

// ---------------------------------------------------------------------------
// Chart point data types
// ---------------------------------------------------------------------------

export type PointKind = "historical" | "prediction";

export interface PhasePoint {
  /** short month label for the X axis, e.g. "Nov '25" */
  monthLabel: string;
  month: number; // 1-12
  year: number;
  /** numeric phase code, e.g. 3.1, 4.0, etc. (see displayOrder in constants) */
  phase: number;
  kind: PointKind;
  /** only set for prediction points */
  confidence?: number;
  /** segment_id from the source data_ksa row (history only) */
  segment_id?: string;
}

export interface DistrictSeries {
  districtCode: string;
  districtName: string;
  subsegment: string; // "aggregate" or a subsegment code, e.g. "A1"
  points: PhasePoint[]; // 9 history + 3 prediction = 12 points, time-ordered
  /** Set when loading historical data from the database fails */
  historyError?: string;
  /** Set when the ML prediction service is unreachable */
  predictionError?: string;
}

// ---------------------------------------------------------------------------
// Orchestration: history + prediction -> one time series
// ---------------------------------------------------------------------------

/**
 * Merge history (from data_ksa) + prediction (API) into one full time series.
 * - History load fails -> empty points + historyError.
 * - Empty history -> empty points, no error.
 * - ML unreachable -> history still shown + predictionError.
 */
export async function loadDistrictSeries(
  district: DistrictOption,
  subsegment: string
): Promise<DistrictSeries> {
  let history: PhasePoint[];
  let rawRows: DataKsaRow[];
  try {
    // One DB query per district: raw rows are used for the history
    // AND to build the prediction input (no second query).
    rawRows = await fetchRawRows(district.code, subsegment);
    history = buildHistoryFromRows(rawRows, subsegment);
  } catch (error) {
    return {
      districtCode: district.districtCode,
      districtName: district.name,
      subsegment,
      points: [],
      historyError: error instanceof Error ? error.message : "Gagal memuat data historis.",
    };
  }

  if (history.length === 0) {
    return {
      districtCode: district.districtCode,
      districtName: district.name,
      subsegment,
      points: [],
    };
  }

  let prediction: PhasePoint[];
  try {
    prediction = await fetchPrediction(district.districtCode, subsegment, history, district.code, rawRows);
  } catch (error) {
    return {
      districtCode: district.districtCode,
      districtName: district.name,
      subsegment,
      points: history,
      predictionError:
        error instanceof Error ? error.message : "Layanan prediksi tidak dapat dijangkau.",
    };
  }

  return {
    districtCode: district.districtCode,
    districtName: district.name,
    subsegment,
    points: [...history, ...prediction],
  };
}

// ---------------------------------------------------------------------------
// Phase label / position helpers
// ---------------------------------------------------------------------------

/** Snap a phase to the nearest displayOrder value (used for DB values
 * that don't match phaseToYValue keys, such as "1", "4.5", etc.). */
function snapToDisplayOrder(phase: number): number {
  return displayOrder.reduce((closest, p) =>
    Math.abs(p - phase) < Math.abs(closest - phase) ? p : closest
  , displayOrder[0]);
}

/** Convert a phase number (e.g. 3.1) -> a human-readable label (e.g. "Generatif 1") */
export function phaseLabel(phase: number): string {
  let idx = phaseToYValue[String(phase)];
  if (idx === undefined) {
    idx = phaseToYValue[String(snapToDisplayOrder(phase))] ?? 0;
  }
  return yValueToLabel[String(idx)] ?? "-";
}

/** Normalized position (0..1) of a phase within the growth cycle, used
 * to place the line inside each district's band lane. */
export function phaseNormalizedPosition(phase: number): number {
  const key = String(phase);
  let idx = phaseToYValue[key];
  if (idx === undefined) {
    idx = phaseToYValue[String(snapToDisplayOrder(phase))] ?? 0;
  }
  return idx / (displayOrder.length - 1);
}

// Re-export the data-layer entry points so consumers keep importing
// from a single module (the previous behavior of this file).
export {
  AGGREGATE_VALUE,
  getSubsegmentOptions,
  fetchHistoryFromDataKsa,
  phaseToYValue,
  yValueToLabel,
  displayOrder,
};
