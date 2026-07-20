import AboutKsa from "@/components/pages/landing-page/AboutKsa";
import Algoritma from "@/components/pages/landing-page/Algoritma";
import Benefits from "@/components/pages/landing-page/Benefits";
import Hero from "@/components/pages/landing-page/Hero";
import MetodeKsa from "@/components/pages/landing-page/MetodeKsa";
import SiklusTumbuhPadi from "@/components/pages/landing-page/Siklus-Tumbuh-Padi";

export default function Home() {
  return (
    <main>
      <Hero
        heading="Menyediakan data hasil KSA untuk perhitungan prediksi hasil panen padi secara akurat."
        message='"Menyediakan data pertanian yang lebih baik untuk kesejahteraan petani"'
      />
      <AboutKsa />
      <Benefits />
      <MetodeKsa/>
      <Algoritma/>
      <SiklusTumbuhPadi/>
    </main>
  );
}
