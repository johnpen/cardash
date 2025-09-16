'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Music, MapPin, Radio, Settings, Wrench } from 'lucide-react';
import type { Mode } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface HomeModeProps {
  setActiveMode: Dispatch<SetStateAction<Mode>>;
}

const sections: { mode: Mode; label: string; icon: React.ElementType }[] = [
  { mode: 'maintenance', label: 'Maintenance', icon: Wrench },
  { mode: 'audio', label: 'Audio', icon: Music },
  { mode: 'satnav', label: 'Sat Nav', icon: MapPin },
  { mode: 'radio', label: 'Radio', icon: Radio },
  { mode: 'settings', label: 'Settings', icon: Settings },
];

export default function HomeMode({ setActiveMode }: HomeModeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-4xl font-bold mb-8">DriveAI Console</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {sections.map(({ mode, label, icon: Icon }) => (
                <Card 
                    key={mode} 
                    className="p-4 sm:p-6 flex flex-col items-center justify-center gap-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    onClick={() => setActiveMode(mode)}
                >
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                    <span className="text-lg font-medium">{label}</span>
                </Card>
            ))}
        </div>
    </div>
  );
}
