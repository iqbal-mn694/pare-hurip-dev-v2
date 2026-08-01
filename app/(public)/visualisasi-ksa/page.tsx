import FaseTanamChart from "@/components/pages/prediction-page/FaseTanamChart";
import FaseTanamMap from "@/components/pages/prediction-page/FaseTanamMap";
import React from "react";

const Page = () => {
  return (
    <div className="pt-20 max-w-7xl mx-auto px-4 space-y-12">
      <FaseTanamChart />
      <FaseTanamMap />
    </div>
  );
};

export default Page;
