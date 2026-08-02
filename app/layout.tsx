import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/components/pages/admin-page/AdminAuthContext";
import { ThemeProvider } from "@/lib/theme-context";
import RouteTransitionLoader from "@/components/layout/RouteTransitionLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://parehurip.app"),
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
  openGraph: {
    title: "Prediksi Fase Tanam KSA & Harga Beras | BPS Kota Tasikmalaya",
    description: "Sistem prediksi fase tanam berbasis Kerangka Sampel Area (KSA) dan analisis harga beras real-time di Kota Tasikmalaya oleh BPS Kota Tasikmalaya.",
    url: "https://parehurip.app",
    siteName: "Pare Hurip 2.0",
    locale: "id_ID",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){try{var t=localStorage.getItem(\"theme\");var d=t?t===\"dark\":(new Date().getHours()>=18||new Date().getHours()<6);document.documentElement.classList.toggle(\"dark\",d)}catch(e){}})();",
          }}
        />
        <ThemeProvider>
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ThemeProvider>
        <RouteTransitionLoader />
      </body>
    </html>
  );
}
