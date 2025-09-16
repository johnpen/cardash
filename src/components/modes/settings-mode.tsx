'use client';

import { Lightbulb, Lock, Sun, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

const settingsItems = [
    { id: 'ambient-light', label: 'Ambient Lighting', icon: Lightbulb },
    { id: 'auto-lock', label: 'Auto-Lock Doors', icon: Lock },
    { id: 'daytime-lights', label: 'Daytime Running Lights', icon: Sun },
];

export default function SettingsMode() {
  return (
    <div className="flex justify-center items-start h-full p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Car Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
            {settingsItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                    <Label htmlFor={item.id} className="flex items-center gap-3 text-lg">
                        <item.icon className="h-6 w-6 text-primary" />
                        <span>{item.label}</span>
                    </Label>
                    <Switch id={item.id} defaultChecked={item.id === 'daytime-lights'} />
                </div>
            ))}

            <div className="space-y-4">
                <Label className="flex items-center gap-3 text-lg">
                    <Volume2 className="h-6 w-6 text-primary" />
                    <span>System Volume</span>
                </Label>
                <Slider defaultValue={[50]} max={100} step={1} />
            </div>

            <div className="space-y-4">
                <Label className="flex items-center gap-3 text-lg">
                    <Sun className="h-6 w-6 text-primary" />
                    <span>Display Brightness</span>
                </Label>
                <Slider defaultValue={[80]} max={100} step={1} />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
