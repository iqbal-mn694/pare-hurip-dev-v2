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
      title: 'LSTM',
      desc: 'Long Short-Term Memory (LSTM) adalah model deep learning yang mampu mengingat pola jangka panjang pada data deret waktu (time-series), digunakan untuk memprediksi harga beras harian dan luas panen bulanan dengan akurasi tinggi hingga 12 bulan ke depan.',
      color: 'from-green-50 to-green-100',
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-blue-600" />,
      title: 'Transformer',
      desc: 'Transformer adalah model deep learning dengan attention mechanism yang mampu menangkap dependensi jangka panjang dan pola multi-fitur pada data time-series. Teknologi ini memberikan prediksi akurat untuk harga beras dan produksi padi dengan pemahaman konteks yang mendalam.',
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
            Teknologi <span className="text-green-600">Deep Learning</span>{' '}
            di Balik Prediksi
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Menggabungkan model deep learning LSTM dan Transformer untuk hasil
            prediksi akurat dan real-time dalam mendukung ketahanan pangan,
            memberikan wawasan mendalam tentang fase tanam dan harga beras.
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