import InputFile from "@/components/pages/prediction-page/input-file";
import FaseTanamChart from "@/components/pages/prediction-page/FaseTanamChart";
import React from "react";

const Prediction = () => {
  return (
    <div className="mt-20 space-y-10">
      <section>
        <FaseTanamChart />
      </section>
      <section>
        <InputFile />
      </section>
    </div>
  );
};

export default Prediction;
