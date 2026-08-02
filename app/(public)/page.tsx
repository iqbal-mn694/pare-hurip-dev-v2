import type { Metadata } from "next";
import AboutKSA from "@/components/pages/landing-page/AboutKSA";
import Algorithm from "@/components/pages/landing-page/Algorithm";
import Benefits from "@/components/pages/landing-page/Benefits";
import Hero from "@/components/pages/landing-page/Hero";
import KSAMethod from "@/components/pages/landing-page/KSAMethod";
import RiceGrowthCycle from "@/components/pages/landing-page/RiceGrowthCycle";

export const metadata: Metadata = {
  title: "Prediksi KSA & Luas Panen Padi — Pare Hurip",
  description:
    "Sistem prediksi luas panen padi berbasis Kerangka Sampel Area (KSA) untuk Kota Tasikmalaya oleh BPS Kota Tasikmalaya.",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pare Hurip — Prediksi KSA & Luas Panen Padi",
  description: metadata.description,
  provider: {
    "@type": "GovernmentOrganization",
    name: "BPS Kota Tasikmalaya",
  },
};

/** Serialize with `<` escaped (\u003c) so a future dynamic value can never break out of the inline <script> tag */
const jsonLdHtml = JSON.stringify(JSON_LD).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
      />
      <Hero
        heading="Menyediakan data hasil KSA untuk perhitungan prediksi hasil panen padi secara akurat."
        message='"Menyediakan data pertanian yang lebih baik untuk kesejahteraan petani"'
      />
      <AboutKSA />
      <Benefits />
      <KSAMethod/>
      <Algorithm/>
      <RiceGrowthCycle/>
    </main>
  );
}
