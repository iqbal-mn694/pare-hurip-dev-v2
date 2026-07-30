/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ValueType,
  NameType,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ExcelData {
  [key: string]: any;
}
export interface AggregatedData {
  kecamatan: string;
  [month: string]: any;
}
export interface PredictedData {
  kecamatan: string;
  [month: string]: any;
}

export const formatKsaDate = (header: string, short = false): string => {
  const headerStr = String(header);
  if (!/^\d{3,}$/.test(headerStr) && isNaN(parseInt(headerStr))) return header;
  try {
    const year = parseInt(headerStr.slice(-2));
    const month = parseInt(headerStr.slice(0, -2));
    const fullYear = 2000 + year;
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    const longMonthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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

export const kecamatanMap: { [key: string]: string } = {
  "3278071": "Bungursari", "3278030": "Cibeureum", "3278050": "Cihideung",
  "3278080": "Cipedes", "3278070": "Indihiang", "3278010": "Kawalu",
  "3278060": "Mangkubumi", "3278031": "Purbaratu", "3278020": "Tamansari",
  "3278040": "Tawang",
};

export const getModus = (arr: any[]): any => {
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

export const validateStructure = (headers: string[]): string | null => {
  const lowercasedHeaders = headers.map((h) => h.toLowerCase().trim());
  if (!lowercasedHeaders.includes("id segmen"))
    return "Struktur file tidak sesuai. Kolom 'id segmen' tidak ditemukan.";
  if (!lowercasedHeaders.includes("subsegmen"))
    return "Struktur file tidak sesuai. Kolom 'subsegmen' tidak ditemukan.";
  return null;
};

export const getPhaseColor = (phase: number | null): string => {
  if (phase === null) return "#9E9E9E";
  if (phase === 13 || phase === 4.5) return "#A16D28";

  switch (phase) {
    case 5: return "#A16D28"; // Persiapan Lahan
    case 1: return "#3E5F44"; // Vegetatif 1
    case 2: return "#5E936C"; // Vegetatif 2
    case 3.1: return "#93DA97"; // Generatif 1
    case 3.2: return "#B5E8B8"; // Generatif 2
    case 3.3: return "#DAF5DB"; // Generatif 3
    case 4: return "#FED16A"; // Panen
    case 6: return "#101010"; // Puso
    case 8: return "#BDBDBD"; // Bukan Sawah
    default: return "#78909C"; // Default
  }
};

export const displayOrder = [
  1.0,   // Vegetatif 1
  2.0,   // Vegetatif 2
  3.1,   // Generatif 1
  3.2,   // Generatif 2
  3.3,   // Generatif 3
  4.0,   // Panen
  5.0,   // Persiapan Lahan
  6.0,   // Puso
];

export const phaseToYValue: { [key: string]: number } = {};
displayOrder.forEach((phase, index) => {
  phaseToYValue[String(phase)] = index;
});

export const yValueToLabel: { [key: string]: string } = {
  "0": "Vegetatif 1",
  "1": "Vegetatif 2",
  "2": "Generatif 1",
  "3": "Generatif 2",
  "4": "Generatif 3",
  "5": "Panen",
  "6": "Persiapan Lahan",
  "7": "Puso",
};

export const yAxisTicksNumeric = displayOrder.map((_, index) => index);

export const yAxisValueMap: { [key: string]: string } = {
  "1": "Vegetatif 1",
  "2": "Vegetatif 2",
  "3.1": "Generatif 1",
  "3.2": "Generatif 2",
  "3.3": "Generatif 3",
  "4": "Panen",
  "5": "Persiapan Lahan",
  "6": "Puso",
  "8": "Bukan Lahan Pertanian",
};

export const getNextMonthKey = (monthKey: string): string => {
  const month = parseInt(String(monthKey).slice(0, -2));
  const year = parseInt(String(monthKey).slice(-2));
  if (month === 12) return `1${year + 1}`;
  return `${month + 1}${year}`;
};

export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 text-sm shadow-lg">
          <CardHeader className="p-1 font-bold border-b mb-1">
            {typeof label === "string" || typeof label === "number"
              ? formatKsaDate(String(label))
              : String(label)}
          </CardHeader>
          <CardContent className="p-1">
            {payload.map((pld: Payload<ValueType, NameType>) => {
              const roundedValue = pld.value !== null && pld.value !== undefined 
                ? Math.round(pld.value as number) 
                : null;
              
              return (
                <div key={pld.dataKey as React.Key} className="flex items-center">
                  <div
                    style={{ backgroundColor: pld.color as string }}
                    className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"
                  ></div>
                  <span className="flex-1 truncate">{pld.dataKey as string}: </span>
                  <span className="font-semibold ml-2">
                    {roundedValue !== null ? (yValueToLabel[String(roundedValue)] || 'N/A') : 'N/A'}
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
  

export const generatePredictions = (
  aggData: AggregatedData[],
  aggCols: string[]
): { predictions: PredictedData[]; columns: string[] } => {
  const localPhaseOrder = [5.0, 1.0, 2.0, 3.1, 3.2, 3.3, 4.0];

  const lastMonthKey = aggCols[aggCols.length - 1];
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
    let lastPhase = row[lastMonthKey];

    if (typeof lastPhase === 'string') {
      lastPhase = parseFloat(lastPhase);
    }
    if (lastPhase === 13 || lastPhase === 4.5 || lastPhase === undefined || lastPhase === null) {
      lastPhase = 5.0;
    } else if (lastPhase === 6.0 || lastPhase === 8.0) {
        lastPhase = 5.0;
    }

    let currentIndex = localPhaseOrder.indexOf(lastPhase);

    if (currentIndex === -1) {
        currentIndex = 0;
        lastPhase = localPhaseOrder[currentIndex];
    }

    newColumns.slice(1).forEach((monthKey) => {
      const nextPhase =
        currentIndex === localPhaseOrder.length - 1
          ? localPhaseOrder[0]
          : localPhaseOrder[currentIndex + 1];

      newRow[monthKey] = nextPhase;
      lastPhase = nextPhase;
      currentIndex = localPhaseOrder.indexOf(lastPhase);
    });
    predictions.push(newRow);
  });
  return { predictions, columns: newColumns };
};

// --- KODE BARU YANG DITAMBAHKAN ---

// Definisikan urutan kecamatan yang Anda inginkan
export const customKecamatanOrder = [
  "Kawalu", "Tamansari", "Cibeureum", "Purbaratu", "Tawang",
  "Cihideung", "Mangkubumi", "Indihiang", "Bungursari", "Cipedes"
];

// Buat fungsi untuk mengurutkan data berdasarkan urutan di atas
export const sortDataByKecamatan = (data: { kecamatan: string }[]) => {
  // .sort() akan mengubah array aslinya secara langsung (in-place)
  data.sort((a, b) => {
    const indexA = customKecamatanOrder.indexOf(a.kecamatan);
    const indexB = customKecamatanOrder.indexOf(b.kecamatan);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  return data;
};