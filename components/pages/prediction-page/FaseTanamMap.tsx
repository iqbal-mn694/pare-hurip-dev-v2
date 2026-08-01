/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import {
  kecamatanMap,
  getPhaseColor,
  getSawahPhaseColor,
  getModus,
  displayOrder,
} from "@/lib/utils";
import { tasikmalayaGeoJson } from "@/lib/tasikmalaya-geojson";
import { sawahGeoJson } from "@/lib/bpn-sawah-geojson";

const KecamatanMapDynamic = dynamic(() => import("@/components/KecamatanMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-lg bg-slate-100 animate-pulse" aria-hidden="true" />
  ),
});

const TasikCityMapDynamic = dynamic(() => import("@/components/TasikCityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-lg bg-slate-100 animate-pulse" aria-hidden="true" />
  ),
});

function formatMonthLabel(periode: string): string {
  const [year, month] = periode.split("-").map(Number);
  const names = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${names[month - 1]} ${year}`;
}

// Legenda warna fase (swatch persegi) yang dipakai di bawah peta.
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

function snapPhase(raw: string): number {
  const num = parseFloat(raw);
  return displayOrder.reduce((closest, p) =>
    Math.abs(p - num) < Math.abs(closest - num) ? p : closest,
    displayOrder[0]
  );
}

export default function FaseTanamMap() {
  const [data, setData] = useState<any[] | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch paralel per kecamatan — PostgREST memotong query global
        // di 1.000 baris, sedangkan per kecamatan ±650 baris (< batas),
        // sehingga seluruh periode 2024–2026 termuat.
        const queries = Object.entries(kecamatanMap).map(async ([kode, nama]) => {
          const { data, error } = await supabase
            .from("data_ksa")
            .select("segment_id, subsegment, periode, phase")
            .like("segment_id", `${kode}%`)
            .not("phase", "like", "7.%")
            .neq("phase", "8")
            .order("periode", { ascending: true });

          if (error) {
            throw new Error("Gagal memuat data fase dari database.");
          }

          return { nama, rows: (data ?? []) as any[] };
        });

        const results = await Promise.all(queries);

        const result: any[] = [];
        const allPeriodes = new Set<string>();

        for (const { nama, rows } of results) {
          const byPeriode = new Map<string, string[]>();
          for (const row of rows) {
            const list = byPeriode.get(row.periode) ?? [];
            list.push(row.phase);
            byPeriode.set(row.periode, list);
            allPeriodes.add(row.periode);
          }
          const entry: any = { kecamatan: nama };
          for (const [periode, phases] of byPeriode) {
            entry[periode] = snapPhase(getModus(phases));
          }
          result.push(entry);
        }

        const sortedMonths = [...allPeriodes].sort();
        setData(result);
        setMonths(sortedMonths);
        if (sortedMonths.length > 0) {
          setSelectedMonth(sortedMonths[sortedMonths.length - 1]);
        }
        setError(null);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Gagal memuat data fase dari database."
        );
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 space-y-3">
          <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-slate-200 rounded animate-pulse" />
          <div className="h-[500px] w-full bg-slate-100 rounded-lg animate-pulse mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">Gagal memuat data fase tanam</p>
              <p className="mt-0.5 text-red-600/90 dark:text-red-400/90">
                {error} Periksa koneksi database lalu muat ulang halaman.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || months.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">
            Belum ada data fase tanam untuk ditampilkan pada peta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
          Peta <span className="text-green-600">Sebaran</span> Fase Tanam
        </h2>
        <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
          Lihat sebaran fase tanam dominan per kecamatan dan per petak sawah
          untuk bulan yang dipilih.
        </p>
      </div>
      <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-4 max-w-xs">
          <Label htmlFor="map-month">Pilih Bulan</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="map-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Fase tanam dominan per kecamatan untuk bulan yang dipilih.
            </p>
            <TasikCityMapDynamic
              geoJsonKecamatan={tasikmalayaGeoJson}
              dataFase={data}
              phaseColorMapping={getPhaseColor}
              selectedMonth={selectedMonth}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sebaran per petak sawah untuk bulan yang dipilih.
            </p>
            <KecamatanMapDynamic
              geoJsonKecamatan={tasikmalayaGeoJson}
              geoJsonSawah={sawahGeoJson}
              dataFase={data}
              selectedMonth={selectedMonth}
              phaseColorMapping={getSawahPhaseColor}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center border-t border-slate-200 pt-4">
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
      </CardContent>
      </Card>
    </>
  );
}
