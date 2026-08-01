"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Wifi, AlertCircle } from "lucide-react";

type RicePrice = {
  id: string;
  tanggal: string;
  harga_medium: number;
  harga_premium: number | null;
};

export default function RealtimePriceTable() {
  const [rows, setRows] = useState<RicePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // 1. Ambil data awal
    async function loadInitial() {
      try {
        const { data } = await supabase
          .from("rice_prices")
          .select("id, tanggal, harga_medium, harga_premium")
          .order("tanggal", { ascending: false })
          .limit(30);
        if (cancelled) return;
        setRows(data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data harga terbaru.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitial();

    // 2. Dengarkan perubahan real-time (insert/update/delete oleh admin)
    const channel = supabase
      .channel("rice-prices-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rice_prices" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newRow = payload.new as RicePrice;
            setRows((prev) => {
              const withoutOld = prev.filter((r) => r.id !== newRow.id);
              return [newRow, ...withoutOld].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
            });
          }
          if (payload.eventType === "DELETE") {
            setRows((prev) => prev.filter((r) => r.id !== (payload.old as RicePrice).id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-600" />
          Harga Beras Terbaru
        </CardTitle>
        <CardDescription>Update otomatis begitu admin menambahkan data baru.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">Gagal memuat data harga terbaru</p>
              <p className="mt-0.5 text-red-600/90 dark:text-red-400/90">
                {error} Muat ulang halaman untuk mencoba lagi.
              </p>
            </div>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-500">Memuat data...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada data harga beras.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Medium</TableHead>
                <TableHead>Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.tanggal).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>Rp{r.harga_medium.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{r.harga_premium ? `Rp${r.harga_premium.toLocaleString("id-ID")}` : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}