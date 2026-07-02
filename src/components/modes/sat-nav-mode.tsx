'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { Car, MapPin } from 'lucide-react';
import { getCarMaintenanceData } from '@/services/hm-vehicle-api';
import type { LocationData } from '@/lib/types';
import { useLog } from '@/components/debug/log-context';
import Map, { Marker, Source, Layer, LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = "https://api.maptiler.com/maps/streets-v4/style.json?key=im5ZPUti3RnR1BymJL8u";



export default function SatNavMode() {
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);
    const [error, setError] = useState<string | null>(null);
    const { addLog } = useLog();

    const [viewState, setViewState] = useState({
        longitude: -0.09,
        latitude: 51.505,
        heading : 0,
        zoom: 19
    });

    const fetchData = useCallback(async () => {
        try {
            const data = await getCarMaintenanceData();
            if (data.location) {
                const newLocation: [number, number, number] = [data.location.longitude, data.location.latitude, data.location.heading];
                setLocationData(data.location);

                setViewState(vs => ({
                    ...vs,
                    longitude: data.location.longitude,
                    latitude: data.location.latitude,
                }));
                
                setPath(prevPath => {
                    const lastPoint = prevPath[prevPath.length - 1];
                    if (lastPoint && lastPoint[0] === newLocation[0] && lastPoint[1] === newLocation[1]) {
                        return prevPath;
                    }
                    return [...prevPath, newLocation]
                });
                setError(null);
            } else {
                setError("Location data not available from API.");
                addLog("Location data not available from API.", "warn");
            }
        } catch (e: any) {
            const errorMessage = e.message || 'Failed to fetch location data.';
            setError(errorMessage);
            addLog(`SatNav data fetch error: ${errorMessage}`, 'error');
        }
    }, [addLog]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 2000);
        return () => clearInterval(intervalId);
    }, [fetchData]);
    
    const pathGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: path
        }
    };

    if (error && !locationData) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center p-4">
                    <MapPin className="h-12 w-12 mx-auto text-destructive mb-4" />
                    <h2 className="text-lg font-semibold">Map Unavailable</h2>
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            </div>
        );
    }
    
    if (!locationData) {
        return <div className="flex items-center justify-center h-full"><Car className="h-16 w-16 animate-pulse" /></div>;
    }

    return (
        <div className="h-full w-full rounded-lg overflow-hidden relative">
            <Map zoom={20} pitch={120}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{width: '100%', height: '100%'}}
                mapStyle={MAP_STYLE}
            >

                <Marker longitude={locationData.longitude} latitude={locationData.latitude} anchor="center">
                     <div className="text-primary">
                        <Car className="h-8 w-8" style={{ transform: `rotate(${locationData.heading || 0}deg)` }} />
                     </div>
                </Marker>
            </Map>
        </div>
    );
}
