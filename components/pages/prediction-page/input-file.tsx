/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  UploadCloud,
  File as FileIcon,
  Loader2,
  AlertCircle,
  LineChart as LineChartIcon,
  AreaChart,
  MapPin,
  Globe,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Info,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Import Data GeoJSON ---
import { tasikmalayaGeoJson } from "@/lib/tasikmalaya-geojson";
import { sawahGeoJson } from "@/lib/bpn-sawah-geojson";

// --- Interfaces ---
interface ExcelData {
  [key: string]: any;
}
interface AggregatedData {
  kecamatan: string;
  [month: string]: any;
}
interface PredictedData {
  kecamatan: string;
  [month: string]: any;
}

// --- Dynamic Import ---
const KecamatanMapDynamic = dynamic(() => import("@/components/KecamatanMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta...</p>
    </div>
  ),
});
const TasikCityMapDynamic = dynamic(() => import("@/components/TasikCityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta...</p>
    </div>
  ),
});

// --- Helper Functions & Constants ---
const formatKsaDate = (header: string, short = false): string => {
  const headerStr = String(header);
  if (!/^\d{3,}$/.test(headerStr) && isNaN(parseInt(headerStr))) return header;
  try {
    const year = parseInt(headerStr.slice(-2));
    const month = parseInt(headerStr.slice(0, -2));
    const fullYear = 2000 + year;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const longMonthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    if (month >= 1 && month <= 12)
      return short
        ? `${monthNames[month - 1]} '${year}`
        : `${longMonthNames[month - 1]} ${fullYear}`;
    return header;
  } catch (error) {
    return header;
  }
};
const kecamatanMap: { [key: string]: string } = {
  "3278071": "Bungursari",
  "3278030": "Cibeureum",
  "3278050": "Cihideung",
  "3278080": "Cipedes",
  "3278070": "Indihiang",
  "3278010": "Kawalu",
  "3278060": "Mangkubumi",
  "3278031": "Purbaratu",
  "3278020": "Tamansari",
  "3278040": "Tawang",
};

// --- KODE BARU: Definisikan urutan kecamatan yang diinginkan ---
const customKecamatanOrder = [
  "Kawalu",
  "Tamansari",
  "Cibeureum",
  "Purbaratu",
  "Tawang",
  "Cihideung",
  "Mangkubumi",
  "Indihiang",
  "Bungursari",
  "Cipedes",
];

const getModus = (arr: any[]): any => {
  if (!arr.length) return null;
  const freqMap: { [key: string]: number } = {};
  let maxFreq = 0;
  let modus: any = null;
  arr.forEach((item) => {
    const key = String(item);
    freqMap[key] = (freqMap[key] || 0) + 1;
    if (freqMap[key] > maxFreq) {
      maxFreq = freqMap[key];
      modus = item;
    }
  });
  return modus;
};
const validateStructure = (headers: string[]): string | null => {
  const lowercasedHeaders = headers.map((h) => h.toLowerCase().trim());
  if (!lowercasedHeaders.includes("id segmen"))
    return "Struktur file tidak sesuai. Kolom 'id segmen' tidak ditemukan.";
  if (!lowercasedHeaders.includes("subsegmen"))
    return "Struktur file tidak sesuai. Kolom 'subsegmen' tidak ditemukan.";
  return null;
};
const displayOrder = [1.0, 2.0, 3.1, 3.2, 3.3, 4.0, 13.0, 5.0];
const yValueToLabel: { [key: string]: string } = {
  "0": "Vegetatif 1",
  "1": "Vegetatif 2",
  "2": "Generatif 1",
  "3": "Generatif 2",
  "4": "Generatif 3",
  "5": "Panen",
  "6": "Pasca Panen",
  "7": "Persiapan Lahan",
};
const phaseToYValue: { [key: string]: number } = {};
displayOrder.forEach((phase, index) => {
  phaseToYValue[String(phase)] = index;
});
const yAxisTicksNumeric = displayOrder.map((_, index) => index);
const getPhaseColor = (phase: number | null): string => {
  if (phase === null) return "#9E9E9E";
  switch (phase) {
    case 5:
      return "#A16D28";
    case 1:
      return "#3E5F44";
    case 2:
      return "#5E936C";
    case 3.1:
      return "#93DA97";
    case 3.2:
      return "#B5E8B8";
    case 3.3:
      return "#DAF5DB";
    case 4:
      return "#FED16A";
    case 13:
      return "#665123";
    case 6:
      return "#101010";
    case 8:
      return "#BDBDBD";
    default:
      return "#78909C";
  }
};
// --- CUSTOM TOOLTIP DIPERBAIKI ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 text-sm shadow-lg">
        <CardHeader className="p-1 font-bold border-b mb-1">
          {formatKsaDate(String(label))}
        </CardHeader>
        <CardContent className="p-1">
          {payload.map((pld: Payload<ValueType, NameType>) => {
            const roundedValue =
              pld.value !== null && pld.value !== undefined
                ? Math.round(pld.value as number)
                : null;

            return (
              <div key={pld.dataKey as React.Key} className="flex items-center">
                <div
                  style={{ backgroundColor: pld.color as string }}
                  className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"
                ></div>
                <span className="flex-1 truncate">
                  {pld.dataKey as string}:{" "}
                </span>
                <span className="font-semibold ml-2">
                  {roundedValue !== null
                    ? yValueToLabel[String(roundedValue)] || "N/A"
                    : "N/A"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }
  return null;
};

const InputFile = () => {
  const [data, setData] = useState<ExcelData[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const yAxisDomain = useMemo(() => {
    const tickCount = yAxisTicksNumeric.length;
    return [-0.5, tickCount - 0.5];
  }, []);
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

  const generatePredictions = (
    aggData: AggregatedData[],
    aggCols: string[]
  ): { predictions: PredictedData[]; columns: string[] } => {
    const faseSiklus = [5.0, 1.0, 2.0, 3.1, 3.2, 3.3, 4.0, 13.0];
    const lastMonthKey = aggCols[aggCols.length - 1];
    const getNextMonthKey = (monthKey: string): string => {
      const month = parseInt(monthKey.slice(0, -2));
      const year = parseInt(monthKey.slice(-2));
      return month === 12 ? `1${year + 1}` : `${month + 1}${year}`;
    };
    const predictions: PredictedData[] = [];
    const newColumns: string[] = ["kecamatan"];
    let currentMonthKey = lastMonthKey;
    if (!currentMonthKey) return { predictions: [], columns: [] };
    for (let i = 0; i < 12; i++) {
      currentMonthKey = getNextMonthKey(currentMonthKey);
      newColumns.push(currentMonthKey);
    }
    aggData.forEach((row) => {
      const newRow: PredictedData = { kecamatan: row.kecamatan };
      let lastPhase = parseFloat(row[lastMonthKey]);
      if (isNaN(lastPhase) || ![...faseSiklus, 6.0, 8.0].includes(lastPhase)) {
        lastPhase = 5.0;
      }
      let currentIndex = faseSiklus.indexOf(lastPhase);
      if (currentIndex === -1) {
        currentIndex = faseSiklus.indexOf(5.0) - 1;
      }
      newColumns.slice(1).forEach((monthKey) => {
        currentIndex = (currentIndex + 1) % faseSiklus.length;
        const nextPhase = faseSiklus[currentIndex];
        newRow[monthKey] = nextPhase;
      });
      predictions.push(newRow);
    });
    return { predictions, columns: newColumns };
  };
  const processAggregation = (rows: ExcelData[], originalColumns: string[]) => {
    const idSegmenKey = originalColumns.find(
      (c) => c.toLowerCase().trim() === "id segmen"
    );
    const subsegmenKey = originalColumns.find(
      (c) => c.toLowerCase().trim() === "subsegmen"
    );
    if (!idSegmenKey || !subsegmenKey) return;
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
        newRow[month] = getModus(
          kecamatanData.map((d) => d[month]).filter((v) => v != null)
        );
      });
      result.push(newRow);
    }
    
    // --- KODE LAMA (DIHAPUS ATAU DIKOMENTARI) ---
    // result.sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));

    // --- KODE BARU: Gunakan urutan kustom untuk mengurutkan data ---
    result.sort((a, b) => {
      const indexA = customKecamatanOrder.indexOf(a.kecamatan);
      const indexB = customKecamatanOrder.indexOf(b.kecamatan);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    setAggregatedData(result);
    const aggCols = ["kecamatan", ...monthColumns];
    setAggregatedColumns(aggCols);
    const { predictions: preds, columns: predCols } = generatePredictions(
      result,
      aggCols
    );
    setPredictedData(preds);
    setPredictionColumns(predCols);
    setAllKecamatan(result.map((d) => d.kecamatan));
  };
  const processFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setAggregatedData(null);
    setPredictedData(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
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
            headers.reduce((acc, header, index) => {
              if (header) acc[header] = row[index];
              return acc;
            }, {} as ExcelData)
          );
          setColumns(headers.filter((h) => h));
          setData(rows);
          processAggregation(
            rows,
            headers.filter((h) => h)
          );
        } else {
          setError("File Excel tidak memiliki data atau hanya header.");
        }
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memproses file.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Gagal membaca file.");
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleReset = () => {
    setData(null);
    setAggregatedData(null);
    setPredictedData(null);
    setColumns([]);
    setAllKecamatan([]);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleConfirmMapMonth = () => setConfirmedMapMonth(pendingMapMonth);
  const handlePendingKecamatanSelect = (kecamatan: string) =>
    setPendingSelectedKecamatan((prev) =>
      prev.includes(kecamatan)
        ? prev.filter((k) => k !== kecamatan)
        : [...prev, kecamatan]
    );
  const handleConfirmSelection = () => {
    setIsSelectOpen(false);
    setConfirmedSelectedKecamatan(pendingSelectedKecamatan);
  };
  const handlePendingKecamatanSelectPrediksi = (kecamatan: string) =>
    setPendingSelectedKecamatanPrediksi((prev) =>
      prev.includes(kecamatan)
        ? prev.filter((k) => k !== kecamatan)
        : [...prev, kecamatan]
    );
  const handleConfirmSelectionPrediksi = () => {
    setIsSelectOpenPrediksi(false);
    setConfirmedSelectedKecamatanPrediksi(pendingSelectedKecamatanPrediksi);
  };
  const handleSelectAll = (isPredictive: boolean) => {
    const targetSetter = isPredictive
      ? setPendingSelectedKecamatanPrediksi
      : setPendingSelectedKecamatan;
    targetSetter([...allKecamatan]);
  };
  const handleUnselectAll = (isPredictive: boolean) => {
    const targetSetter = isPredictive
      ? setPendingSelectedKecamatanPrediksi
      : setPendingSelectedKecamatan;
    targetSetter([]);
  };

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
    if (!aggregatedData) return { data: [], columns: [] };
    const combinedData = aggregatedData.map((aggRow) => {
      const predRow = predictedData?.find(
        (p) => p.kecamatan === aggRow.kecamatan
      );
      return { ...aggRow, ...(predRow || {}) };
    });
    const predColsOnly = predictionColumns.filter((c) => c !== "kecamatan");
    return {
      data: combinedData,
      columns: [...aggregatedColumns, ...predColsOnly],
    };
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

  // --- CHARTDATA DIPERBAIKI ---
  const chartData = useMemo(() => {
    if (!aggregatedData || confirmedSelectedKecamatan.length === 0) return [];
    const monthColumns = aggregatedColumns.filter((c) => c !== "kecamatan");
    const JITTER_AMOUNT = 0.15;

    return monthColumns.map((month) => {
      const dataPoint: any = { name: formatKsaDate(month, true) };
      const valueCounts: { [key: number]: string[] } = {};

      aggregatedData.forEach((row) => {
        if (confirmedSelectedKecamatan.includes(row.kecamatan)) {
          const yValue = phaseToYValue[String(parseFloat(row[month]))] ?? null;
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
        if (overlappingKecamatan.length > 1) {
          const totalOverlaps = overlappingKecamatan.length;
          const startOffset = (-JITTER_AMOUNT * (totalOverlaps - 1)) / 2;
          overlappingKecamatan.forEach((kecamatanName, index) => {
            if (dataPoint[kecamatanName] !== null) {
              dataPoint[kecamatanName] += startOffset + index * JITTER_AMOUNT;
            }
          });
        }
      }
      return dataPoint;
    });
  }, [aggregatedData, aggregatedColumns, confirmedSelectedKecamatan]);

  // --- PREDICTEDCHARTDATA DIPERBAIKI ---
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
          const yValue = phaseToYValue[String(parseFloat(row[month]))] ?? null;
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
        if (overlappingKecamatan.length > 1) {
          const totalOverlaps = overlappingKecamatan.length;
          const startOffset = (-JITTER_AMOUNT * (totalOverlaps - 1)) / 2;
          overlappingKecamatan.forEach((kecamatanName, index) => {
            if (dataPoint[kecamatanName] !== null) {
              dataPoint[kecamatanName] += startOffset + index * JITTER_AMOUNT;
            }
          });
        }
      }
      return dataPoint;
    });
  }, [predictedData, predictionColumns, confirmedSelectedKecamatanPrediksi]);

  const cityWideDominantPhase = useMemo(() => {
    if (!combinedTableData.data || !confirmedMapMonth) return null;
    const allPhasesInMonth = combinedTableData.data
      .map((row) => row[confirmedMapMonth])
      .filter((v) => v != null);
    if (allPhasesInMonth.length === 0) return null;
    return getModus(allPhasesInMonth);
  }, [combinedTableData.data, confirmedMapMonth]);

  const availableMonthsForMap = useMemo(() => {
    return combinedTableData.columns.filter((c) => c !== "kecamatan");
  }, [combinedTableData.columns]);

  const AccordionStep = ({
    value,
    label,
    description,
    imageUrl,
  }: {
    value: string;
    label: string;
    description: string;
    imageUrl: string;
  }) => (
    <AccordionItem value={value} className="border-b-0">
      <AccordionTrigger className="hover:no-underline">
        {label}
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
        <div className="relative h-40 md:h-56 w-full rounded-md overflow-hidden border">
          <Image
            src={imageUrl}
            alt={`Contoh untuk ${label}`}
            layout="fill"
            objectFit="contain"
            className="bg-gray-50 dark:bg-gray-800"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <section className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Memasukan Data Kerangka Sampel Area (KSA)
        </h2>
        <div className="w-24 h-1 bg-green-700 mx-auto" />
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Anda dapat melakukan import data dengan format yang disesuaikan
          sehingga setelahnya dapat dilakukan explorasi mendalam menggunakan
          filter untuk melihat tren per kecamatan, atau lihat sebaran fase tanam
          pada peta geo-spasial interaktif.
        </p>
      </div>

      <Input
        id="file-upload"
        type="file"
        className="sr-only"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx"
      />

      {!data && !isLoading && !error && (
        <div className="space-y-6">
          <Card className="w-full shadow-sm">
            <CardContent>
              <div className="flex text-center items-center rounded-lg justify-center flex-col w-full space-y-4 lg:py-14 py-4 px-2 bg-muted dark:bg-gray-800/50">
                <FileSpreadsheet className="w-20 h-20 text-gray-400" />
                <h2 className="font-semibold text-lg text-center">
                  Silakan unggah file untuk melakukan import data
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center m-auto max-w-2xl">
                  Gunakan file Excel (.xlsx) yang berisi data KSA. Untuk
                  memastikan format yang benar, Anda bisa mengunduh template
                  yang telah kami sediakan dengan menekan tombol{" "}
                  <b>'Unduh Template'</b> di bawah ini.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                  <a
                    href="https://github.com/pandupan/material_source_magang_bps_tasikmalaya/blob/main/dataset_ksa_tasik_2025_v9.xlsx"
                  >
                    <Button
                      variant="outline"
                      className="text-sm lg:text-base gap-2 w-full sm:w-auto"
                    >
                      <Download className="w-5 h-5" />
                      Unduh File Template
                    </Button>
                  </a>
                  <Button
                    className="text-sm lg:text-base gap-2 bg-[#016630]"
                    onClick={handleImportClick}
                  >
                    <UploadCloud className="w-5 h-5" />
                    Import Data dari File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Bingung dengan format file?
              </CardTitle>
              <CardDescription>
                Berikut adalah panduan pengisian untuk setiap kolom pada file
                template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full space-y-2">
                <AccordionStep
                  value="item-1"
                  label="Langkah 1: Kolom 'id segmen' dan 'subsegmen'"
                  description="Kolom 2 berisi 'subsegmen' untuk kode setiap wilayah kecamatan di kota Tasikmalaya. Penulisan kode id_segmen menggunakan kode provinsi (32) diikuti kode kota (78) dan kode kecamatan (010).
Contoh : 327801004"
                  imageUrl="https://i.ibb.co.com/ZpqYjxGJ/step-1.png"
                />
                <AccordionStep
                  value="item-2"
                  label="Langkah 2: Kolom Data Bulanan (Contoh: 124, 224)"
                  description="Kolom 2 berisi 'subsegmen' untuk menunjukkan penempatan kotak didalam segmen.
Contoh : Kode A2 menunjukkan titik kotak koordinat mana yang sedang diamati."
                  imageUrl="https://i.ibb.co.com/Y4WphcVt/Screenshot-2025-09-21-163015.png"
                />
                <AccordionStep
                  value="item-3"
                  label="Langkah 3: Pengisian Data Fase Tanam"
                  description="Kolom 3 berisi kode bulan dan tahun untuk menandakan hasil amatan dari setiap bulan dan tahun yang dilakukan.
Contoh : 124 menunjukkan bulan Januari dan 2024 "
                  imageUrl="https://i.ibb.co.com/Q3SPJwtf/Screenshot-2025-09-21-163203.png"
                />
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 h-64">
          <Loader2 className="w-10 h-10 animate-spin text-green-700" />
          <span className="mt-4 text-lg font-semibold text-gray-700">
            Memvalidasi dan memproses file...
          </span>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center p-10 h-64 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-10 h-10 text-red-600" />
          <p className="mt-4 text-lg font-semibold text-red-800 dark:text-red-300">
            Gagal Memproses File
          </p>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400 text-center">
            {error}
          </p>
          <Button
            onClick={handleReset}
            variant="destructive"
            className="mt-4 gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>
      )}

      {data && !isLoading && !error && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <FileIcon className="w-5 h-5 mr-2" />
                    Data Berhasil Diimpor
                  </CardTitle>
                  <CardDescription>
                    File{" "}
                    <span className="font-semibold text-green-600">
                      {fileName}
                    </span>{" "}
                    telah diproses. Berikut hasilnya.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Unggah File Lain
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Sisa komponen visualisasi (Grafik dan Peta) tetap sama */}
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
                  Pilih Kecamatan (Data Aktual)
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
                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm"
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
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    {/* YAXIS DIPERBAIKI */}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AreaChart className="w-5 h-5 mr-2" />
                Visualisasi Prediksi Dari Tren Siklus Pertumbuhan Padi
              </CardTitle>
              <CardDescription>
                Grafik ini menyajikan proyeksi fase pertumbuhan padi untuk 12
                bulan ke depan, berdasarkan pola historis dari data KSA
                terakhir menggunakan algoritma prediksi deep learning LSTM dan Transformer. 
                Dengan teknologi ini, kami memprediksi transisi fase tanam dengan akurasi tinggi, 
                memungkinkan Anda untuk mengantisipasi siklus pertanian mendatang per kecamatan di Kota
                Tasikmalaya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Pilih bulan yang diinginkan lalu klik "Terapkan" untuk
                memperbarui warna pada peta sesuai fase tanam.
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
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    {/* YAXIS DIPERBAIKI */}
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
              <TasikCityMapDynamic
                geoJsonKecamatan={tasikmalayaGeoJson}
                dataFaseKota={cityWideDominantPhase}
                phaseColorMapping={getPhaseColor}
                selectedMonth={confirmedMapMonth}
              />
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
        </>
      )}
    </section>
  );
};

export default InputFile;