'use client'

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  CpuChipIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Algoritma = () => {
  const features = [
    {
      icon: <CpuChipIcon className="w-8 h-8 text-green-600" />,
      title: 'Markov Chain & Random Forest',
      desc: 'Kombinasi model statistik dan machine learning untuk memprediksi fase tumbuh padi (h+1, h+2, h+3 bulan). Markov Chain menghitung matriks transisi probabilistik antar fase, sementara Random Forest Classifier memanfaatkan fitur fase saat ini, fase sebelumnya, kecamatan, subsegmen, dan bulan dengan encoding sin/cos musiman untuk hasil yang lebih akurat.',
      color: 'from-green-50 to-green-100',
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-blue-600" />,
      title: 'LSTM Hybrid & Naive Baseline',
      desc: 'Model deep learning LSTM yang memprediksi delta harga harian (bukan harga absolut), direkonstruksi menjadi proyeksi 30 hari ke depan, lalu di-blend secara adaptif dengan baseline naive (harga terakhir) berdasarkan volatilitas historis — semakin stabil harga, semakin besar bobot ke baseline; semakin volatil, semakin besar bobot ke LSTM. Hasil prediksi dibatasi (clipped) maksimal ±15% dari harga terakhir sebagai pengaman.',
      color: 'from-blue-50 to-blue-100',
    },
    {
      icon: <SparklesIcon className="w-8 h-8 text-amber-600" />,
      title: 'Visualisasi Geospasial',
      desc: 'Kombinasi algoritma prediktif dipadukan dengan pemetaan geospasial interaktif, memudahkan pemantauan real-time sawah pada wilayah kota tasikmalaya, berdasarkan hasil pola musim & siklus fase tanam padi.',
      color: 'from-amber-50 to-amber-100',
    },
  ];

  // Ref for the container to detect when it's in view
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 }); // once: false ensures animation runs every time

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger the animation of children
      },
    },
  };

  // Animation variants for the card items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Teknologi <span className="text-green-600">Machine Learning</span>{' '}
            di Balik Prediksi
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Menggabungkan model statistik dan machine learning — Markov Chain,
            Random Forest, dan LSTM Hybrid — untuk hasil prediksi fase tanam
            dan harga beras yang akurat dan real-time dalam mendukung
            ketahanan pangan.
          </p>
        </div>

        {/* Animated Cards Grid */}
        <motion.div
          ref={ref}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${item.color} shadow-sm hover:shadow-lg transition-all duration-300`}
              variants={itemVariants}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/60 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {item.title}
                </h3>
              </div>
              <p className="mt-4 text-m text-slate-700 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Algoritma;