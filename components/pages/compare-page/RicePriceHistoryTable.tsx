"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Download, Info } from "lucide-react";
import { RICE_TYPES, fetchRicePriceByRange } from "@/lib/rice-price/api";

// ---------------------------------------------------------------------------
// Konfigurasi
// ---------------------------------------------------------------------------

const DEFAULT_RANGE_DAYS = 90;
const DEBOUNCE_MS = 400;
/** Tanggal terawal data historis yang tersedia di database */
const MIN_DATE = "2020-01-01";

interface HistoryRow {
  date: string;
  prices: Record<string, number>;
}

/** Nama kolom CSV (snake_case, siap dibaca pandas) */
const CSV_KEYS: Record<string, string> = {
  "bawah-1": "beras_bawah_i",
  "bawah-2": "beras_bawah_ii",
  medium: "beras_medium_i",
  "medium-2": "beras_medium_ii",
  "super-1": "beras_super_i",
  "super-2": "beras_super_ii",
};

const csvKey = (id: string) => CSV_KEYS[id] ?? id;

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDateCell(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const formatRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(v);

const shortLabel = (label: string) => label.replace(/^Beras Kualitas\s*/, "");

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

export default function RicePriceHistoryTable() {
  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState(() =>
    toISODate(addDays(today, -DEFAULT_RANGE_DAYS))
  );
  const [toDate, setToDate] = useState(() => toISODate(today));
  const [appliedFrom, setAppliedFrom] = useState(fromDate);
  const [appliedTo, setAppliedTo] = useState(toDate);

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateValid = fromDate >= MIN_DATE && fromDate <= toDate;

  // Debounce perubahan rentang tanggal (jeda mengetik 400ms)
  useEffect(() => {
    if (!fromDate || !toDate || fromDate < MIN_DATE || fromDate > toDate) return;
    const t = setTimeout(() => {
      setAppliedFrom(fromDate);
      setAppliedTo(toDate);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fromDate, toDate]);

  // Ambil data historis untuk semua jenis beras pada rentang yang ter-apply
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const promises = RICE_TYPES.map(async (rt, idx) => {
          const daily = await fetchRicePriceByRange(idx + 1, appliedFrom, appliedTo);
          return { id: rt.id, daily };
        });
        const results = await Promise.all(promises);
        if (cancelled) return;
        const mapByDate = new Map<string, HistoryRow>();
        results.forEach((r) => {
          r.daily.forEach((d) => {
            let row = mapByDate.get(d.date);
            if (!row) {
              row = { date: d.date, prices: {} };
              mapByDate.set(d.date, row);
            }
            row.prices[r.id] = d.price;
          });
        });
        setRows(
          Array.from(mapByDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
        );
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setError(
          "Gagal memuat tabel harga. " +
            (err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [appliedFrom, appliedTo]);

  const downloadCsv = useCallback(() => {
    const header = ["tanggal", ...RICE_TYPES.map((rt) => csvKey(rt.id))].join(",");
    const lines = rows.map((r) =>
      [r.date, ...RICE_TYPES.map((rt) => r.prices[rt.id] ?? "")].join(",")
    );
    const csv = [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harga-beras_${appliedFrom}_${appliedTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, appliedFrom, appliedTo]);

  return (
    <Card className="border-green-100 dark:border-green-900/40 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-800 dark:text-white text-base md:text-lg">
          Tabel Harga Beras
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Riwayat harga harian per jenis beras pada rentang tanggal yang dipilih
          (data tersedia mulai Januari 2020). Gunakan tombol Unduh CSV untuk
          mengambil data mentah.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-1 space-y-4">
        {/* Kontrol filter rentang tanggal */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="price-from"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Dari
            </label>
            <input
              id="price-from"
              type="date"
              value={fromDate}
              min={MIN_DATE}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:[color-scheme:dark]"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="price-to"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Sampai
            </label>
            <input
              id="price-to"
              type="date"
              value={toDate}
              min={fromDate}
              max={toISODate(today)}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:[color-scheme:dark]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            disabled={loading || rows.length === 0 || !dateValid}
            className="cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh CSV
          </Button>
          {!loading && rows.length > 0 && (
            <span className="text-xs text-slate-400 pb-1.5">
              {rows.length} hari data
            </span>
          )}
        </div>

        {!dateValid && (
          <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
            {fromDate < MIN_DATE
              ? "Data historis harga tersedia mulai 1 Januari 2020."
              : "Tanggal awal tidak boleh melebihi tanggal akhir."}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Tabel historis (sticky header, scroll vertikal maks 480px) */}
        <div className="relative max-h-[480px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
              <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-900">
                <TableHead className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tanggal
                </TableHead>
                {RICE_TYPES.map((rt) => (
                  <TableHead
                    key={rt.id}
                    className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {shortLabel(rt.label)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3 py-2">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                    {RICE_TYPES.map((rt) => (
                      <TableCell key={rt.id} className="px-3 py-2">
                        <div className="h-4 w-16 ml-auto rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={RICE_TYPES.length + 1}
                    className="px-3 py-10 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Info className="w-5 h-5" />
                      <span className="text-sm">
                        Tidak ada data harga pada rentang tanggal tersebut.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow
                    key={r.date}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDateCell(r.date)}
                    </TableCell>
                    {RICE_TYPES.map((rt) => (
                      <TableCell
                        key={rt.id}
                        className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200"
                      >
                        {r.prices[rt.id] !== undefined
                          ? formatRupiah(r.prices[rt.id])
                          : "–"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-[11px] text-slate-400">
          Sumber data: BI Harga Pangan (bi.go.id/hargapangan).
        </p>
      </CardContent>
    </Card>
  );
}
