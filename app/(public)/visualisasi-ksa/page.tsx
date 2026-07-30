import FaseTanamChart from "@/components/pages/prediction-page/FaseTanamChart";
import FaseTanamMap from "@/components/pages/prediction-page/FaseTanamMap";
import React from "react";

const Page = () => {
  return (
    <div className="pt-20 max-w-7xl mx-auto px-4 space-y-12">
      <FaseTanamChart />
      <FaseTanamMap />
      <div className="max-w-2xl mx-auto text-center text-xs text-muted-foreground px-4 pb-8">
        Menampilkan data historis dari database dan 3 bulan hasil prediksi model
        Random Forest untuk setiap kecamatan di Kota Tasikmalaya.
      </div>
    </div>
  );
};

export default Page;
