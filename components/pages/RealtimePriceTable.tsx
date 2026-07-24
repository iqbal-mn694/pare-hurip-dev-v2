"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Wifi } from "lucide-react";

type RicePrice = {
  id: string;
  tanggal: string;
  harga_medium: number;
  harga_premium: number | null;
};

export default function RealtimePriceTable() {
  const [rows, setRows] = useState<RicePrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil data awal
    supabase
      .from("rice_prices")
      .select("id, tanggal, harga_medium, harga_premium")
      .order("tanggal", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });

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
        {loading ? (
          <p className="text-sm text-gray-500">Memuat data...</p>
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