import AnalysisDashboard from '@/components/pages/prediction-page/visual-page/AnalysisDashboard'
import FaseTanamChart from '@/components/pages/prediction-page/FaseTanamChart'
import React from 'react'

const page = () => {
  return (
    <>
      <div className="mt-20">
        <AnalysisDashboard/>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Prediksi Fase Tanam per Kecamatan</h2>
          <p className="text-sm text-muted-foreground">
            Bandingkan prediksi fase tanam antar kecamatan berdasarkan model Random Forest.
          </p>
        </div>
        <FaseTanamChart />
      </div>
    </>
  )
}

export default page
