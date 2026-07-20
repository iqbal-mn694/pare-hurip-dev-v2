/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useRef, useEffect, useState } from 'react';
import CompareKsa from '@/components/pages/compare-page/CompareKsa';
import LuasPanen from '@/components/pages/compare-page/luas-panen';
import {
  BarChart3,
  Wheat,
  TrendingUp,
  CalendarClock,
  ArrowDown
} from 'lucide-react';

export default function Page() {
  const luasPanenRef = useRef<HTMLDivElement>(null);

  const scrollToLuasPanen = () =>
    luasPanenRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30 min-h-screen">
      {/* HERO */}
      <header className="pt-28 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-white leading-tight">
              Pantau <span className="text-green-600">Fase Tanam</span> &<br />
              Prediksi <span className="text-yellow-500">Luas Panen</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-lg">
              Data terbaru luas panen & harga beras di Tasikmalaya, plus prediksi
              12 bulan ke depan berbasis Machine Learning & musiman.
            </p>
            <button
              onClick={scrollToLuasPanen}
              className="mt-6 flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-green-700 transition-all"
            >
              <CalendarClock size={20} />
              Lihat Jadwal Tanam
            </button>
          </div>
          <div className="hidden md:flex justify-end">
            <Wheat className="w-52 h-52 text-green-500/20 dark:text-green-400/20" strokeWidth={1} />
          </div>
        </div>
      </header>

      {/* INSIGHT CARDS */}
      <InsightCards />

      {/* CHARTS */}
      <main className="px-4 md:px-8 max-w-7xl mx-auto space-y-10 pb-20">
        {/* 1. Harga vs Fase */}
        <CompareKsa />

        {/* 2. Deskriptif sebelumnya */}
        <Deskriptif />

        {/* 3. Luas Panen */}
        <div ref={luasPanenRef}>
          <LuasPanen />
        </div>

        {/* 4. Insight baru setelah Luas Panen */}
        <LuasPanenInsight />
      </main>

      {/* CTA FOOTER */}
      <footer className="bg-green-600 text-white py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Butuh laporan lebih detail?
          </h2>
          <p className="text-green-100 max-w-md mx-auto mb-6">
            Kami siap bantu petani, dinas, atau lembaga riset dengan data mentah
            atau API lebih lanjut.
          </p>
          <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition">
            Kontak Kami
          </button>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Komponen tambahan                                 */
/* -------------------------------------------------- */

function InsightCards() {
  const [stats, setStats] = useState({
    luasPanen: 0,
    harga: 0,
    fase: 'Memuat…',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/luas-panen-avg').then((r) => r.json()),
      fetch('/api/harga-beras-avg').then((r) => r.json()),
      fetch('/api/fase-terkini').then((r) => r.json()),
    ])
      .then(([l, h, f]) =>
        setStats({ luasPanen: l.avg, harga: h.avg, fase: f.name }),
      )
      .catch(() =>
        setStats({ luasPanen: 913805, harga: 14579, fase: 'Generatif 1' }),
      );
  }, []);

  const items = [
    {
      label: 'Luas Panen Puncak 2025',
      value: `${stats.luasPanen.toLocaleString('id')} Ha`,
      icon: BarChart3,
      color: 'text-blue-500',
    },
    {
      label: 'Harga Rata-rata',
      value: `Rp ${stats.harga.toLocaleString('id')}`,
      icon: TrendingUp,
      color: 'text-yellow-500',
    },
    {
      label: 'Fase Aktif',
      value: stats.fase,
      icon: Wheat,
      color: 'text-green-500',
    },
  ];

  return (
    <section className="px-4 md:px-8 max-w-7xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4"
        >
          <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-700 ${color}`}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Deskriptif() {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 md:p-8 max-w-6xl mx-auto">
      <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3">
        💡 Apa yang bisa disimpulkan?
      </h3>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
        Grafik di atas menunjukkan bahwa lonjakan luas panen (garis biru)
        umumnya terjadi 1-2 bulan setelah fase{' '}
        <strong className="text-orange-500">Panen</strong> (batang jingga)
        dominan. Dengan prediksi musiman, kami memperkirakan{' '}
        <strong className="text-yellow-500">penurunan harga beras</strong> saat
        musim panen berlangsung dan kenaikan saat persiapan lahan kembali
        dimulai.
      </p>
      <p className="text-slate-600 dark:text-slate-300 mt-2">
        Gunakan data ini untuk menentukan jadwal tanam optimal dan antisipasi
        fluktuasi harga.
      </p>
    </section>
  );
}

function LuasPanenInsight() {
  const [stats, setStats] = useState({ luas: 0, harga: 0, fase: 'Memuat…' });

  useEffect(() => {
    Promise.all([
      fetch('/api/luas-panen-avg').then((r) => r.json()),
      fetch('/api/harga-beras-avg').then((r) => r.json()),
      fetch('/api/fase-terkini').then((r) => r.json()),
    ])
      .then(([l, h, f]) =>
        setStats({ luas: l.avg, harga: h.avg, fase: f.name }),
      )
      .catch(() =>
        setStats({ luas: 913805, harga: 14579, fase: 'Generatif 1' }),
      );
  }, []);

  return (
    <section className="max-w-6xl mx-auto mt-10 mb-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-500" size={28} />
          Maka Berdasarkan Pola Luas Panen 
        </h2>

        {/* highlight numbers */}
        <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Setiap kali batang jingga (fase Panen)
            muncul penuh di grafik, <em>1-2 bulan kemudian</em> garis biru melonjak
            tanda petani memanen secara massal. Kita bisa
            memperkirakan titik terendah harga saat pasokan beras mencapai puncak.
          </p>
          <p>
            🚀 <strong>Tips:</strong> Jadwalkan penanaman agar panen
            Anda <strong>Tidak Bersamaan</strong> dengan gelombang panen. Dengan begitu, Anda bisa
            menjual di harga lebih tinggi dan memaksimalkan keuntungan.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <ArrowDown className="w-6 h-6 text-green-500 animate-bounce" />
        </div>
      </div>
    </section>
  );
}