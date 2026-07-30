import InputFile from "@/components/pages/prediction-page/input-file";
import FaseTanamChart from "@/components/pages/prediction-page/FaseTanamChart";
import FaseTanamMap from "@/components/pages/prediction-page/FaseTanamMap";
import React from "react";

const Prediction = () => {
  return (
    <div className="pt-20 max-w-7xl mx-auto px-4 space-y-12">
      <section>
        <FaseTanamChart />
      </section>
      <section>
        <FaseTanamMap />
      </section>
      <section>
        <InputFile />
      </section>
    </div>
  );
};

export default Prediction;
