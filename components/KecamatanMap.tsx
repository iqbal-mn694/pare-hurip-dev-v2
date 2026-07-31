// C:\Project\ksa-produksi-padi\components\KecamatanMap.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';
 
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';
import * as turf from '@turf/turf';
import { GeoJsonObject } from 'geojson';

// PERBAIKAN: Import helper functions dari file utils.tsx
import { yAxisValueMap, getPhaseColor, formatKsaDate } from "@/lib/utils"; // Pastikan formatKsaDate juga diimport jika digunakan di sini

interface KecamatanMapProps {
    geoJsonKecamatan: any;
    geoJsonSawah: any;
    dataFase: any[]; 
    selectedMonth: string;
    phaseColorMapping: (phase: number | null) => string;
}

const KecamatanMap: React.FC<KecamatanMapProps> = ({ geoJsonKecamatan, geoJsonSawah, dataFase, selectedMonth, phaseColorMapping }) => {
    const center: LatLngExpression = [-7.35, 108.22];

    const faseLookup = useMemo(() => {
        const lookup = new Map();
        dataFase.forEach(d => {
            lookup.set(d.kecamatan, d[selectedMonth]);
        });
        return lookup;
    }, [dataFase, selectedMonth]);

    const processedSawahGeoJSON = useMemo(() => {
        if (!geoJsonSawah || !geoJsonSawah.features || faseLookup.size === 0) {
            return null;
        }

        const processedFeatures = geoJsonSawah.features.map((sawahFeature: any) => {
            const pointInSawah = turf.pointOnFeature(sawahFeature);
            let kecamatanName = 'Tidak Diketahui';

            for (const kecamatanFeature of geoJsonKecamatan.features) {
                if (kecamatanFeature.properties && kecamatanFeature.properties.KECAMATAN && turf.booleanPointInPolygon(pointInSawah, kecamatanFeature)) {
                    kecamatanName = kecamatanFeature.properties.KECAMATAN;
                    break;
                }
            }

            const fase = faseLookup.get(kecamatanName);
            const color = phaseColorMapping(fase ?? null);

            return {
                ...sawahFeature,
                properties: {
                    ...sawahFeature.properties,
                    kecamatan: kecamatanName,
                    fase: fase,
                    color: color,
                }
            };
        });

        return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;

    }, [geoJsonSawah, geoJsonKecamatan, faseLookup, phaseColorMapping]);

    const styleSawah = (feature: any) => {
        const defaultFillColor = feature.properties.color || '#808080';
        let fillOpacity = 0.8;

        if (feature.properties.kecamatan === 'Kawalu' || feature.properties.kecamatan === 'Tamansari') {
            fillOpacity = 0.4;
        }

        return {
            fillColor: defaultFillColor,
            weight: 0.5,
            color: 'white',
            fillOpacity: fillOpacity
        };
    };

    const styleKecamatanBoundary = () => {
        return {
            fillColor: 'transparent',
            weight: 2,
            color: '#808080',
            fillOpacity: 0
        };
    };


    const onEachSawah = (feature: any, layer: any) => {
        const { kecamatan, fase } = feature.properties;
        layer.bindTooltip(`Kecamatan: ${kecamatan}<br/>Fase: ${yAxisValueMap[String(fase)] || 'N/A'}`);
    };

    const onEachKecamatanBoundary = (feature: any, layer: any) => {
        layer.bindTooltip(feature.properties.KECAMATAN, { permanent: true, direction: 'center', className: 'kecamatan-label' });
    };

    return (
        <MapContainer center={center}   scrollWheelZoom={false} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {geoJsonKecamatan && (
                <GeoJSON
                    data={geoJsonKecamatan}
                    style={styleKecamatanBoundary}
                    onEachFeature={onEachKecamatanBoundary}
                />
            )}

            {processedSawahGeoJSON && (
                <GeoJSON
                    key={selectedMonth}
                    data={processedSawahGeoJSON}
                    style={styleSawah}
                    onEachFeature={onEachSawah}
                />
            )}
        </MapContainer>
    );
};

export default KecamatanMap;