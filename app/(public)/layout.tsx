import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prediksi Fase Tanam KSA & Harga Beras | BPS Kota Tasikmalaya",
  description: "Sistem prediksi fase tanam berbasis Kerangka Sampel Area (KSA) dan analisis harga beras real-time di Kota Tasikmalaya oleh BPS Kota Tasikmalaya.",
  keywords: [
    "Beras Tasikmalaya",
    "Prediksi Harga Beras",
    "Fase Tanam KSA",
    "BPS Kota Tasikmalaya",
    "Kerangka Sampel Area",
    "Pangan Tasikmalaya",
    "Pertanian Tasikmalaya",
  ],
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="overflow-x-hidden">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
