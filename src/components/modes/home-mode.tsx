'use client';

import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Fuel, Battery, AlertTriangle, Droplets, Fan, Thermometer } from 'lucide-react';
import type { Mode, CarMaintenanceData, LocationData } from '@/lib/types';
import { getCarMaintenanceData } from '@/services/hm-vehicle-api';
import { useLog } from '@/components/debug/log-context';
import { cn } from '@/lib/utils';

interface HomeModeProps {
  setActiveMode: Dispatch<SetStateAction<Mode>>;
}

const AnalogueGauge = ({
  value,
  max,
  label,
  unit,
  markers,
  colorSegments
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  markers: { value: number; label: string }[];
  colorSegments?: { max: number; color: string }[];
}) => {
  const minAngle = -135;
  const maxAngle = 135;
  const angleRange = maxAngle - minAngle;

  const valueToAngle = (v: number) => (v / max) * angleRange + minAngle;

  const describeArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
    const start = {
      x: cx + radius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: cy + radius * Math.sin((startAngle - 90) * Math.PI / 180),
    };
    const end = {
      x: cx + radius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: cy + radius * Math.sin((endAngle - 90) * Math.PI / 180),
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };
  
  const needleAngle = valueToAngle(value);

  return (
    <div className="relative w-80 h-56 flex flex-col items-center justify-end">
      <svg viewBox="0 0 200 120" className="w-full h-auto absolute top-0">
        {/* Background Arc */}
        <path d={describeArc(100, 100, 70, minAngle, maxAngle)} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />

        {/* Markers */}
        {markers.map(marker => {
          const markerAngle = valueToAngle(marker.value);
          const x1 = 100 + 60 * Math.cos((markerAngle - 90) * Math.PI / 180);
          const y1 = 100 + 60 * Math.sin((markerAngle - 90) * Math.PI / 180);
          const x2 = 100 + 78 * Math.cos((markerAngle - 90) * Math.PI / 180);
          const y2 = 100 + 78 * Math.sin((markerAngle - 90) * Math.PI / 180);
          const tx = 100 + 50 * Math.cos((markerAngle - 90) * Math.PI / 180);
          const ty = 100 + 50 * Math.sin((markerAngle - 90) * Math.PI / 180);

          return (
            <g key={marker.value}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
               <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--foreground))" fontSize="12">
                {marker.label}
              </text>
            </g>
          )
        })}

        {/* Needle */}
        <g transform={`rotate(${needleAngle} 100 100)`}>
          <path d="M 100 100 L 100 30" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill="hsl(var(--primary))" />
        </g>
      </svg>
      <div className="text-center z-10 -translate-y-4">
        <p className="text-sm font-medium uppercase text-muted-foreground">{label} ({unit})</p>
      </div>
    </div>
  );
};


const WarningLight = ({ icon: Icon, label, active, activeClass = 'text-red-500' }: { icon: React.ElementType, label: string, active: boolean, activeClass?: string }) => (
    <div className="flex flex-col items-center gap-1">
        <Icon className={cn('h-8 w-8 transition-colors', active ? activeClass : 'text-muted-foreground/30')} />
        <span className={cn('text-xs font-medium transition-colors', active ? 'text-foreground' : 'text-muted-foreground/50')}>{label}</span>
    </div>
);

const haversineDistance = (coords1: LocationData, coords2: LocationData) => {
    const R = 6371e3; // metres
    const φ1 = coords1.latitude * Math.PI/180;
    const φ2 = coords2.latitude * Math.PI/180;
    const Δφ = (coords2.latitude-coords1.latitude) * Math.PI/180;
    const Δλ = (coords2.longitude-coords1.longitude) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // in metres
};

export default function HomeMode({ setActiveMode }: HomeModeProps) {
  const [data, setData] = useState<CarMaintenanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useLog();
  const [speed, setSpeed] = useState(0);

  const prevLocationRef = useRef<{location: LocationData, timestamp: number} | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const maintenanceData = await getCarMaintenanceData();
      setData(maintenanceData);
      setError(null);
      
      if (maintenanceData.location) {
        const now = Date.now();
        if (prevLocationRef.current) {
          const { location: prevLocation, timestamp: prevTimestamp } = prevLocationRef.current;
          
          if (prevLocation.latitude !== maintenanceData.location.latitude || prevLocation.longitude !== maintenanceData.location.longitude) {
            const distance = haversineDistance(prevLocation, maintenanceData.location);
            const timeDiff = (now - prevTimestamp) / 1000; // in seconds

            if (timeDiff > 0) {
              const speedMps = distance / timeDiff; // meters per second
              const speedMph = speedMps * 2.23694;
              setSpeed(speedMph);
            }
          }
        }
        prevLocationRef.current = { location: maintenanceData.location, timestamp: now };
      }

    } catch (e: any) {
        const errorMessage = e.message || 'Failed to fetch maintenance data.';
        setError(errorMessage);
        addLog(`Dashboard data fetch error: ${errorMessage}`, 'error');
    }
  }, [addLog]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const hasEngineTempIssue = !data?.temperatures.engine.ok;
  const hasOilIssue = !data?.temperatures.oil.ok || !data?.fluidLevels.oil.ok;
  const hasCoolantIssue = !data?.temperatures.coolant.ok || !data?.fluidLevels.coolant.ok;
  const hasBrakeIssue = !data?.fluidLevels.brake.ok;

  const speedMarkers = [
    { value: 0, label: '0' }, { value: 20, label: '20' }, { value: 40, label: '40' },
    { value: 60, label: '60' }, { value: 80, label: '80' }, { value: 100, label: '100' }, 
    { value: 120, label: '120' }, { value: 140, label: '140' }, { value: 160, label: '160' }
  ];

  return (
    <div className="flex flex-col items-center justify-around h-full p-4">
        <div className="grid grid-cols-3 gap-y-4 gap-x-8 w-full max-w-lg">
            <WarningLight icon={AlertTriangle} label="Check Engine" active={!!data?.controlMessages.some(m => m.message === 'engine indicator')} />
            <WarningLight icon={Droplets} label="Oil Pressure" active={hasOilIssue} />
            <WarningLight icon={Fan} label="Coolant" active={hasCoolantIssue} activeClass="text-yellow-400" />
            <WarningLight icon={AlertTriangle} label="Brakes" active={hasBrakeIssue} />
            <WarningLight icon={Battery} label="Battery" active={false} />
            <WarningLight icon={Thermometer} label="Engine Temp" active={hasEngineTempIssue} activeClass="text-yellow-400" />
        </div>

        <div className="flex items-center justify-center gap-8 lg:gap-16 w-full -mt-8">
            <AnalogueGauge 
              value={speed}
              max={160} 
              label="Speed" 
              unit="mph" 
              markers={speedMarkers}
            />
        </div>

         {error && <div className="absolute bottom-4 text-xs text-destructive font-medium">{error}</div>}
    </div>
  );
}
