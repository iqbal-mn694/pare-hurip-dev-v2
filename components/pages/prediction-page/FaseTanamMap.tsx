/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
import { Label } from "@/components/ui/label";
import { Loader2, MapIcon } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import {
  kecamatanMap,
  getPhaseColor,
  getModus,
  displayOrder,
} from "@/lib/utils";
import { tasikmalayaGeoJson } from "@/lib/tasikmalaya-geojson";
import { sawahGeoJson } from "@/lib/bpn-sawah-geojson";

const KecamatanMapDynamic = dynamic(() => import("@/components/KecamatanMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2 text-sm text-muted-foreground">Memuat Peta...</p>
    </div>
  ),
});

const TasikCityMapDynamic = dynamic(() => import("@/components/TasikCityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2 text-sm text-muted-foreground">Memuat Peta...</p>
    </div>
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("data_ksa")
        .select("segment_id, subsegment, periode, phase")
        .not("phase", "like", "7.%")
        .neq("phase", "8")
        .order("periode", { ascending: true });

      if (error || !rows || rows.length === 0) {
        setLoading(false);
        return;
      }

      const perKec = new Map<string, { periode: string; phase: string }[]>();
      for (const row of rows as any[]) {
        const kode = String(row.segment_id).slice(0, 7);
        const nama = kecamatanMap[kode];
        if (!nama) continue;
        const list = perKec.get(nama) ?? [];
        list.push({ periode: row.periode, phase: row.phase });
        perKec.set(nama, list);
      }

      const result: any[] = [];
      const allPeriodes = new Set<string>();

      for (const [nama, records] of perKec) {
        const byPeriode = new Map<string, string[]>();
        for (const r of records) {
          const list = byPeriode.get(r.periode) ?? [];
          list.push(r.phase);
          byPeriode.set(r.periode, list);
          allPeriodes.add(r.periode);
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
      setLoading(false);
    }
    fetchData();
  }, []);

  const cityWidePhase = useMemo(() => {
    if (!data || !selectedMonth) return null;
    const allPhases = data
      .map((d) => d[selectedMonth])
      .filter((v: any) => v != null);
    if (allPhases.length === 0) return null;
    return getModus(allPhases);
  }, [data, selectedMonth]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Memuat data peta...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || months.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-emerald-600" />
          Peta Sebaran Fase Tanam
        </CardTitle>
        <CardDescription>
          Fase tanam dominan per kecamatan (kiri) dan sebaran per petak sawah
          (kanan) untuk bulan yang dipilih.
        </CardDescription>
      </CardHeader>
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
          <TasikCityMapDynamic
            geoJsonKecamatan={tasikmalayaGeoJson}
            dataFaseKota={cityWidePhase}
            phaseColorMapping={getPhaseColor}
            selectedMonth={selectedMonth}
          />
          <KecamatanMapDynamic
            geoJsonKecamatan={tasikmalayaGeoJson}
            geoJsonSawah={sawahGeoJson}
            dataFase={data}
            selectedMonth={selectedMonth}
            phaseColorMapping={getPhaseColor}
          />
        </div>
      </CardContent>
    </Card>
  );
}
