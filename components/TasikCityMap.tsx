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
    /** Fase dominan per kecamatan untuk tiap bulan: [{ kecamatan, "2026-06": fase, ... }] */
    dataFase: any[];
    phaseColorMapping: (phase: number | null) => string;
    selectedMonth: string;
}

const TasikCityMap: React.FC<TasikCityMapProps> = ({
    geoJsonKecamatan,
    dataFase,
    phaseColorMapping,
    selectedMonth,
}) => {
    const center: LatLngExpression = [-7.35, 108.22];

    const faseLookup = useMemo(() => {
        const lookup = new Map<string, number | null>();
        dataFase.forEach((d: any) => {
            const fase = d[selectedMonth];
            lookup.set(d.kecamatan, fase ?? null);
        });
        return lookup;
    }, [dataFase, selectedMonth]);

    const processedKecamatanGeoJSON = useMemo(() => {
        if (!geoJsonKecamatan || !geoJsonKecamatan.features) {
            return null;
        }

        const processedFeatures = geoJsonKecamatan.features.map((kecamatanFeature: any) => {
            const fase = faseLookup.get(kecamatanFeature.properties.KECAMATAN) ?? null;
            const color = phaseColorMapping(fase);
            return {
                ...kecamatanFeature,
                properties: {
                    ...kecamatanFeature.properties,
                    color: color,
                    fase: fase,
                }
            };
        });

        return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;
    }, [geoJsonKecamatan, faseLookup, phaseColorMapping]);

    const styleKecamatan = (feature: any) => {
        const fillColor = feature.properties.color || '#BDBDBD';
        return {
            fillColor: fillColor,
            weight: 2,
            color: '#FFFFFF',
            fillOpacity: 0.7,
        };
    };

    const onEachKecamatan = (feature: any, layer: any) => {
        layer.bindTooltip(`Kecamatan: ${feature.properties.KECAMATAN}`, { permanent: true, direction: 'center', className: 'kecamatan-label' });

        const faseLabel = feature.properties.fase != null
            ? (yAxisValueMap[String(feature.properties.fase)] || 'N/A')
            : 'Belum ada data';
        layer.bindPopup(`<h3>Fase Dominan ${feature.properties.KECAMATAN} (${formatKsaDate(selectedMonth)}):</h3><p><strong>${faseLabel}</strong></p>`);
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
