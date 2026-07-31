/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet'; 
import { GeoJsonObject } from 'geojson';
 
import { yAxisValueMap, formatKsaDate } from "@/lib/utils";

interface TasikCityMapProps {
    geoJsonKecamatan: any;
    dataFaseKota: number | null; 
    phaseColorMapping: (phase: number | null) => string;
    selectedMonth: string;
}

const TasikCityMap: React.FC<TasikCityMapProps> = ({
    geoJsonKecamatan,
    dataFaseKota,
    phaseColorMapping,
    selectedMonth,
}) => {
    const center: LatLngExpression = [-7.35, 108.22];

    const processedKecamatanGeoJSON = useMemo(() => {
        if (!geoJsonKecamatan || !geoJsonKecamatan.features) {
            return null;
        }

        const color = phaseColorMapping(dataFaseKota); 

        const processedFeatures = geoJsonKecamatan.features.map((kecamatanFeature: any) => {
            return {
                ...kecamatanFeature,
                properties: {
                    ...kecamatanFeature.properties,
                    color: color,
                    fase: dataFaseKota,
                }
            };
        });

        return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;
    }, [geoJsonKecamatan, dataFaseKota, phaseColorMapping]);

    const styleKecamatan = (feature: any) => {
        const fillColor = feature.properties.color || '#BDBDBD';
        return {
            fillColor: fillColor,
            weight: 2,
            color: '#808080',
            fillOpacity: 0.4,
        };
    };

    const onEachKecamatan = (feature: any, layer: any) => {
        layer.bindTooltip(`Kecamatan: ${feature.properties.KECAMATAN}`, { permanent: true, direction: 'center', className: 'kecamatan-label' });

        const faseLabel = yAxisValueMap[String(feature.properties.fase)] || 'N/A';
        layer.bindPopup(`<h3>Fase Dominan Kota (${formatKsaDate(selectedMonth)}):</h3><p><strong>${faseLabel}</strong></p>`);
    };

    return (
        <MapContainer key={selectedMonth} center={center} zoom={11} scrollWheelZoom={false} style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {processedKecamatanGeoJSON && (
                <GeoJSON
                    data={processedKecamatanGeoJSON}
                    style={styleKecamatan}
                    onEachFeature={onEachKecamatan}
                />
            )}
        </MapContainer>
    );
};

export default TasikCityMap;