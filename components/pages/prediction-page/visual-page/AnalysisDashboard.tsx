/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  MapPin,
  File as FileIcon,
  Info,
  Globe,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ValueType,
  NameType,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";

// --- Import Data GeoJSON ---
import { tasikmalayaGeoJson } from "@/lib/tasikmalaya-geojson";
import { sawahGeoJson } from "@/lib/bpn-sawah-geojson";

// --- Import semua helper functions dan interfaces dari file utils.tsx ---
import {
  formatKsaDate,
  kecamatanMap,
  getModus,
  validateStructure,
  getPhaseColor,
  getNextMonthKey,
  generatePredictions,
  CustomTooltip,
  ExcelData,
  AggregatedData,
  PredictedData,
  phaseToYValue,
  yValueToLabel,
  yAxisTicksNumeric,
  sortDataByKecamatan, // <-- Impor fungsi baru
} from "@/lib/utils";

// --- Pastikan KEDUA KOMPONEN PETA diimpor secara dinamis dengan ssr: false ---
const KecamatanMapDynamic = dynamic(() => import("@/components/KecamatanMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta Sawah/Kecamatan...</p>
    </div>
  ),
});

const TasikCityMap = dynamic(() => import("@/components/TasikCityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta Kota...</p>
    </div>
  ),
});

const AnalysisDashboard = () => {
  const [data, setData] = useState<ExcelData[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(
    null
  );
  const [aggregatedColumns, setAggregatedColumns] = useState<string[]>([]);
  const [predictedData, setPredictedData] = useState<PredictedData[] | null>(
    null
  );
  const [predictionColumns, setPredictionColumns] = useState<string[]>([]);
  const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
  const [pendingMapMonth, setPendingMapMonth] = useState<string>("");
  const [confirmedMapMonth, setConfirmedMapMonth] = useState<string>("");
  const [pendingSelectedKecamatan, setPendingSelectedKecamatan] = useState<
    string[]
  >([]);
  const [confirmedSelectedKecamatan, setConfirmedSelectedKecamatan] = useState<
    string[]
  >([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [
    pendingSelectedKecamatanPrediksi,
    setPendingSelectedKecamatanPrediksi,
  ] = useState<string[]>([]);
  const [
    confirmedSelectedKecamatanPrediksi,
    setConfirmedSelectedKecamatanPrediksi,
  ] = useState<string[]>([]);
  const [isSelectOpenPrediksi, setIsSelectOpenPrediksi] = useState(false);

  const processAggregation = (rows: ExcelData[], originalColumns: string[]) => {
    const idSegmenKey = originalColumns.find(
      (c) => c.toLowerCase().trim() === "id segmen"
    );
    const subsegmenKey = originalColumns.find(
      (c) => c.toLowerCase().trim() === "subsegmen"
    );
    if (!idSegmenKey || !subsegmenKey) {
      setError(
        "Struktur file tidak sesuai. Kolom 'id segmen' atau 'subsegmen' tidak ditemukan."
      );
      return;
    }

    const groupedByKecamatan: { [key: string]: ExcelData[] } = {};
    rows.forEach((row) => {
      const idSegmen = String(row[idSegmenKey] || "");
      const kodeKecamatan = idSegmen.substring(0, 7);
      const namaKecamatan = kecamatanMap[kodeKecamatan];
      if (namaKecamatan) {
        if (!groupedByKecamatan[namaKecamatan])
          groupedByKecamatan[namaKecamatan] = [];
        groupedByKecamatan[namaKecamatan].push(row);
      }
    });

    const monthColumns = originalColumns.filter(
      (c) =>
        c.toLowerCase().trim() !== "id segmen" &&
        c.toLowerCase().trim() !== "subsegmen"
    );

    const result: AggregatedData[] = [];
    for (const namaKecamatan in groupedByKecamatan) {
      const kecamatanData = groupedByKecamatan[namaKecamatan];
      const newRow: AggregatedData = { kecamatan: namaKecamatan };
      monthColumns.forEach((month) => {
        const cleanedPhases = kecamatanData
          .map((d: ExcelData) => {
            let phaseValue = d[month];
            if (typeof phaseValue === "string")
              phaseValue = parseFloat(phaseValue);
            if (phaseValue === 13 || phaseValue === 4.5) return 5.0;
            return phaseValue;
          })
          .filter((v: any) => v != null);

        newRow[month] = getModus(cleanedPhases);
      });
      result.push(newRow);
    }
    
    sortDataByKecamatan(result); // <-- Gunakan fungsi baru
    setAggregatedData(result);
    const aggCols = ["kecamatan", ...monthColumns];
    setAggregatedColumns(aggCols);

    if (aggCols.length > 1) {
      const { predictions: preds, columns: predCols } = generatePredictions(
        result,
        aggCols
      );
      setPredictedData(preds);
      setPredictionColumns(predCols);
    } else {
      setPredictedData([]);
      const futureMonths = [];
      let currentMonthKeyForPrediction =
        monthColumns.length > 0 ? monthColumns[monthColumns.length - 1] : "124";
      for (let i = 0; i < 12; i++) {
        currentMonthKeyForPrediction = getNextMonthKey(
          currentMonthKeyForPrediction
        );
        futureMonths.push(currentMonthKeyForPrediction);
      }
      setPredictionColumns(["kecamatan", ...futureMonths]);
    }

    const kecamatanList = result.map((d) => d.kecamatan);
    setAllKecamatan(kecamatanList);
  };

  useEffect(() => {
    const DATA_URL =
      "https://raw.githubusercontent.com/pandupan/material_source_magang_bps_tasikmalaya/main/dataset_ksa_tasik_2025_v9.xlsx";
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data dari server: ${response.statusText}`
          );
        }
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });
        if (jsonData.length > 1) {
          const headers: string[] = jsonData[0].map(String);
          const validationError = validateStructure(headers);
          if (validationError) throw new Error(validationError);
          const rows: ExcelData[] = jsonData.slice(1).map((row: any[]) =>
            headers.reduce((acc: ExcelData, header: string, index: number) => {
              if (header) acc[header] = row[index];
              return acc;
            }, {})
          );
          const filteredHeaders = headers.filter((h) => h);
          setColumns(filteredHeaders);
          setData(rows);
          processAggregation(rows, filteredHeaders);
        } else {
          throw new Error(
            "File Excel tidak memiliki data atau header yang valid."
          );
        }
      } catch (err: any) {
        console.error(err);
        setError(`Terjadi kesalahan saat memproses data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allKecamatan.length > 0) {
      const defaultSelection = ["Mangkubumi", "Indihiang", "Cibeureum"];
      const availableDefault = defaultSelection.filter((k) =>
        allKecamatan.includes(k)
      );
      const initialSelection =
        availableDefault.length > 0
          ? availableDefault
          : allKecamatan.slice(0, 3);
      setPendingSelectedKecamatan(initialSelection);
      setConfirmedSelectedKecamatan(initialSelection);
      setPendingSelectedKecamatanPrediksi(initialSelection);
      setConfirmedSelectedKecamatanPrediksi(initialSelection);
    }
  }, [allKecamatan]);

  const combinedTableData = useMemo(() => {
    if (!aggregatedData && !predictedData) return { data: [], columns: [] };

    const combinedDataMap = new Map<string, AggregatedData | PredictedData>();

    if (aggregatedData) {
      aggregatedData.forEach((row) => {
        combinedDataMap.set(row.kecamatan, { ...row });
      });
    }

    if (predictedData) {
      predictedData.forEach((row) => {
        const existingRow = combinedDataMap.get(row.kecamatan) || {
          kecamatan: row.kecamatan,
        };
        combinedDataMap.set(row.kecamatan, { ...existingRow, ...row });
      });
    }

    const combinedResultData = Array.from(combinedDataMap.values());
    sortDataByKecamatan(combinedResultData); // <-- Gunakan fungsi baru

    const allMonthsSet = new Set<string>();
    if (aggregatedColumns.length > 1) {
      aggregatedColumns.slice(1).forEach((col) => allMonthsSet.add(col));
    }
    if (predictionColumns.length > 1) {
      predictionColumns.slice(1).forEach((col) => allMonthsSet.add(col));
    }

    const sortedAllMonths = Array.from(allMonthsSet).sort((a, b) => {
      const monthA = parseInt(String(a).slice(0, -2));
      const yearA = parseInt(String(a).slice(-2));
      const monthB = parseInt(String(b).slice(0, -2));
      const yearB = parseInt(String(b).slice(-2));

      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });

    const finalCombinedColumns = ["kecamatan", ...sortedAllMonths];

    return { data: combinedResultData, columns: finalCombinedColumns };
  }, [aggregatedData, predictedData, aggregatedColumns, predictionColumns]);

  useEffect(() => {
    if (combinedTableData.columns.length > 0 && !confirmedMapMonth) {
      const actualMonths = aggregatedColumns.filter((c) => c !== "kecamatan");
      const defaultMonth =
        actualMonths.length > 0
          ? actualMonths[actualMonths.length - 1]
          : combinedTableData.columns[1];
      if (defaultMonth) {
        setPendingMapMonth(defaultMonth);
        setConfirmedMapMonth(defaultMonth);
      }
    }
  }, [aggregatedColumns, combinedTableData.columns, confirmedMapMonth]);

  const yAxisDomain = useMemo(() => {
    const tickCount = yAxisTicksNumeric.length;
    return [-0.5, tickCount - 0.5];
  }, []);

  const chartData = useMemo(() => {
    if (!aggregatedData || confirmedSelectedKecamatan.length === 0) return [];

    const monthColumns = aggregatedColumns.filter((c) => c !== "kecamatan");
    const JITTER_AMOUNT = 0.15;

    return monthColumns.map((month) => {
      const dataPoint: any = { name: formatKsaDate(month, true) };
      const valueCounts: { [key: number]: string[] } = {};

      aggregatedData.forEach((row) => {
        if (confirmedSelectedKecamatan.includes(row.kecamatan)) {
          const originalPhase = parseFloat(row[month]);
          const yValue = phaseToYValue[String(originalPhase)] ?? null;
          dataPoint[row.kecamatan] = yValue;

          if (yValue !== null) {
            if (!valueCounts[yValue]) {
              valueCounts[yValue] = [];
            }
            valueCounts[yValue].push(row.kecamatan);
          }
        }
      });

      for (const yValue in valueCounts) {
        const overlappingKecamatan = valueCounts[yValue];
        const totalOverlaps = overlappingKecamatan.length;

        if (totalOverlaps > 1) {
          const startOffset = (-JITTER_AMOUNT * (totalOverlaps - 1)) / 2;

          overlappingKecamatan.forEach((kecamatanName, index) => {
            const jitter = startOffset + index * JITTER_AMOUNT;
            if (dataPoint[kecamatanName] !== null) {
              dataPoint[kecamatanName] += jitter;
            }
          });
        }
      }

      return dataPoint;
    });
  }, [aggregatedData, aggregatedColumns, confirmedSelectedKecamatan]);

  const predictedChartData = useMemo(() => {
    if (!predictedData || confirmedSelectedKecamatanPrediksi.length === 0)
      return [];

    const monthColumns = predictionColumns.filter((c) => c !== "kecamatan");
    const JITTER_AMOUNT = 0.15;

    return monthColumns.map((month) => {
      const dataPoint: any = { name: formatKsaDate(month, true) };
      const valueCounts: { [key: number]: string[] } = {};

      predictedData.forEach((row) => {
        if (confirmedSelectedKecamatanPrediksi.includes(row.kecamatan)) {
          const originalPhase = parseFloat(row[month]);
          const yValue = phaseToYValue[String(originalPhase)] ?? null;
          dataPoint[row.kecamatan] = yValue;

          if (yValue !== null) {
            if (!valueCounts[yValue]) {
              valueCounts[yValue] = [];
            }
            valueCounts[yValue].push(row.kecamatan);
          }
        }
      });

      for (const yValue in valueCounts) {
        const overlappingKecamatan = valueCounts[yValue];
        const totalOverlaps = overlappingKecamatan.length;

        if (totalOverlaps > 1) {
          const startOffset = (-JITTER_AMOUNT * (totalOverlaps - 1)) / 2;

          overlappingKecamatan.forEach((kecamatanName, index) => {
            const jitter = startOffset + index * JITTER_AMOUNT;
            if (dataPoint[kecamatanName] !== null) {
              dataPoint[kecamatanName] += jitter;
            }
          });
        }
      }

      return dataPoint;
    });
  }, [predictedData, predictionColumns, confirmedSelectedKecamatanPrediksi]);

  const availableMonthsForMap = useMemo(() => {
    const allMonths = combinedTableData.columns.filter(
      (c) => c !== "kecamatan"
    );
    return allMonths;
  }, [combinedTableData.columns]);

  const cityWideDominantPhase = useMemo(() => {
    if (!combinedTableData.data || !confirmedMapMonth) return null;

    const allPhasesInMonth = combinedTableData.data
      .map((row) => row[confirmedMapMonth])
      .filter((v) => v != null);

    if (allPhasesInMonth.length === 0) return null;

    return getModus(allPhasesInMonth);
  }, [combinedTableData.data, confirmedMapMonth]);

  const handleConfirmMapMonth = () => setConfirmedMapMonth(pendingMapMonth);
  const handlePendingKecamatanSelect = (kecamatan: string) =>
    setPendingSelectedKecamatan((prev) =>
      prev.includes(kecamatan)
        ? prev.filter((k) => k !== kecamatan)
        : [...prev, kecamatan]
    );
  const handleConfirmSelection = () => {
    setConfirmedSelectedKecamatan(pendingSelectedKecamatan);
    setIsSelectOpen(false);
  };
  const handlePendingKecamatanSelectPrediksi = (kecamatan: string) =>
    setPendingSelectedKecamatanPrediksi((prev) =>
      prev.includes(kecamatan)
        ? prev.filter((k) => k !== kecamatan)
        : [...prev, kecamatan]
    );
  const handleConfirmSelectionPrediksi = () => {
    setConfirmedSelectedKecamatanPrediksi(pendingSelectedKecamatanPrediksi);
    setIsSelectOpenPrediksi(false);
  };

  const handleSelectAll = (isPredictive: boolean) => {
    if (isPredictive) {
      setPendingSelectedKecamatanPrediksi([...allKecamatan]);
    } else {
      setPendingSelectedKecamatan([...allKecamatan]);
    }
  };

  const handleUnselectAll = (isPredictive: boolean) => {
    if (isPredictive) {
      setPendingSelectedKecamatanPrediksi([]);
    } else {
      setPendingSelectedKecamatan([]);
    }
  };

  const lineColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A4DE6C",
    "#D0ED57",
  ];

  return (
    <section
      id="visualisasi-interaktif"
      className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Visualisasi Hasil Analisis Kerangka Sampel Area
        </h2>
        <div className="w-24 h-1 bg-green-700 mx-auto" />
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Jelajahi data KSA terbaru dan prediksi untuk 12 bulan ke depan. Anda
          dapat menggunakan filter untuk melihat tren per kecamatan, atau lihat
          sebaran fase tanam pada peta geo-spasial interaktif.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 h-64">
          <Loader2 className="w-10 h-10 animate-spin text-green-700" />
          <span className="mt-4 text-lg font-semibold text-gray-700">
            Memuat Data Analisis Terbaru...
          </span>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center p-10 h-64 bg-red-50 rounded-lg">
          <AlertCircle className="w-10 h-10 text-red-600" />
          <p className="mt-4 text-lg font-semibold text-red-800">
            Gagal Memuat Data
          </p>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {/* Card Visualisasi Tren Fase Tanam */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="w-5 h-5 mr-2" />
                Visualisasi Tren Siklus Pertumbuhan Padi
              </CardTitle>
              <CardDescription>
                Grafik ini menggambarkan tren historis fase tanam padi yang
                paling dominan per kecamatan di Kota Tasikmalaya. Dengan
                memvisualisasikan tren padi bulanan, Anda dapat mengamati siklus
                tanam dan pola perubahan fase pertumbuhan padi dari waktu ke
                waktu secara dinamis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Gunakan menu dropdown untuk memilih satu atau lebih kecamatan,
                lalu klik "Konfirmasi Pilihan" untuk memperbarui grafik.
              </p>
              <div className="mb-4">
                <Label htmlFor="kecamatan-select">
                  Pilih Kecamatan (Data Actual)
                </Label>
                <Select open={isSelectOpen} onOpenChange={setIsSelectOpen}>
                  <SelectTrigger id="kecamatan-select">
                    <SelectValue placeholder="Pilih kecamatan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <div className="flex justify-between p-2 border-b">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs"
                        onClick={() => handleSelectAll(false)}
                      >
                        Pilih Semua
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-destructive"
                        onClick={() => handleUnselectAll(false)}
                      >
                        Hapus Pilihan
                      </Button>
                    </div>
                    {allKecamatan.map((kecamatan) => (
                      <div
                        key={kecamatan}
                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePendingKecamatanSelect(kecamatan)}
                      >
                        <Checkbox
                          id={`checkbox-${kecamatan}`}
                          checked={pendingSelectedKecamatan.includes(kecamatan)}
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                        />
                        <Label
                          htmlFor={`checkbox-${kecamatan}`}
                          className="flex-1 cursor-pointer"
                        >
                          {kecamatan}
                        </Label>
                      </div>
                    ))}
                    <div className="p-2 border-t">
                      <Button
                        onClick={handleConfirmSelection}
                        className="w-full"
                      >
                        Konfirmasi Pilihan
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={yAxisDomain as [number, number]}
                      ticks={yAxisTicksNumeric}
                      tickFormatter={(value) =>
                        yValueToLabel[String(Math.round(value))] || ""
                      }
                      interval={0}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {confirmedSelectedKecamatan.map((kecamatan, index) => (
                      <Line
                        key={kecamatan}
                        type="monotone"
                        dataKey={kecamatan}
                        stroke={lineColors[index % lineColors.length]}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card Visualisasi Prediksi Tren Fase Tanam */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="w-5 h-5 mr-2" />
                Visualisasi Prediksi Dari Tren Siklus Pertumbuhan Padi
              </CardTitle>
              <CardDescription>
                Grafik ini menyajikan proyeksi fase pertumbuhan padi untuk 12
                bulan ke depan, berdasarkan pola historis dari data KSA
                terakhir. Dengan algoritma support vector machine (SVM), kami
                memprediksi transisi fase tanam, memungkinkan Anda untuk
                mengantisipasi siklus pertanian mendatang per kecamatan di Kota
                Tasikmalaya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Silahkan anda dapat memilih kecamatan yang ingin Anda lihat
                prediksinya.
              </p>
              <div className="mb-4">
                <Label htmlFor="kecamatan-select-prediksi">
                  Pilih Kecamatan (Data Prediksi)
                </Label>
                <Select
                  open={isSelectOpenPrediksi}
                  onOpenChange={setIsSelectOpenPrediksi}
                >
                  <SelectTrigger id="kecamatan-select-prediksi">
                    <SelectValue placeholder="Pilih kecamatan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <div className="flex justify-between p-2 border-b">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs"
                        onClick={() => handleSelectAll(true)}
                      >
                        Pilih Semua
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-destructive"
                        onClick={() => handleUnselectAll(true)}
                      >
                        Hapus Pilihan
                      </Button>
                    </div>
                    {allKecamatan.map((kecamatan) => (
                      <div
                        key={kecamatan}
                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handlePendingKecamatanSelectPrediksi(kecamatan)
                        }
                      >
                        <Checkbox
                          id={`checkbox-prediksi-${kecamatan}`}
                          checked={pendingSelectedKecamatanPrediksi.includes(
                            kecamatan
                          )}
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                        />
                        <Label
                          htmlFor={`checkbox-prediksi-${kecamatan}`}
                          className="flex-1 cursor-pointer"
                        >
                          {kecamatan}
                        </Label>
                      </div>
                    ))}
                    <div className="p-2 border-t">
                      <Button
                        onClick={handleConfirmSelectionPrediksi}
                        className="w-full"
                      >
                        Konfirmasi Pilihan
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={predictedChartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={yAxisDomain as [number, number]}
                      ticks={yAxisTicksNumeric}
                      tickFormatter={(value) =>
                        yValueToLabel[String(Math.round(value))] || ""
                      }
                      interval={0}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {confirmedSelectedKecamatanPrediksi.map(
                      (kecamatan, index) => (
                        <Line
                          key={kecamatan}
                          type="monotone"
                          dataKey={kecamatan}
                          stroke={lineColors[index % lineColors.length]}
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Peta Sebaran Fase Tanam per Sawah/Kecamatan
              </CardTitle>
              <CardDescription>
                Peta interaktif ini memvisualisasikan fase tanam padi yang
                dominan pada petak-petak sawah individual di setiap kecamatan
                untuk bulan yang dipilih, memberikan detail distribusi fase
                tanam.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Pilih bulan yang diinginkan lalu klik "Terapkan" untuk
                memperbarui warna pada peta sesuai fase tanam.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-grow">
                  <Label htmlFor="month-select-map">Pilih Bulan</Label>
                  <Select
                    value={pendingMapMonth}
                    onValueChange={setPendingMapMonth}
                  >
                    <SelectTrigger id="month-select-map">
                      <SelectValue placeholder="Pilih bulan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonthsForMap.map((month) => (
                        <SelectItem key={month} value={month}>
                          {formatKsaDate(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleConfirmMapMonth} className="self-end">
                  Terapkan
                </Button>
              </div>
              <KecamatanMapDynamic
                geoJsonKecamatan={tasikmalayaGeoJson}
                geoJsonSawah={sawahGeoJson}
                dataFase={combinedTableData.data}
                selectedMonth={confirmedMapMonth}
                phaseColorMapping={getPhaseColor}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Peta Fase Tanam Dominan Kota Tasikmalaya
              </CardTitle>
              <CardDescription>
                Peta ini menampilkan fase tanam dominan untuk seluruh wilayah
                Kota Tasikmalaya berdasarkan bulan yang dipilih. Seluruh area
                kota akan diwarnai sesuai dengan fase tanam yang paling sering
                muncul di semua kecamatan pada bulan tersebut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Pilih bulan yang diinginkan, kemudian klik "Terapkan" untuk
                melihat fase dominan seluruh kota pada peta.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-grow">
                  <Label htmlFor="month-select-city-map">Pilih Bulan</Label>
                  <Select
                    value={pendingMapMonth}
                    onValueChange={setPendingMapMonth}
                  >
                    <SelectTrigger id="month-select-city-map">
                      <SelectValue placeholder="Pilih bulan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonthsForMap.map((month) => (
                        <SelectItem key={month} value={month}>
                          {formatKsaDate(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleConfirmMapMonth} className="self-end">
                  Terapkan
                </Button>
              </div>
              <TasikCityMap
                geoJsonKecamatan={tasikmalayaGeoJson}
                dataFaseKota={cityWideDominantPhase}
                phaseColorMapping={getPhaseColor}
                selectedMonth={confirmedMapMonth}
              />
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
};

export default AnalysisDashboard;